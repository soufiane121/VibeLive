import { useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BackgroundLocationService,
  LocationCoordinates,
  LocationPermissionStatus,
} from '../Services/BackgroundLocationService';
import geofenceMonitor from '../Services/GeofenceMonitorService';
import { LOCATION_SYNC_THROTTLE_MS, USE_DUAL_TOKEN_AUTH } from '../Config/AppConfig';
import { store } from '../../redux/store';
import { loginApi } from '../../features/registrations/LoginSliceApi';

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
//
// IMPORTANT: No hardcoded fallback coordinates. The store starts from either:
//   (a) Persisted last-known position from AsyncStorage (previous session), or
//   (b) null — meaning "location not yet resolved"
// Consumers must handle the null/unresolved state gracefully.
// ---------------------------------------------------------------------------
const MOVE_THRESHOLD_M = 50;
const PERSISTED_COORDS_KEY = '@vibelive:last_known_coordinates';
const GPS_TIMEOUT_MS = 10_000;
const GPS_MAX_RETRIES = 2;

type StoreListener = () => void;

class LocationStore {
  private static _instance: LocationStore;

  // null means "real GPS not yet resolved" — consumers must guard against this
  private _coordinates: number[] | null = null;
  // Full location object for consumers that need accuracy/speed/etc.
  private _lastKnownLocation: LocationCoordinates | null = null;
  // Whether real device coordinates have been resolved at least once this session
  private _locationReady = false;
  // Permission state
  private _hasPermission = false;
  private _permissionStatus: LocationPermissionStatus = 'undetermined';
  // Tracking state
  private _isTracking = false;

  // useSyncExternalStore listeners
  private _listeners: Set<StoreListener> = new Set();
  private _permissionListeners: Set<StoreListener> = new Set();
  private _trackingListeners: Set<StoreListener> = new Set();
  private _readyListeners: Set<StoreListener> = new Set();

  // Internal refs
  private _locationService = BackgroundLocationService.getInstance();
  private _unsubscribe: (() => void) | null = null;
  private _appStateSub: ReturnType<typeof AppState.addEventListener> | null = null;
  private _initialized = false;

  private _lastLocationSyncAt = 0;

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
  getCoordinatesSnapshot = (): number[] | null => this._coordinates;

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

  // ---- useSyncExternalStore contract for locationReady ----
  subscribeReady = (listener: StoreListener): (() => void) => {
    this._readyListeners.add(listener);
    return () => { this._readyListeners.delete(listener); };
  };
  getReadySnapshot = (): boolean => this._locationReady;

  // ---- Public getters (non-reactive, for imperative code) ----
  getLastKnownLocation(): LocationCoordinates | null {
    return this._lastKnownLocation;
  }

  getCoordinates(): number[] | null {
    return this._coordinates;
  }

  isReady(): boolean {
    return this._locationReady;
  }

  // ---- Lifecycle ----

  /** Call once at app startup (idempotent). */
  async initialize(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    // 1. Hydrate from persisted coordinates (previous session's last known position)
    await this._hydrateFromStorage();

    // 2. Request permission + fetch fresh GPS position
    const status = await this._requestPermission();
    if (status === 'granted') {
      const loc = await this._getCurrentLocationWithRetry();
      if (loc) {
        this._setCoordinates(loc);
      }
    }

    // 3. Start foreground tracking + single subscription
    await this._startTracking();

    // 4. Listen for app-state changes to resume tracking
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
    this._readyListeners.clear();
    this._initialized = false;
  }

  // ---- Private helpers ----

