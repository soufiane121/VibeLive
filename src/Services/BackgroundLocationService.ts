import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Background task name for location updates
const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Storage keys
const LOCATION_PERMISSION_GRANTED_KEY = '@vibelive:location_permission_granted';
const BACKGROUND_MODE_ENABLED_KEY = '@vibelive:background_location_enabled';

// Location update interval in milliseconds (30 seconds for background)
const BACKGROUND_UPDATE_INTERVAL = 30000;
// Minimum distance between updates in meters (10 meters)
const MINIMUM_DISTANCE = 10;

// Accuracy level
const LOCATION_ACCURACY = Location.Accuracy.Balanced;

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'limited';

export interface LocationServiceConfig {
  updateInterval?: number;
  minimumDistance?: number;
  accuracy?: Location.Accuracy;
  showBackgroundIndicator?: boolean;
}

class BackgroundLocationService {
  private static instance: BackgroundLocationService;
  private isRunning: boolean = false;
  private isForeground: boolean = true;
  private locationSubscription: Location.LocationSubscription | null = null;
  private lastKnownLocation: LocationCoordinates | null = null;
  private config: Required<LocationServiceConfig>;
  private locationCallbacks: Set<(location: LocationCoordinates) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private backgroundTrackingMutex: boolean = false;

  private constructor(config: LocationServiceConfig = {}) {
    this.config = {
      updateInterval: config.updateInterval || BACKGROUND_UPDATE_INTERVAL,
      minimumDistance: config.minimumDistance || MINIMUM_DISTANCE,
      accuracy: config.accuracy || LOCATION_ACCURACY,
      showBackgroundIndicator: config.showBackgroundIndicator ?? true,
    };

    this.setupAppStateListener();
  }

  public static getInstance(config?: LocationServiceConfig): BackgroundLocationService {
    if (!BackgroundLocationService.instance) {
      BackgroundLocationService.instance = new BackgroundLocationService(config);
    }
    return BackgroundLocationService.instance;
  }

  /**
   * Initialize the location service and check permissions
   */
  public async initialize(): Promise<LocationPermissionStatus> {
    try {
      console.log('[BackgroundLocationService] Initializing...');

      // Check if foreground permission is granted
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      console.log('[BackgroundLocationService] Foreground permission status:', foregroundStatus.status);

      if (foregroundStatus.status !== 'granted') {
        console.log('[BackgroundLocationService] Requesting foreground permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.error('[BackgroundLocationService] Foreground permission denied');
          await AsyncStorage.setItem(LOCATION_PERMISSION_GRANTED_KEY, 'false');
          return status;
        }
      }

      await AsyncStorage.setItem(LOCATION_PERMISSION_GRANTED_KEY, 'true');

      // Check if background permission is granted (for iOS)
      if (Platform.OS === 'ios') {
        const backgroundStatus = await Location.getBackgroundPermissionsAsync();
        console.log('[BackgroundLocationService] Background permission status:', backgroundStatus.status);

        if (backgroundStatus.status !== 'granted') {
          console.log('[BackgroundLocationService] Background permission not granted, requesting...');
          const { status } = await Location.requestBackgroundPermissionsAsync();
          
          if (status !== 'granted') {
            console.warn('[BackgroundLocationService] Background permission denied, foreground only');
          } else {
            await AsyncStorage.setItem(BACKGROUND_MODE_ENABLED_KEY, 'true');
          }
          return status;
        }
        await AsyncStorage.setItem(BACKGROUND_MODE_ENABLED_KEY, 'true');
      }

      console.log('[BackgroundLocationService] Initialization complete');
      return 'granted';
    } catch (error) {
      console.error('[BackgroundLocationService] Initialization error:', error);
      this.notifyError(error as Error);
      return 'denied';
    }
  }

