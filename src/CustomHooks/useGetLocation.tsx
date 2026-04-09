import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import {
  BackgroundLocationService,
  LocationCoordinates,
  LocationPermissionStatus,
  BACKGROUND_LOCATION_TASK,
} from '../Services/BackgroundLocationService';
import geofenceMonitor from '../Services/GeofenceMonitorService';

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
  const [coordinates, setCoordinates] = useState<number[]>([
    // -80.853607, 35.225845,
    -80.719, 35.160
  ]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('undetermined');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [lastKnownLocation, setLastKnownLocation] = useState<LocationCoordinates | null>(null);

  // Use refs to avoid stale closures and store cleanup functions
  const locationServiceRef = useRef(BackgroundLocationService.getInstance());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isTrackingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Keep ref in sync with state
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  const requestLocationPermission = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const status = await locationServiceRef.current.initialize();
      if (isMountedRef.current) {
        setPermissionStatus(status);
        setHasPermission(status === 'granted');
      }
      return status;
    } catch (error) {
      console.error('[useGetLocation] Permission request error:', error);
      if (isMountedRef.current) {
        setPermissionStatus('denied');
        setHasPermission(false);
      }
      return 'denied';
    }
  }, []);

  const startTracking = useCallback(async (): Promise<boolean> => {
    // Prevent duplicate subscriptions
    if (isTrackingRef.current) {
      console.log('[useGetLocation] Already tracking, skipping...');
      return true;
    }

    try {
      const success = await locationServiceRef.current.startForegroundTracking();
      if (success && isMountedRef.current) {
        setIsTracking(true);
        
        // Clean up any existing subscription first
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        
        // Subscribe to location updates
        unsubscribeRef.current = locationServiceRef.current.onLocationUpdate((location: LocationCoordinates) => {
          if (!isMountedRef.current) return;
          
          console.log('[useGetLocation] Location update:', location);
          setCoordinates([location.longitude, location.latitude]);
          setLastKnownLocation(location);
          
          // Send to geofence monitor
          geofenceMonitor.sendManualPosition(location.latitude, location.longitude);
        });
      }
      return success;
    } catch (error) {
      console.error('[useGetLocation] Error starting tracking:', error);
      return false;
    }
  }, []);

  const stopTracking = useCallback(async (): Promise<void> => {
    try {
      await locationServiceRef.current.stopTracking();
      if (isMountedRef.current) {
        setIsTracking(false);
      }
      
      // Cleanup subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    } catch (error) {
      console.error('[useGetLocation] Error stopping tracking:', error);
    }
  }, []);

  const fetchLocation = useCallback(async () => {
    const status = await requestLocationPermission();
    if (status === 'granted') {
      const location = await locationServiceRef.current.getCurrentLocation();
      if (location && isMountedRef.current) {
        setCoordinates([location.longitude, location.latitude]);
        setLastKnownLocation(location);
      }
    }
  }, [requestLocationPermission]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initialize and fetch location on mount
    fetchLocation();

    // Start tracking automatically
    startTracking();

    // Handle app state changes - use ref to avoid stale closure
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isTrackingRef.current) {
        // Resume tracking when app comes to foreground
        startTracking();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMountedRef.current = false;
      appStateSubscription.remove();
      
      // Cleanup subscription on unmount
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Stop tracking
      locationServiceRef.current.stopTracking().catch(console.error);
    };
  }, [fetchLocation, startTracking]);

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
