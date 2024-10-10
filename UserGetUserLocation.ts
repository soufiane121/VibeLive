'use strict';

import React, {useEffect, useState, } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export default function useGetCurrentLocation() {
  const [position, setPosition] = useState<{} | null>(null);
  
  const getCurrentPosition = () => {
    Geolocation.requestAuthorization();
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

export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // iOS automatically handles location permission prompts
      return true;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
};