  /**
   * Start location tracking in foreground
   */
  public async startForegroundTracking(): Promise<boolean> {
    try {
      console.log('[BackgroundLocationService] Starting foreground tracking...');

      const permissionStatus = await this.initialize();
      if (permissionStatus !== 'granted') {
        console.error('[BackgroundLocationService] Cannot start tracking: permission not granted');
        return false;
      }

      // Stop any existing subscription
      if (this.locationSubscription) {
        await this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Start watching position
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: this.config.accuracy,
          distanceInterval: this.config.minimumDistance,
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isRunning = true;
      console.log('[BackgroundLocationService] Foreground tracking started');
      return true;
    } catch (error) {
      console.error('[BackgroundLocationService] Error starting foreground tracking:', error);
      this.notifyError(error as Error);
      return false;
    }
  }

  /**
   * Start background location tracking using Task Manager
   */
  public async startBackgroundTracking(): Promise<boolean> {
    // Mutex to prevent race conditions when multiple calls happen simultaneously
    if (this.backgroundTrackingMutex) {
      console.log('[BackgroundLocationService] Background tracking already in progress, skipping...');
      return this.isRunning;
    }

    this.backgroundTrackingMutex = true;

    try {
      console.log('[BackgroundLocationService] Starting background tracking...');

      const permissionStatus = await this.initialize();
      if (permissionStatus !== 'granted') {
        console.error('[BackgroundLocationService] Cannot start background tracking: permission not granted');
        return false;
      }

      // For iOS, background location requires foreground permission + background permission
      if (Platform.OS === 'ios') {
        const backgroundStatus = await Location.getBackgroundPermissionsAsync();
        if (backgroundStatus.status !== 'granted') {
          console.error('[BackgroundLocationService] Background permission not granted');
          return false;
        }
      }

      // Always (re)register the task so the latest options are applied.
      // A stale registration from a previous launch would otherwise keep old
      // options and silently ignore the new ones.
      const isTaskDefined = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isTaskDefined) {
        console.log('[BackgroundLocationService] Background task already registered, restarting to apply latest options...');
        try {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        } catch (stopError) {
          console.warn('[BackgroundLocationService] Error stopping previous task (continuing):', (stopError as Error).message);
        }
      } else {
        console.log('[BackgroundLocationService] Background task not registered, registering...');
      }

      // Options tuned to deliver stationary samples to the geofence pipeline.
      // Dwell detection in GeofenceMonitorService requires repeated pings while
      // the user sits at a venue — iOS must NOT auto-pause updates and must NOT
      // filter out stationary reports (distanceInterval: 0).
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: this.config.accuracy,
        distanceInterval: 0, // deliver every update; 4-gate pipeline does the filtering
        // ── iOS-only tuning ─────────────────────────────────────────────
        // pausesUpdatesAutomatically=false is THE fix for stationary users.
        // When true (CLLocationManager's native default), iOS auto-suspends
        // delivery as soon as it thinks the user has stopped moving — which
        // is exactly when we need the pings to accumulate dwell time.
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.OtherNavigation,
        showsBackgroundLocationIndicator: true, // transparency: blue bar while tracking TODO:: SHOW BLUE MARKER on phone screen
        deferredUpdatesInterval: 60_000, // batch delivery every ~60s to save battery
        deferredUpdatesDistance: 5,      // ...or every 5m, whichever comes first
      });

