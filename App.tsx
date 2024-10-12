/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useRef, useEffect} from 'react';
import type {PropsWithChildren} from 'react';
import {SafeAreaView, useColorScheme, Text, View, Image, Animated, Alert} from 'react-native';
// import RadarMap from './src/FeatureComponents/Map/Map.container';
// import RadarMap from './working';
import useRequestLocationAuth from './UserGetUserLocation';
import Geolocation from '@react-native-community/geolocation';
import RadarMap from './src/FeatureComponents/Map/Map.container';


function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';



  return (
    <SafeAreaView className='flex-1'>
      <RadarMap/>
    </SafeAreaView>
  );
}

export default App;
