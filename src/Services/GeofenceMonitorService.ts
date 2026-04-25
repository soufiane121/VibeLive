import {AppState, AppStateStatus} from 'react-native';
import * as Location from 'expo-location';
import {baseUrl} from '../../baseUrl';
import {getLocalData, setLocalData} from '../Utils/LocalStorageHelper';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration Constants
// ═══════════════════════════════════════════════════════════════════════════
const FOREGROUND_INTERVAL_MS = 15000; // 15 seconds
const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_DEGREE = 111_320;

// ═══════════════════════════════════════════════════════════════════════════
// 4-Gate Pipeline Constants (Client-side dwell detection)
// ═══════════════════════════════════════════════════════════════════════════
const DWELL_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes to trigger dwell
const DWELL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between dwells
const MIN_MOVE_METERS = 15; // Movement threshold for gate 1
const MAX_GPS_ACCURACY_M = 50; // Reject readings with accuracy worse than this
const KNOWN_PLACE_RADIUS_M = 80; // Radius for known place matching
const MAX_REALISTIC_SPEED_MPS = 50; // Filter out impossible GPS jumps
const KNOWN_PLACE_TTL_MS = 1 * 24 * 60 * 60 * 1000; // 1 day TTL for known places we need one day not 30

// Precompute squared threshold for fast distance check
const FAST_THRESHOLD_DEG = MIN_MOVE_METERS / METERS_PER_DEGREE;
const FAST_THRESHOLD_DEG_SQ = FAST_THRESHOLD_DEG * FAST_THRESHOLD_DEG;

// Expo location accuracy mapping
const FOREGROUND_ACCURACY = Location.Accuracy.Balanced;

// AsyncStorage key for KnownPlaceCache
const KNOWN_PLACES_STORAGE_KEY = 'known_places_v1';

// ═══════════════════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════════════════
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

interface ResolvedPlace {
  placeId: string;
  name: string | null;
  lat: number;
  lon: number;
  radiusMeters: number;
  cachedAt?: number; // Timestamp when cached
}

type GeofenceCallback = (venues: any[]) => void;
type ErrorCallback = (error: string) => void;

// ═══════════════════════════════════════════════════════════════════════════
// KnownPlaceCache - Client-side spatial cache for known venues
// ═══════════════════════════════════════════════════════════════════════════
class KnownPlaceCache {
  private places: ResolvedPlace[] = [];

  async load(): Promise<void> {
    try {
      const data = await getLocalData({key: KNOWN_PLACES_STORAGE_KEY});
      if (data && typeof data === 'string') {
        const parsed = JSON.parse(data);
        // Filter out expired entries on load
        const now = Date.now();
        this.places = parsed.filter(
          (p: ResolvedPlace) =>
            !p.cachedAt || now - p.cachedAt < KNOWN_PLACE_TTL_MS,
        );
        console.log(
          `[KnownPlaceCache] Loaded ${this.places.length} places (${parsed.length - this.places.length} expired)`,
        );
      }
    } catch (error: any) {
      console.error('[KnownPlaceCache] Load error:', error.message);
      this.places = [];
    }
  }

  async add(place: ResolvedPlace): Promise<void> {
    // Validate required fields
    if (
      !place.placeId ||
      !Number.isFinite(place.lat) ||
      !Number.isFinite(place.lon)
    ) {
      console.warn('[KnownPlaceCache] Invalid place, skipping:', place);
      return;
    }

    // Dedupe by placeId
    const existingIndex = this.places.findIndex(
      p => p.placeId === place.placeId,
    );
    if (existingIndex >= 0) {
      // Update existing entry with fresh timestamp
      this.places[existingIndex] = {...place, cachedAt: Date.now()};
    } else {
      this.places.push({...place, cachedAt: Date.now()});
    }

    await this._persist();
    console.log(`[KnownPlaceCache] Added ${place.name || place.placeId}`);
  }

  findPlace(lat: number, lon: number): ResolvedPlace | null {
    const now = Date.now();
    for (const place of this.places) {
      // Skip expired entries
      if (place.cachedAt && now - place.cachedAt > KNOWN_PLACE_TTL_MS) {
        continue;
      }
      const dist = this._haversineDistance(lat, lon, place.lat, place.lon);
      if (dist <= place.radiusMeters) {
        return place;
      }
    }
    return null;
  }

  private async _persist(): Promise<void> {
    try {
      await setLocalData({
        key: KNOWN_PLACES_STORAGE_KEY,
        value: JSON.stringify(this.places),
      });
    } catch (error: any) {
      console.error('[KnownPlaceCache] Persist error:', error.message);
    }
  }