      this.isRunning = true;
      await AsyncStorage.setItem(BACKGROUND_MODE_ENABLED_KEY, 'true');
      console.log('[BackgroundLocationService] Background tracking started');
      return true;
    } catch (error) {
      console.error('[BackgroundLocationService] Error starting background tracking:', error);
      this.notifyError(error as Error);
      return false;
    } finally {
      this.backgroundTrackingMutex = false;
    }
  }

  /**
   * Stop location tracking
   */
  public async stopTracking(): Promise<void> {
    try {
      console.log('[BackgroundLocationService] Stopping location tracking...');

      // Stop foreground subscription
      if (this.locationSubscription) {
        await this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Stop background task
      const isTaskDefined = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isTaskDefined) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      this.isRunning = false;
      await AsyncStorage.setItem(BACKGROUND_MODE_ENABLED_KEY, 'false');
      console.log('[BackgroundLocationService] Location tracking stopped');
    } catch (error) {
      console.error('[BackgroundLocationService] Error stopping tracking:', error);
      this.notifyError(error as Error);
    }
  }

  /**
   * Get current location once
   */
  public async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      console.log('[BackgroundLocationService] Getting current location...');

      const permissionStatus = await this.initialize();
      if (permissionStatus !== 'granted') {
        console.error('[BackgroundLocationService] Cannot get location: permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coordinates = this.parseLocation(location);
      this.lastKnownLocation = coordinates;
      
      console.log('[BackgroundLocationService] Current location:', coordinates);
      return coordinates;
    } catch (error) {
      console.error('[BackgroundLocationService] Error getting current location:', error);
      this.notifyError(error as Error);
      return null;
    }
  }

  /**
   * Get last known location
   */
  public getLastKnownLocation(): LocationCoordinates | null {
    return this.lastKnownLocation;
  }

  /**
   * Check if tracking is active
   */
  public isTracking(): boolean {
    return this.isRunning;
  }

  /**
   * Check if background mode is enabled
   */
  public async isBackgroundEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BACKGROUND_MODE_ENABLED_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Register callback for location updates
   */
  public onLocationUpdate(callback: (location: LocationCoordinates) => void): () => void {
    this.locationCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.locationCallbacks.delete(callback);
    };
  }

  /**
   * Register callback for errors
   */
  public onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * Handle incoming location updates
   */
  private handleLocationUpdate(location: Location.LocationObject): void {
    try {
      const coordinates = this.parseLocation(location);
      this.lastKnownLocation = coordinates;

      console.log('[BackgroundLocationService] Location update:', {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: coordinates.accuracy,
      });

      // Notify all registered callbacks
      this.locationCallbacks.forEach(callback => {
        try {
          callback(coordinates);
        } catch (error) {
          console.error('[BackgroundLocationService] Error in location callback:', error);
        }
      });
    } catch (error) {
      console.error('[BackgroundLocationService] Error handling location update:', error);
      this.notifyError(error as Error);
    }
  }

  /**
   * Parse location object to coordinates
   */
  private parseLocation(location: Location.LocationObject): LocationCoordinates {
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      heading: location.coords.heading,
      timestamp: location.timestamp || Date.now(),
    };
  }

  /**
   * Notify error callbacks
   */
  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('[BackgroundLocationService] Error in error callback:', callbackError);
      }
    });
  }

  /**
   * Setup app state listener to handle foreground/background transitions
   */
  private setupAppStateListener(): void {
    // Remove existing subscription if any to prevent duplicates
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = this.isForeground ? 'active' : 'background';
      this.isForeground = nextAppState === 'active';

      console.log('[BackgroundLocationService] App state changed:', {
        previous: previousState,
        current: nextAppState,
      });

      // When app goes to background, ensure background task is running
      if (nextAppState === 'background' && this.isRunning) {
        console.log('[BackgroundLocationService] App went to background, ensuring background task...');
        this.startBackgroundTracking().catch(error => {
          console.error('[BackgroundLocationService] Failed to start background task:', error);
        });
      }

      // When app comes to foreground, switch to foreground tracking
      if (nextAppState === 'active' && this.isRunning) {
        console.log('[BackgroundLocationService] App came to foreground, switching to foreground tracking...');
        this.startForegroundTracking().catch(error => {
          console.error('[BackgroundLocationService] Failed to start foreground tracking:', error);
        });
      }
    });
  }

  /**
   * Get detailed permission status
   */
  public async getPermissionStatus(): Promise<{
    foreground: LocationPermissionStatus;
    background: LocationPermissionStatus;
  }> {
    try {
      const foreground = await Location.getForegroundPermissionsAsync();
      const background = await Location.getBackgroundPermissionsAsync();

      return {
        foreground: foreground.status as LocationPermissionStatus,
        background: background.status as LocationPermissionStatus,
      };
    } catch (error) {
      console.error('[BackgroundLocationService] Error getting permission status:', error);
      return {
        foreground: 'denied',
        background: 'denied',
      };
    }
  }

  /**
   * Reset service state (useful for testing)
   */
  public async reset(): Promise<void> {
    await this.stopTracking();
    this.locationCallbacks.clear();
    this.errorCallbacks.clear();
    this.lastKnownLocation = null;
    
    // Clean up app state subscription
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    console.log('[BackgroundLocationService] Service reset');
  }

  /**
   * Called by background task to update location state safely.
   * This avoids the need for (service as any) casts in the task.
   *
   * IMPORTANT: Do NOT filter by distance here. Dwell detection in
   * GeofenceMonitorService requires repeated near-identical (stationary)
   * samples to accumulate the 15-minute dwell threshold. Any distance-based
   * suppression here silently breaks background dwell detection. The
   * GeofenceMonitorService 4-gate pipeline is the authoritative filter.
   */
  public handleBackgroundLocationUpdate(coordinates: LocationCoordinates): void {
    // // Distance filter — skip if movement is less than MINIMUM_DISTANCE from last known
    // if (this.lastKnownLocation) {
    //   const dlat = coordinates.latitude - this.lastKnownLocation.latitude;
    //   const dlng = coordinates.longitude - this.lastKnownLocation.longitude;
    //   // Quick Euclidean approximation in meters (accurate enough at city scale)
    //   const latM = dlat * 111_320;
    //   const lngM = dlng * 111_320 * Math.cos(this.lastKnownLocation.latitude * Math.PI / 180);
    //   const distM = Math.sqrt(latM * latM + lngM * lngM);
    //   if (distM < this.config.minimumDistance) {
    //     return; // GPS jitter — suppress callback to save CPU
    //   }
    // }

    this.lastKnownLocation = coordinates;

    // Notify all registered callbacks
    this.locationCallbacks.forEach(callback => {
      try {
        callback(coordinates);
      } catch (error) {
        console.error('[BackgroundLocationService] Error in background callback:', error);
      }
    });
  }
}

// Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  try {
    if (error) {
      console.error('[BackgroundLocationTask] Task error:', error);
      return;
    }

    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      
      if (locations && locations.length > 0) {
        const location = locations[0];
        const service = BackgroundLocationService.getInstance();
        
        const coordinates: LocationCoordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
          timestamp: location.timestamp || Date.now(),
        };

        console.log('[BackgroundLocationTask] Background location update:', {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });

        // Use the public method instead of accessing private members
        service.handleBackgroundLocationUpdate(coordinates);
      }
    }
  } catch (taskError) {
    console.error('[BackgroundLocationTask] Fatal error:', taskError);
  }
});

// Export class and task name
export { BackgroundLocationService, BACKGROUND_LOCATION_TASK };

// Export singleton instance as default for convenience
export default BackgroundLocationService.getInstance();
