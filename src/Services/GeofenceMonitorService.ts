import {AppState, AppStateStatus} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../Utils/LocalStorageHelper';

const LOCATION_UPDATE_INTERVAL_MS = 5000; // TODO:: MAKE IT 15000
const MIN_DISTANCE_CHANGE_METERS = 3;
const BATTERY_CHECK_INTERVAL_MS = 60000;

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

          //TODO: BEFORE IT WAS LIKE THIS TO CHECK IF SUER MOVED ENOUGH BEFORE SEND UPDATE LOCATION
          // if (this._hasMovedEnough(update)) {
          //   this.lastLocation = update;
          //   this._sendLocationUpdate(update);
          // }
          
          // Always send to server — server has its own drift/dwell detection.
          // Stationary users ARE the target (dwelling at a venue).
          this.lastLocation = update;
          this._sendLocationUpdate(update);
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
    if (!this.lastLocation) return true;

    const dlat = newLocation.latitude - this.lastLocation.latitude;
    const dlng = newLocation.longitude - this.lastLocation.longitude;
    const distanceApprox = Math.sqrt(dlat * dlat + dlng * dlng) * 111000;

    return distanceApprox >= MIN_DISTANCE_CHANGE_METERS;
  }

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
