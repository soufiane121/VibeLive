import {AppState, AppStateStatus} from 'react-native';
import * as Location from 'expo-location';
import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../Utils/LocalStorageHelper';

// Configuration constants
const LOCATION_UPDATE_INTERVAL_MS = 15000; // 15 seconds - balanced for battery vs responsiveness
const BACKGROUND_UPDATE_INTERVAL_MS = 60000; // 60 seconds in background for battery savings
const MIN_DISTANCE_CHANGE_METERS = 5; // Minimum movement to trigger update (optimized for geofencing)
const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_DEGREE = 111_320;

// Precompute squared threshold for fast distance check
const FAST_THRESHOLD_DEG = MIN_DISTANCE_CHANGE_METERS / METERS_PER_DEGREE;
const FAST_THRESHOLD_DEG_SQ = FAST_THRESHOLD_DEG * FAST_THRESHOLD_DEG;

// Expo location accuracy mapping
const FOREGROUND_ACCURACY = Location.Accuracy.Balanced;
const BACKGROUND_ACCURACY = Location.Accuracy.Low;

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface GeofenceConfig {
  enabled: boolean;
  radiusMeters: number;
  batteryThreshold: number;
}

type GeofenceCallback = (venues: any[]) => void;
type ErrorCallback = (error: string) => void;

