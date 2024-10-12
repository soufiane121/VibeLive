import {useCallback, useEffect, useState} from 'react';

import {Alert, PermissionsAndroid, Platform} from 'react-native';
import Geolocation, {
  GeolocationError,
} from '@react-native-community/geolocation';

export function useGetCurrentLocation() {
  const [position, setPosition] = useState<{} | null>(null);

  const getCurrentPosition = async () => {
    const test = Geolocation.requestAuthorization();
    console.log({test});
    Geolocation.getCurrentPosition(
      pos => {
        setPosition(pos.coords);
      },
      error => Alert.alert('GetCurrentPosition Error', JSON.stringify(error)),
      {enableHighAccuracy: true},
    );
  };

  useEffect(() => {
    getCurrentPosition();
  }, []);

  return position;
}

type useGetLocationTypes = {
  hasPermission?: boolean;
  coordinates: number[];
  requestLocationPermission?: () => Promise<boolean>;
};
// Function to request location permission
const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // iOS has already handled permissions through Info.plist
};

const useGetLocation = (): useGetLocationTypes => {
  const [coordinates, setCoordinates] = useState<number[]>([
    -80.853607, 35.225845,
  ]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [errors, setErrors] = useState<GeolocationError[] | null>(null);

  const fetchLocation = async () => {
    const hasPermissionGranted = await requestLocationPermission();
    if (!hasPermissionGranted) {
      setHasPermission(false);
      return;
    }

    setHasPermission(true);
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setCoordinates([longitude, latitude]); // This should update the state
      },
      error => {
        console.log('Geolocation error:', error); // Debugging log
        setErrors([...(errors ?? []), error]);
      },
      {enableHighAccuracy: false, timeout: 30000, maximumAge: 10000},
    );
  };
  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    requestLocationPermission,
    coordinates,
    hasPermission,
  };
};

export default useGetLocation;
