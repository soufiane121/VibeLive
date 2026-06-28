import { useEffect, useState, useRef, useCallback, useSyncExternalStore } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import {
  BackgroundLocationService,
  LocationCoordinates,
  LocationPermissionStatus,
  BACKGROUND_LOCATION_TASK,
} from '../Services/BackgroundLocationService';
import geofenceMonitor from '../Services/GeofenceMonitorService';

// ---------------------------------------------------------------------------
// Haversine helper — returns distance in meters between two [lng, lat] pairs
// ---------------------------------------------------------------------------
function haversineMeters(
  lon1: number, lat1: number,
  lon2: number, lat2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6_371_000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Singleton LocationStore
// One subscription to BackgroundLocationService, shared by all consumers.
// Coordinates are only updated when the user moves ≥ MOVE_THRESHOLD_M meters,
// which eliminates GPS-jitter-driven re-renders across the entire app.
// ---------------------------------------------------------------------------
const MOVE_THRESHOLD_M = 50;
const DEFAULT_COORDS: number[] = [-80.719, 35.160]; // [lng, lat]

type StoreListener = () => void;

class LocationStore {
  private static _instance: LocationStore;

  // The current "published" coordinates — only changes on meaningful movement
  private _coordinates: number[] = DEFAULT_COORDS;
  // Full location object for consumers that need accuracy/speed/etc.
  private _lastKnownLocation: LocationCoordinates | null = null;
  // Permission state
  private _hasPermission = false;
  private _permissionStatus: LocationPermissionStatus = 'undetermined';
  // Tracking state
  private _isTracking = false;

  // useSyncExternalStore listeners
  private _listeners: Set<StoreListener> = new Set();
  private _permissionListeners: Set<StoreListener> = new Set();
  private _trackingListeners: Set<StoreListener> = new Set();

  // Internal refs
  private _locationService = BackgroundLocationService.getInstance();
  private _unsubscribe: (() => void) | null = null;
  private _appStateSub: ReturnType<typeof AppState.addEventListener> | null = null;
  private _initialized = false;

  private constructor() {}

  static getInstance(): LocationStore {
    if (!LocationStore._instance) {
      LocationStore._instance = new LocationStore();
    }
    return LocationStore._instance;
  }

  // ---- useSyncExternalStore contract for coordinates ----
  subscribeCoordinates = (listener: StoreListener): (() => void) => {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  };
  getCoordinatesSnapshot = (): number[] => this._coordinates;

  // ---- useSyncExternalStore contract for permission ----
  subscribePermission = (listener: StoreListener): (() => void) => {
    this._permissionListeners.add(listener);
    return () => { this._permissionListeners.delete(listener); };
  };
  getPermissionSnapshot = (): boolean => this._hasPermission;
  getPermissionStatusSnapshot = (): LocationPermissionStatus => this._permissionStatus;

  // ---- useSyncExternalStore contract for tracking ----
  subscribeTracking = (listener: StoreListener): (() => void) => {
    this._trackingListeners.add(listener);
    return () => { this._trackingListeners.delete(listener); };
  };
  getTrackingSnapshot = (): boolean => this._isTracking;

  // ---- Public getters (non-reactive, for imperative code) ----
  getLastKnownLocation(): LocationCoordinates | null {
    return this._lastKnownLocation;
  }

  getCoordinates(): number[] {
    return this._coordinates;
  }

  // ---- Lifecycle ----

  /** Call once at app startup (idempotent). */
  async initialize(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    // Request permission + fetch initial position
    const status = await this._requestPermission();
    if (status === 'granted') {
      const loc = await this._locationService.getCurrentLocation();
      if (loc) {
        this._coordinates = [loc.longitude, loc.latitude];
        this._lastKnownLocation = loc;
        this._emitCoordinates();
      }
    }

    // Start foreground tracking + single subscription
    await this._startTracking();

    // Listen for app-state changes to resume tracking
    this._appStateSub = AppState.addEventListener('change', this._handleAppState);
  }

  /** Request location permission and update store state. */
  requestPermission = async (): Promise<LocationPermissionStatus> => {
    return this._requestPermission();
  };

  /** Explicitly start tracking (idempotent). */
  startTracking = async (): Promise<boolean> => {
    return this._startTracking();
  };

  /** Explicitly stop tracking. */
  stopTracking = async (): Promise<void> => {
    return this._stopTracking();
  };

  /** Tear down everything — use only if the service is no longer needed. */
  async destroy(): Promise<void> {
    await this._stopTracking();
    this._appStateSub?.remove();
    this._appStateSub = null;
    this._listeners.clear();
    this._permissionListeners.clear();
    this._trackingListeners.clear();
    this._initialized = false;
  }

  // ---- Private helpers ----

  private async _requestPermission(): Promise<LocationPermissionStatus> {
    try {
      const status = await this._locationService.initialize();
      this._permissionStatus = status;
      this._hasPermission = status === 'granted';
      this._emitPermission();
      return status;
    } catch (error) {
      console.error('[LocationStore] Permission request error:', error);
      this._permissionStatus = 'denied';
      this._hasPermission = false;
      this._emitPermission();
      return 'denied';
    }
  }

  private async _startTracking(): Promise<boolean> {
    if (this._isTracking) return true;

    try {
      const success = await this._locationService.startForegroundTracking();
      if (!success) return false;

      this._isTracking = true;
      this._emitTracking();

      // Clean up previous subscription (defensive)
      if (this._unsubscribe) {
        this._unsubscribe();
      }

      // Single subscription shared by all consumers
      this._unsubscribe = this._locationService.onLocationUpdate(
        this._onLocationUpdate,
      );
      return true;
    } catch (error) {
      console.error('[LocationStore] Error starting tracking:', error);
      return false;
    }
  }

  private async _stopTracking(): Promise<void> {
    try {
      await this._locationService.stopTracking();
      this._isTracking = false;
      this._emitTracking();
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
    } catch (error) {
      console.error('[LocationStore] Error stopping tracking:', error);
    }
  }

  /** Core callback — applies distance threshold before publishing. */
  private _onLocationUpdate = (location: LocationCoordinates): void => {
    // Always forward to geofence monitor (it has its own filtering)
    geofenceMonitor.sendManualPosition(location.latitude, location.longitude);

    // Always update the full location object (non-reactive)
    this._lastKnownLocation = location;

    // Distance check — only publish new coordinates if meaningful movement
    const [prevLng, prevLat] = this._coordinates;
    const dist = haversineMeters(prevLng, prevLat, location.longitude, location.latitude);
    if (dist < MOVE_THRESHOLD_M) {
      return; // skip — GPS jitter, not real movement
    }

    // Publish
    this._coordinates = [location.longitude, location.latitude];
    this._emitCoordinates();
  };

  private _handleAppState = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active' && !this._isTracking) {
      this._startTracking();
    }
  };

  // Notify React subscribers
  private _emitCoordinates(): void {
    this._listeners.forEach(l => l());
  }
  private _emitPermission(): void {
    this._permissionListeners.forEach(l => l());
  }
  private _emitTracking(): void {
    this._trackingListeners.forEach(l => l());
  }
}