class GeofenceMonitorService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  private lastLocation: LocationUpdate | null = null;
  private lastSentLocation: LocationUpdate | null = null; // Track what was actually sent to server
  private config: GeofenceConfig = {
    enabled: true,
    radiusMeters: 5,
    batteryThreshold: 15,
  };
  private onVenuesDetected: GeofenceCallback | null = null;
  private onError: ErrorCallback | null = null;
  private appState: AppStateStatus = 'active';
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private isMonitoring: boolean = false;
  private permissionGranted: boolean = false;
  private initializationMutex: boolean = false;

  configure(config: Partial<GeofenceConfig>): void {
    this.config = {...this.config, ...config};
  }

  /**
   * Initialize location permissions
   */
  private async _initializePermissions(): Promise<boolean> {
    if (this.permissionGranted) return true;
    if (this.initializationMutex) return this.permissionGranted;

    this.initializationMutex = true;

    try {
      const {status: foregroundStatus} = await Location.getForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('[GeofenceMonitor] Foreground permission denied');
          this.onError?.('Location permission denied');
          return false;
        }
      }

      this.permissionGranted = true;
      console.log('[GeofenceMonitor] Permissions granted');
      return true;
    } catch (error: any) {
      console.error('[GeofenceMonitor] Permission error:', error.message);
      this.onError?.(error.message);
      return false;
    } finally {
      this.initializationMutex = false;
    }
  }

  async startMonitoring(onVenuesDetected: GeofenceCallback, onError?: ErrorCallback): Promise<void> {
    if (this.isMonitoring) {
      console.log('[GeofenceMonitor] Already monitoring, skipping...');
      return;
    }

    this.onVenuesDetected = onVenuesDetected;
    this.onError = onError || null;

    // Initialize permissions first
    const hasPermission = await this._initializePermissions();
    if (!hasPermission) {
      console.log('[GeofenceMonitor] Cannot start monitoring: no permission');
      return;
    }

    this.isMonitoring = true;
    console.log('[GeofenceMonitor] Starting monitoring...');

    // Setup app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this._handleAppStateChange,
    );

    // Start location updates
    await this._startLocationUpdates();
    console.log('[GeofenceMonitor] Monitoring started');
  }

  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;

    // Stop location subscription
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    // Clear update timer
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.lastLocation = null;
    this.lastSentLocation = null;
    console.log('[GeofenceMonitor] Monitoring stopped');
  }

  private _handleAppStateChange = (nextAppState: AppStateStatus): void => {
    const wasActive = this.appState === 'active';
    const isNowActive = nextAppState === 'active';
    const isNowBackground = nextAppState === 'background' || nextAppState === 'inactive';

    if (wasActive && isNowBackground) {
      console.log('[GeofenceMonitor] Switching to background mode');
      this._switchToBackgroundMode();
    } else if (!wasActive && isNowActive) {
      console.log('[GeofenceMonitor] Switching to foreground mode');
      this._switchToForegroundMode();
    }

    this.appState = nextAppState;
  };

  private _switchToBackgroundMode(): void {
    // Stop current subscription and timer
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    // Use longer interval in background
    this.updateTimer = setInterval(() => {
      this._getCurrentPosition(BACKGROUND_ACCURACY);
    }, BACKGROUND_UPDATE_INTERVAL_MS);
  }

  private async _switchToForegroundMode(): Promise<void> {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    await this._startLocationUpdates();
  }

  private async _startLocationUpdates(): Promise<void> {
    // Get initial position immediately
    await this._getCurrentPosition(FOREGROUND_ACCURACY);

    // Use watchPositionAsync for efficient foreground updates
    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: FOREGROUND_ACCURACY,
          distanceInterval: MIN_DISTANCE_CHANGE_METERS,
          timeInterval: LOCATION_UPDATE_INTERVAL_MS,
        },
        (location) => {
          this._handleLocationUpdate(location);
        },
      );
    } catch (error: any) {
      console.error('[GeofenceMonitor] watchPositionAsync error:', error.message);
      this.onError?.(error.message);
      
      // Fallback to interval-based polling
      this.updateTimer = setInterval(() => {
        this._getCurrentPosition(FOREGROUND_ACCURACY);
      }, LOCATION_UPDATE_INTERVAL_MS);
    }
  }

  private async _getCurrentPosition(accuracy: Location.Accuracy): Promise<void> {
    if (!this.config.enabled || !this.isMonitoring) return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy,
      });
      this._handleLocationUpdate(location);
    } catch (error: any) {
      console.log('[GeofenceMonitor] getCurrentPosition error:', error.message);
      this.onError?.(error.message);
    }
  }

  private _handleLocationUpdate(location: Location.LocationObject): void {
    const update: LocationUpdate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 10,
      timestamp: location.timestamp || Date.now(),
    };

    // Always update lastLocation for internal tracking
    this.lastLocation = update;

    // Only send to server if moved enough (reduces API calls)
    if (this._hasMovedEnough(update, this.lastSentLocation)) {
      this.lastSentLocation = update;
      this._sendLocationUpdate(update);
    }
  }

  private _hasMovedEnough(newLocation: LocationUpdate, lastSent: LocationUpdate | null): boolean {
    // If never sent, always send
    if (!lastSent) return true;

    const lat1 = lastSent.latitude;
    const lon1 = lastSent.longitude;
    const lat2 = newLocation.latitude;
    const lon2 = newLocation.longitude;

    // Validate coordinates
    if (
      !Number.isFinite(lat1) ||
      !Number.isFinite(lon1) ||
      !Number.isFinite(lat2) ||
      !Number.isFinite(lon2)
    ) {
      return false;
    }

    // Fast identical check
    if (lat1 === lat2 && lon1 === lon2) return false;

    // -------------------------
    // Stage 1 — Fast planar check
    // -------------------------
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const approxDistSq = dLat * dLat + dLon * dLon;

    if (approxDistSq < FAST_THRESHOLD_DEG_SQ) {
      return false;
    }

    // -------------------------
    // Stage 2 — Accurate Haversine
    // -------------------------
    const toRad = Math.PI / 180;

    const lat1Rad = lat1 * toRad;
    const lat2Rad = lat2 * toRad;

    const dLatRad = (lat2 - lat1) * toRad;
    const dLonRad = (lon2 - lon1) * toRad;

    const sinDLat = Math.sin(dLatRad / 2);
    const sinDLon = Math.sin(dLonRad / 2);

    const a =
      sinDLat * sinDLat +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinDLon * sinDLon;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = EARTH_RADIUS_METERS * c;

    return distance >= MIN_DISTANCE_CHANGE_METERS;
  }

  private async _sendLocationUpdate(location: LocationUpdate): Promise<void> {
    try {
      const token = await getLocalData({key: 'token'});
      if (!token) return;

      const response = await fetch(`${baseUrl}/voting/location-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        }),
      });

      const data = await response.json();

      if (data.action === 'notification_sent' && data.venues) {
        this.onVenuesDetected?.(data.venues);
      }
    } catch (error: any) {
      console.log('[GeofenceMonitor] Send location error:', error.message);
    }
  }

  isActive(): boolean {
    return this.isMonitoring;
  }

  getLastLocation(): LocationUpdate | null {
    return this.lastLocation;
  }
  // ═══════════════════════════════════════════════════════════════════════
  // GPX TRACK PLAYER - For testing dwell detection
  // ═══════════════════════════════════════════════════════════════════════

  private gpxTimer: ReturnType<typeof setTimeout> | null = null;
  private gpxPoints: Array<{lat: number; lng: number; delayMs: number}> = [];
  sendManualPosition(lat: number, lng: number) {
    const update: LocationUpdate = {
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      timestamp: Date.now(),
    };

    this.lastLocation = update;
    this._sendLocationUpdate(update);
  }
  /**
   * Play GPX track with proper timing to trigger backend dwell
   *
   * Example - triggers 3-minute bar dwell:
   * geofenceMonitor.playGpxTrack([
   *   { lat: 35.225845, lng: -80.853607, delayMs: 0 },      // start
   *   { lat: 35.215000, lng: -80.830000, delayMs: 5000 }, // +5s
   *   { lat: 35.200000, lng: -80.800000, delayMs: 10000 }, // +10s
   *   { lat: 35.185000, lng: -80.770000, delayMs: 15000 },
   *   { lat: 35.170000, lng: -80.740000, delayMs: 20000 },
   *   { lat: 35.153980, lng: -80.713790, delayMs: 25000 }, // arrive B
   *   // NOW DWELL: same spot, 30s apart, for 3+ minutes
   *   { lat: 35.153980, lng: -80.713790, delayMs: 55000 },  // +30s
   *   { lat: 35.153982, lng: -80.713788, delayMs: 85000 },  // +30s
   *   { lat: 35.153978, lng: -80.713792, delayMs: 115000 }, // +30s
   *   { lat: 35.153981, lng: -80.713789, delayMs: 145000 }, // +30s
   *   { lat: 35.153979, lng: -80.713791, delayMs: 175000 }, // +30s
   *   { lat: 35.153980, lng: -80.713790, delayMs: 205000 }, // ✓ 3min dwell!
   * ]);
   */

  playGpxTrack(points: Array<{lat: number; lng: number; delayMs: number}>) {
    if (this.gpxTimer) {
      this.stopGpxTrack();
    }

    this.gpxPoints = points;
    console.log(`[GPX] Playing ${points.length} points`);

    let index = 0;

    const playNext = () => {
      if (index >= points.length) {
        console.log('[GPX] Track complete');
        return;
      }

      const point = points[index];
      const elapsed = Date.now() - startTime;
      const waitMs = Math.max(0, point.delayMs - elapsed);

      this.gpxTimer = setTimeout(() => {
        // Send to backend
        const update: LocationUpdate = {
          latitude: point.lat,
          longitude: point.lng,
          accuracy: 5 + Math.random() * 5,
          timestamp: Date.now(),
        };

        console.log(
          `[GPX] ${index + 1}/${points.length} at t=${point.delayMs}ms`,
        );

        this.lastLocation = update;
        this._sendLocationUpdate(update);

        index++;
        playNext();
      }, waitMs);
    };

    const startTime = Date.now();
    playNext();
  }

  stopGpxTrack() {
    if (this.gpxTimer) {
      clearTimeout(this.gpxTimer);
      this.gpxTimer = null;
      console.log('[GPX] Stopped');
    }
  }

  isPlayingGpx(): boolean {
    return this.gpxTimer !== null;
  }

  // This WILL trigger dwell (3+ minutes at B with 30s intervals)
  playTestDwell() {
    geofenceMonitor.playGpxTrack([
      // Walk to venue B (5s intervals)
      {lat: 35.225845, lng: -80.853607, delayMs: 0},
      {lat: 35.215, lng: -80.83, delayMs: 5000},
      {lat: 35.2, lng: -80.8, delayMs: 10000},
      {lat: 35.185, lng: -80.77, delayMs: 15000},
      {lat: 35.17, lng: -80.74, delayMs: 20000},
      {lat: 35.15398, lng: -80.71379, delayMs: 25000}, // arrive

      // DWELL at B: 30s intervals × 7 points = 3.5 minutes
      {lat: 35.15398, lng: -80.71379, delayMs: 55000},
      {lat: 35.153982, lng: -80.713788, delayMs: 85000},
      {lat: 35.153978, lng: -80.713792, delayMs: 115000},
      {lat: 35.153981, lng: -80.713789, delayMs: 145000},
      {lat: 35.153979, lng: -80.713791, delayMs: 175000},
      {lat: 35.15398, lng: -80.71379, delayMs: 205000},
      {lat: 35.153982, lng: -80.713788, delayMs: 235000}, // ✓ triggers dwell!
    ]);
  }
}

const geofenceMonitor = new GeofenceMonitorService();
export default geofenceMonitor;