  private _haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * toRad) *
        Math.cos(lat2 * toRad) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
  }

  getCount(): number {
    return this.places.length;
  }

  clear(): void {
    this.places = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DwellAccumulator - Tracks stationary time at a location
// ═══════════════════════════════════════════════════════════════════════════
class DwellAccumulator {
  private anchorLat: number | null = null;
  private anchorLon: number | null = null;
  private anchorTimestamp: number | null = null;

  /**
   * Update with new location. Returns {lat, lon} when dwell threshold crossed.
   */
  update(
    lat: number,
    lon: number,
    timestamp: number,
  ): {lat: number; lon: number} | null {
    // If no anchor, set it
    if (this.anchorLat === null || this.anchorLon === null) {
      this.anchorLat = lat;
      this.anchorLon = lon;
      this.anchorTimestamp = timestamp;
      return null;
    }

    // Check if moved too far from anchor
    const dist = this._haversineDistance(
      this.anchorLat,
      this.anchorLon,
      lat,
      lon,
    );

    if (dist > KNOWN_PLACE_RADIUS_M) {
      // Moved away, reset anchor to new position.
      // This is logged loudly because competing location streams (simulator +
      // real GPS + background task) can cause the anchor to thrash and
      // silently prevent dwell accumulation.
      if (__DEV__) {
      const heldForSec = this.anchorTimestamp
        ? Math.round((timestamp - this.anchorTimestamp) / 1000)
        : 0;
      console.log(
        `[GeofenceMonitor] DwellAccumulator anchor RESET (moved ${Math.round(dist)}m from anchor held ${heldForSec}s). Old: ${this.anchorLat.toFixed(5)},${this.anchorLon.toFixed(5)} → New: ${lat.toFixed(5)},${lon.toFixed(5)}`,
      );
      }
      this.anchorLat = lat;
      this.anchorLon = lon;
      this.anchorTimestamp = timestamp;
      return null;
    }

    // Check if dwell threshold crossed
    const dwellTime = timestamp - (this.anchorTimestamp || timestamp);
    if (dwellTime >= DWELL_THRESHOLD_MS) {
      const result = {lat: this.anchorLat, lon: this.anchorLon};
      this.reset();
      return result;
    }

    return null;
  }

  reset(): void {
    this.anchorLat = null;
    this.anchorLon = null;
    this.anchorTimestamp = null;
  }

  getAnchor(): {lat: number; lon: number; timestamp: number} | null {
    if (this.anchorLat === null || this.anchorLon === null) return null;
    return {
      lat: this.anchorLat,
      lon: this.anchorLon,
      timestamp: this.anchorTimestamp || Date.now(),
    };
  }

  private _haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * toRad) *
        Math.cos(lat2 * toRad) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
  }
}