  /** Hydrate coordinates from AsyncStorage (persisted from previous session). */
  private async _hydrateFromStorage(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(PERSISTED_COORDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.length === 2 &&
          typeof parsed[0] === 'number' &&
          typeof parsed[1] === 'number' &&
          isFinite(parsed[0]) &&
          isFinite(parsed[1])
        ) {
          this._coordinates = parsed;
          this._emitCoordinates();
          console.log('[LocationStore] Hydrated from storage:', parsed);
        }
      }
    } catch (e) {
      console.warn('[LocationStore] Failed to hydrate from storage:', e);
    }
  }

  /** Persist current coordinates to AsyncStorage for next launch. */
  private _persistCoordinates(): void {
    if (!this._coordinates) return;
    AsyncStorage.setItem(
      PERSISTED_COORDS_KEY,
      JSON.stringify(this._coordinates),
    ).catch(e => console.warn('[LocationStore] Failed to persist coordinates:', e));
  }

  /** Get current location with timeout and retry logic. */
  private async _getCurrentLocationWithRetry(): Promise<LocationCoordinates | null> {
    for (let attempt = 0; attempt <= GPS_MAX_RETRIES; attempt++) {
      try {
        const loc = await Promise.race([
          this._locationService.getCurrentLocation(),
          new Promise<null>(resolve => setTimeout(() => resolve(null), GPS_TIMEOUT_MS)),
        ]);
        if (loc) return loc;
        console.warn(`[LocationStore] GPS attempt ${attempt + 1} timed out`);
      } catch (e) {
        console.warn(`[LocationStore] GPS attempt ${attempt + 1} failed:`, e);
      }
    }
    console.error('[LocationStore] All GPS attempts failed');
    return null;
  }

  /** Set coordinates, mark ready, persist, emit, and sync to backend. */
  private _setCoordinates(loc: LocationCoordinates): void {
    this._coordinates = [loc.longitude, loc.latitude];
    this._lastKnownLocation = loc;
    if (!this._locationReady) {
      this._locationReady = true;
      this._emitReady();
    }
    this._emitCoordinates();
    this._persistCoordinates();
    this._syncLocationToBackend();
  }

  /** Throttled location sync to backend — max once per LOCATION_SYNC_THROTTLE_MS. */
  private _syncLocationToBackend(): void {
    if (!USE_DUAL_TOKEN_AUTH) return;
    if (!this._coordinates) return;

    const now = Date.now();
    if (now - this._lastLocationSyncAt < LOCATION_SYNC_THROTTLE_MS) return;
    this._lastLocationSyncAt = now;

    const coords = this._coordinates as [number, number];
    store.dispatch(
      loginApi.endpoints.updateLocation.initiate({ coordinates: coords }),
    );
  }

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

    // If this is the first real GPS fix this session, publish immediately
    if (!this._locationReady) {
      this._setCoordinates(location);
      return;
    }

    // Distance check — only publish new coordinates if meaningful movement
    if (this._coordinates) {
      const [prevLng, prevLat] = this._coordinates;
      const dist = haversineMeters(prevLng, prevLat, location.longitude, location.latitude);
      if (dist < MOVE_THRESHOLD_M) {
        return; // skip — GPS jitter, not real movement
      }
    }

    // Publish
    this._setCoordinates(location);
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
  private _emitReady(): void {
    this._readyListeners.forEach(l => l());
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
 * Returns null until real device GPS has resolved.
 */
export function useCoordinates(): number[] | null {
  // Ensure the singleton is initialized (idempotent)
  useEffect(() => { locationStore.initialize(); }, []);

  return useSyncExternalStore(
    locationStore.subscribeCoordinates,
    locationStore.getCoordinatesSnapshot,
    locationStore.getCoordinatesSnapshot, // server snapshot (SSR — same)
  );
}

/**
 * Returns true once the LocationStore has resolved real device coordinates.
 * Use to gate UI that depends on a valid GPS fix.
 */
export function useLocationReady(): boolean {
  useEffect(() => { locationStore.initialize(); }, []);

  return useSyncExternalStore(
    locationStore.subscribeReady,
    locationStore.getReadySnapshot,
    locationStore.getReadySnapshot,
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
  coordinates: number[] | null;
  permissionStatus: LocationPermissionStatus;
  requestLocationPermission: () => Promise<LocationPermissionStatus>;
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<void>;
  isTracking: boolean;
  locationReady: boolean;
  lastKnownLocation: LocationCoordinates | null;
};

const useGetLocation = (): useGetLocationTypes => {
  const coordinates = useCoordinates();
  const locationReady = useLocationReady();
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
    locationReady,
    lastKnownLocation,
  };
};

export default useGetLocation;

// Export the store instance for imperative (non-hook) usage
export { locationStore, LocationStore };