// Module-level singleton
const locationStore = LocationStore.getInstance();

// ---------------------------------------------------------------------------
// React Hooks
// ---------------------------------------------------------------------------

/** One-shot current location (no tracking). */
export function useGetCurrentLocation() {
  const [position, setPosition] = useState<LocationCoordinates | null>(null);

  const getCurrentPosition = async () => {
    const locationService = BackgroundLocationService.getInstance();
    const location = await locationService.getCurrentLocation();
    
    if (location) {
      setPosition(location);
    } else {
      Alert.alert('GetCurrentPosition Error', 'Failed to get current location');
    }
  };

  useEffect(() => {
    getCurrentPosition();
  }, []);

  return position;
}

/**
 * Stable coordinates hook — only re-renders when user moves ≥ 50 m.
 * Returns the same array reference between updates (no jitter re-renders).
 */
export function useCoordinates(): number[] {
  // Ensure the singleton is initialized (idempotent)
  useEffect(() => { locationStore.initialize(); }, []);

  return useSyncExternalStore(
    locationStore.subscribeCoordinates,
    locationStore.getCoordinatesSnapshot,
    locationStore.getCoordinatesSnapshot, // server snapshot (SSR — same)
  );
}

/** Permission state hook. */
export function useLocationPermission() {
  useEffect(() => { locationStore.initialize(); }, []);

  const hasPermission = useSyncExternalStore(
    locationStore.subscribePermission,
    locationStore.getPermissionSnapshot,
    locationStore.getPermissionSnapshot,
  );
  const permissionStatus = useSyncExternalStore(
    locationStore.subscribePermission,
    locationStore.getPermissionStatusSnapshot,
    locationStore.getPermissionStatusSnapshot,
  );

  return {
    hasPermission,
    permissionStatus,
    requestLocationPermission: locationStore.requestPermission,
  };
}

/** Tracking control hook. */
export function useLocationTracking() {
  useEffect(() => { locationStore.initialize(); }, []);

  const isTracking = useSyncExternalStore(
    locationStore.subscribeTracking,
    locationStore.getTrackingSnapshot,
    locationStore.getTrackingSnapshot,
  );

  return {
    isTracking,
    startTracking: locationStore.startTracking,
    stopTracking: locationStore.stopTracking,
  };
}

// ---------------------------------------------------------------------------
// Backward-compatible default hook
// Composes the above hooks so existing `const {coordinates} = useGetLocation()`
// calls keep working without any consumer changes needed immediately.
// ---------------------------------------------------------------------------
type useGetLocationTypes = {
  hasPermission: boolean;
  coordinates: number[];
  permissionStatus: LocationPermissionStatus;
  requestLocationPermission: () => Promise<LocationPermissionStatus>;
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<void>;
  isTracking: boolean;
  lastKnownLocation: LocationCoordinates | null;
};

const useGetLocation = (): useGetLocationTypes => {
  const coordinates = useCoordinates();
  const { hasPermission, permissionStatus, requestLocationPermission } = useLocationPermission();
  const { isTracking, startTracking, stopTracking } = useLocationTracking();

  // lastKnownLocation is non-reactive (read from store imperatively)
  const lastKnownLocation = locationStore.getLastKnownLocation();

  return {
    requestLocationPermission,
    coordinates,
    hasPermission,
    permissionStatus,
    startTracking,
    stopTracking,
    isTracking,
    lastKnownLocation,
  };
};

export default useGetLocation;

// Export the store instance for imperative (non-hook) usage
export { locationStore, LocationStore };