class GeofenceMonitorService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  private lastLocation: LocationUpdate | null = null;
  private config: GeofenceConfig = {
    enabled: true,
    radiusMeters: 5,
    batteryThreshold: 15,
  };
  private onVenuesDetected: GeofenceCallback | null = null;
  private onError: ErrorCallback | null = null;
  private appState: AppStateStatus = 'active';
  private appStateSubscription: ReturnType<
    typeof AppState.addEventListener
  > | null = null;
  private isMonitoring: boolean = false;
  private permissionGranted: boolean = false;
  private initializationMutex: boolean = false;

  // ─── 4-Gate Pipeline State ─────────────────────────────────────────────
  private knownPlaces: KnownPlaceCache = new KnownPlaceCache();
  private dwellAccumulator: DwellAccumulator = new DwellAccumulator();
  private lastDwellSentAt: number = 0;
  private previousLocation: LocationUpdate | null = null;

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

  async startMonitoring(
    onVenuesDetected: GeofenceCallback,
    onError?: ErrorCallback,
  ): Promise<void> {
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

    // Load KnownPlaceCache from AsyncStorage
    await this.knownPlaces.load();

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
    console.log(
      `[GeofenceMonitor] Monitoring started (${this.knownPlaces.getCount()} known places)`,
    );
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

    // Reset state
    this.lastLocation = null;
    this.previousLocation = null;
    this.dwellAccumulator.reset();
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
    // Stop foreground subscription and any running JS timer. In true background
    // JS timers and watchPositionAsync are suspended by the OS, so we do NOT
    // start a replacement here. Background location updates are delivered
    // natively by BackgroundLocationService's TaskManager task, which fans out
    // through LocationStore._onLocationUpdate → geofenceMonitor.sendManualPosition,
    // feeding the 4-gate pipeline (including the 15-min DwellAccumulator).
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
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
          distanceInterval: MIN_MOVE_METERS,
          timeInterval: FOREGROUND_INTERVAL_MS,
        },
        location => {
          this._handleLocationUpdate(location);
        },
      );
    } catch (error: any) {
      console.error(
        '[GeofenceMonitor] watchPositionAsync error:',
        error.message,
      );
      this.onError?.(error.message);

      // Fallback to interval-based polling
      this.updateTimer = setInterval(() => {
        this._getCurrentPosition(FOREGROUND_ACCURACY);
      }, FOREGROUND_INTERVAL_MS);
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

    // Route through 4-gate pipeline
    this._onLocationReceived(update);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4-Gate Pipeline - Client-side dwell detection
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 4-gate decision pipeline for location updates.
   * Gate 1: Move filter (jitter/noise/impossible speed)
   * Gate 2: KnownPlaceCache check (suppress known places)
   * Gate 3: DwellAccumulator (15min threshold)
   * Gate 4: Cooldown (5min between dwells)
   */
  private _onLocationReceived(update: LocationUpdate): void {
    const {latitude, longitude, accuracy, timestamp} = update;

    // ─── Gate 1: Move Filter ─────────────────────────────────────────────
    if (!this._passesMoveFilter(update)) {
      return;
    }

    // ─── Gate 2: KnownPlaceCache ─────────────────────────────────────────
    const knownPlace = this.knownPlaces.findPlace(latitude, longitude);
    if (knownPlace) {
      // Keep DwellAccumulator anchor fresh but don't fire
      this.dwellAccumulator.update(latitude, longitude, timestamp);
      console.log(
        `[GeofenceMonitor] Gate 2: Known place suppressed (${knownPlace.name || knownPlace.placeId})`,
      );
      return;
    }

    // ─── Gate 3: DwellAccumulator ────────────────────────────────────────
    const dwellResult = this.dwellAccumulator.update(
      latitude,
      longitude,
      timestamp,
    );

    if (!dwellResult) {
      // Still accumulating, threshold not yet reached
      const anchor = this.dwellAccumulator.getAnchor();
      if (anchor) {
        const elapsedSec = Math.round((timestamp - anchor.timestamp) / 1000);
        const thresholdSec = Math.round(DWELL_THRESHOLD_MS / 1000);
        console.log(
          `[GeofenceMonitor] Gate 3: Accumulating (${elapsedSec}s / ${thresholdSec}s)`,
        );
      }
      return;
    }

    // ─── Gate 4: Cooldown ────────────────────────────────────────────────
    const now = Date.now();
    if (this.lastDwellSentAt && now - this.lastDwellSentAt < DWELL_COOLDOWN_MS) {
      const remaining = Math.round(
        (DWELL_COOLDOWN_MS - (now - this.lastDwellSentAt)) / 1000,
      );
      console.log(
        `[GeofenceMonitor] Gate 4: Cooldown (${remaining}s remaining)`,
      );
      return;
    }

    // ─── All gates passed: Send dwell to server ──────────────────────────
    console.log(
      `[GeofenceMonitor] All gates passed! Sending dwell at ${dwellResult.lat.toFixed(5)}, ${dwellResult.lon.toFixed(5)}`,
    );
    this.lastDwellSentAt = now;
    this._sendDwell(dwellResult.lat, dwellResult.lon);
  }

  /**
   * Gate 1: Move filter
   * Filters out bad GPS readings (invalid, too inaccurate, impossible speed).
   * IMPORTANT: This must NOT filter out stationary readings — the DwellAccumulator
   * needs repeated near-identical positions to accumulate dwell time.
   * This filter only rejects: invalid data, poor accuracy, and teleport jumps.
   */
  private _passesMoveFilter(update: LocationUpdate): boolean {
    const {latitude, longitude, accuracy, timestamp} = update;

    // Validate coordinates
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(accuracy)
    ) {
      return false;
    }

    // Skip if accuracy worse than threshold (indoor GPS can be 20-40m)
    if (accuracy > MAX_GPS_ACCURACY_M) {
      return false;
    }

    // If no previous, accept
    if (!this.previousLocation) {
      this.previousLocation = update;
      return true;
    }

    const prev = this.previousLocation;

    // Time delta — reject duplicates with same or earlier timestamp
    const timeDeltaMs = timestamp - prev.timestamp;
    if (timeDeltaMs <= 0) {
      return false;
    }

    // Compute distance
    const dLat = latitude - prev.latitude;
    const dLon = longitude - prev.longitude;
    const approxDistSq = dLat * dLat + dLon * dLon;

    // If user hasn't moved much: PASS — dwell accumulator needs these
    if (approxDistSq < FAST_THRESHOLD_DEG_SQ) {
      return true;
    }

    // Accurate Haversine for larger movements
    const distance = this._haversineDistance(
      prev.latitude,
      prev.longitude,
      latitude,
      longitude,
    );

    // Small movement: PASS — still near same spot
    if (distance < MIN_MOVE_METERS) {
      return true;
    }

    // Check for impossible speed (GPS teleport jump)
    // TODO:: get back is needed
    const speed = distance / (timeDeltaMs / 1000);
    if (speed > MAX_REALISTIC_SPEED_MPS) {
      console.log(
        `[GeofenceMonitor] Gate 1: Impossible speed (${speed.toFixed(1)} m/s)`,
      );
      return false;
    }

    // Significant real movement — update reference point and pass
    this.previousLocation = update;
    return true;
  }

  private _haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
  }

  /**
   * Send confirmed dwell to server and handle resolvedPlace response.
   */
  private async _sendDwell(lat: number, lon: number): Promise<void> {
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
          latitude: lat,
          longitude: lon,
        }),
      });

      const data = await response.json();

      // Add resolvedPlace to KnownPlaceCache for future suppression
      if (data.resolvedPlace) {
        await this.knownPlaces.add(data.resolvedPlace);
      }

      // Notify callback if venues detected
      if (data.action === 'notification_sent' && data.venues) {
        this.onVenuesDetected?.(data.venues);
      }

      console.log(`[GeofenceMonitor] Server response: ${data.action}`);
    } catch (error: any) {
      console.log('[GeofenceMonitor] Send dwell error:', error.message);
    }
  }

  isActive(): boolean {
    return this.isMonitoring;
  }

  getLastLocation(): LocationUpdate | null {
    return this.lastLocation;
  }
  // ═══════════════════════════════════════════════════════════════════════
  // GPX TRACK PLAYER - For testing 4-gate dwell detection
  // ═══════════════════════════════════════════════════════════════════════

  private gpxTimer: ReturnType<typeof setTimeout> | null = null;
  private gpxPoints: Array<{lat: number; lng: number; delayMs: number}> = [];

  /**
   * Send a manual position through the 4-gate pipeline.
   */
  sendManualPosition(lat: number, lng: number) {
    const update: LocationUpdate = {
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      timestamp: Date.now(),
    };

    this.lastLocation = update;
    // Route through full 4-gate pipeline
    this._onLocationReceived(update);
  }

  /**
   * Play GPX track through 4-gate pipeline.
   * Points are processed by _onLocationReceived (not sent directly to server).
   */
  playGpxTrack(points: Array<{lat: number; lng: number; delayMs: number}>) {
    if (this.gpxTimer) {
      this.stopGpxTrack();
    }

    this.gpxPoints = points;
    console.log(`[GPX] Playing ${points.length} points through 4-gate pipeline`);

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
        // Route through 4-gate pipeline
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
        this._onLocationReceived(update);

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

  /**
   * TODO:: remove the bottom only for testing
   * Fast test: 3.5 minutes dwell (for quick iteration).
   * WARNING: This will NOT trigger a dwell with the 15-minute threshold.
   * Use playTestDwellRealistic() for production threshold testing.
   * This test is useful for:
   * - Testing server-side legacy mode (TOGGLE_OLD_DWELL=true, 3-min threshold)
   * - Verifying GPS pipeline and network calls work
   */
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
      {lat: 35.153982, lng: -80.713788, delayMs: 235000},
    ]);
  }

  /**
   * Realistic test: 15+ minutes dwell (matches production threshold).
   * Use for full E2E testing of 4-gate pipeline.
   */
  // playTestDwellRealistic() {
  //   const points: Array<{lat: number; lng: number; delayMs: number}> = [];

  //   // Walk to venue (5s intervals)
  //   points.push({lat: 35.225845, lng: -80.853607, delayMs: 0});
  //   points.push({lat: 35.215, lng: -80.83, delayMs: 5000});
  //   points.push({lat: 35.2, lng: -80.8, delayMs: 10000});
  //   points.push({lat: 35.185, lng: -80.77, delayMs: 15000});
  //   points.push({lat: 35.17, lng: -80.74, delayMs: 20000});
  //   points.push({lat: 35.15398, lng: -80.71379, delayMs: 25000}); // arrive

  //   // DWELL at venue: 60s intervals × 16 points = 16 minutes (triggers 15min threshold)
  //   for (let i = 0; i < 16; i++) {
  //     const jitterLat = (Math.random() - 0.5) * 0.00005; // ~5m jitter
  //     const jitterLng = (Math.random() - 0.5) * 0.00005;
  //     points.push({
  //       lat: 35.15398 + jitterLat,
  //       lng: -80.71379 + jitterLng,
  //       delayMs: 25000 + (i + 1) * 60000, // 60s intervals
  //     });
  //   }

  //   console.log(
  //     `[GPX] Playing realistic 15+ minute dwell test (${points.length} points)`,
  //   );
  //   geofenceMonitor.playGpxTrack(points);
  // }
}

const geofenceMonitor = new GeofenceMonitorService();
export default geofenceMonitor;
