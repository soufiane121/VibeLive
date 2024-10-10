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
import GetCurrentLocation from './UserGetUserLocation';
import useGetCurrentLocation from './UserGetUserLocation';
import RadarMap from './working';

Mapbox.setAccessToken(
  'sk.eyJ1IjoidGVzdC0xMjEiLCJhIjoiY20xd3drYzVhMHJ3azJqb2ttZmJjYTY1ZCJ9.k03054nYYuW8sQtJkU522w',
);

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
    <>
      {/* <Mapbox.MapView
        className=" flex-1 bg-yellow-50 "
        zoomEnabled
        styleURL="mapbox://styles/mapbox/dark-v11">
        <Mapbox.Camera
          animationMode="flyTo"
          centerCoordinate={cord}
          followUserLocation
          followZoomLevel={12}
          zoomLevel={14}
        />

        <Mapbox.LocationPuck puckBearingEnabled puckBearing="course" />
        <Mapbox.ShapeSource
          id="radarCircleSource"
          shape={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: cord,
            },
            properties: {},
          }}>
          <Mapbox.CircleLayer
            id="radarCircleLayer"
            style={{
              circleRadius: radius, // Animated radius for expanding effect
              circleColor: 'rgba(0, 200, 255, 0.3)', // Semi-transparent blue for radar look
              circleOpacity: 0.6, // Set opacity for effect
              circleStrokeWidth: 1,
              circleStrokeColor: 'rgba(0, 200, 255, 0.8)', // Stronger outline for the radar
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView> */}
      <RadarMap />
    </>
  );
}

export default App;
