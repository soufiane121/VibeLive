import {AppState, AppStateStatus} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../Utils/LocalStorageHelper';

const LOCATION_UPDATE_INTERVAL_MS = 5000; // TODO:: MAKE IT 15000
const MIN_DISTANCE_CHANGE_METERS = 1;
const BATTERY_CHECK_INTERVAL_MS = 60000;
const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_DEGREE = 111_320;

// Precompute squared threshold for fast stage
const FAST_THRESHOLD_DEG = MIN_DISTANCE_CHANGE_METERS / METERS_PER_DEGREE;
const FAST_THRESHOLD_DEG_SQ = FAST_THRESHOLD_DEG * FAST_THRESHOLD_DEG;

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
  private watchId: number | null = null;
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
  private appStateSubscription: any = null;
  private isMonitoring: boolean = false;

  configure(config: Partial<GeofenceConfig>) {
    this.config = {...this.config, ...config};
  }

  startMonitoring(
    onVenuesDetected: GeofenceCallback,
    onError?: ErrorCallback,
  ) {
    if (this.isMonitoring) return;

    this.onVenuesDetected = onVenuesDetected;
    this.onError = onError || null;
    this.isMonitoring = true;
    console.log('we start MONITORING');

    this.appStateSubscription = AppState.addEventListener(
      'change',
      this._handleAppStateChange,
    );

    this._startLocationUpdates();
    console.log('[GeofenceMonitor] Monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;

    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.lastLocation = null;
    console.log('[GeofenceMonitor] Monitoring stopped');
  }

  private _handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      this._switchToBackgroundMode();
    } else if (
      this.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      this._switchToForegroundMode();
    }
    this.appState = nextAppState;
  };

  private _switchToBackgroundMode() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    this.updateTimer = setInterval(() => {
      this._getCurrentPosition();
    }, LOCATION_UPDATE_INTERVAL_MS * 4);
  }

  private _switchToForegroundMode() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    this._startLocationUpdates();
  }

  private _startLocationUpdates() {
    this._getCurrentPosition();

    this.updateTimer = setInterval(() => {
      this._getCurrentPosition();
    }, LOCATION_UPDATE_INTERVAL_MS);
  }

  private _getCurrentPosition() {
    if (!this.config.enabled || !this.isMonitoring) return;

    try {
      Geolocation.getCurrentPosition(
        (position: any) => {
          const {latitude, longitude, accuracy} = position.coords;
          const update: LocationUpdate = {
            latitude,
            longitude,
            accuracy: accuracy || 10,
            timestamp: position.timestamp,
          };

          // TODO: BEFORE IT WAS LIKE THIS TO CHECK IF SUER MOVED ENOUGH BEFORE SEND UPDATE LOCATION, go agaisnt 5m 
          if (this._hasMovedEnough(update)) {
            this.lastLocation = update;
            this._sendLocationUpdate(update);
          }

          // Always send to server — server has its own drift/dwell detection.
          // Stationary users ARE the target (dwelling at a venue).
          // TODO: comment because it was sending call everytime, and uncomment _hasMovedEnough
          // this.lastLocation = update;
          // this._sendLocationUpdate(update);
        },
        (error: any) => {
          console.log('[GeofenceMonitor] Location error:', error.message);
          this.onError?.(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      );
    } catch (error: any) {
      console.log('[GeofenceMonitor] getCurrentPosition error:', error.message);
    }
  }



  private _hasMovedEnough(newLocation: LocationUpdate): boolean {
    const last = this.lastLocation;

    if (!last) return true;

    const lat1 = last.latitude;
    const lon1 = last.longitude;
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
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        sinDLon *
        sinDLon;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = EARTH_RADIUS_METERS * c;

    return distance >= MIN_DISTANCE_CHANGE_METERS;
  }
  // private _hasMovedEnough(newLocation: LocationUpdate): boolean {
  //   if (!this.lastLocation) return true;

  //   const dlat = newLocation.latitude - this.lastLocation.latitude;
  //   const dlng = newLocation.longitude - this.lastLocation.longitude;
  //   const distanceApprox = Math.sqrt(dlat * dlat + dlng * dlng) * 111000;

  //   return distanceApprox >= MIN_DISTANCE_CHANGE_METERS;
  // }

  private async _sendLocationUpdate(location: LocationUpdate) {
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
}

const geofenceMonitor = new GeofenceMonitorService();
export default geofenceMonitor;
