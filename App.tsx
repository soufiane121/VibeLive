/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useRef, useEffect} from 'react';
import type {PropsWithChildren} from 'react';
import {SafeAreaView, useColorScheme, Text, View, Image, Animated} from 'react-native';
import Mapbox from '@rnmapbox/maps';

import useGetCurrentLocation from './UserGetUserLocation';
import RadarMap from './working';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const position = useGetCurrentLocation();
  const cord = [37.785834, -122.406417];
  const animatedRadius = useRef(new Animated.Value(0)).current;
  const [radius, setRadius] = useState(0);
  const [newCords, setNewCords] = useState(null);
  const [userBearing, setUserBearing] = useState(0);
  const [pulseRadius, setPulseRadius] = useState(new Animated.Value(500)); 

console.log({position});

  useEffect(() => {
    // Animation loop to simulate radar pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRadius, {
          toValue: 1000, // Max radius
          duration: 3000, // Time for one radar pulse
          useNativeDriver: false,
        }),
        Animated.timing(pulseRadius, {
          toValue: 500, // Min radius
          duration: 3000, // Time for radar contraction
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  return (
    <SafeAreaView className='flex-1'>
      <RadarMap />
    </SafeAreaView>
  );
}

export default App;
