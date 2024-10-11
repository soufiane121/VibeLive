import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
  MapView,
  ShapeSource,
  LineLayer,
  Camera,
  FillLayer,
  LocationPuck,
  setAccessToken,
 
} from '@rnmapbox/maps';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {PUB_MAPBOX_KEY} from '@env';
import Geolocation from '@react-native-community/geolocation';

setAccessToken(PUB_MAPBOX_KEY);

const createRadarBeam = (
  center,
  radius,
  startAngle,
  sweepAngle,
  numPoints = 30,
) => {
  const coordinates = [center]; // Start with center point
  const startRadians = (startAngle * Math.PI) / 180;
  const sweepRadians = (sweepAngle * Math.PI) / 180;
  const latitude = center[1];
  const adjustedRadiusX = radius / Math.cos((latitude * Math.PI) / 180);

  for (let i = 0; i <= numPoints; i++) {
    const angle = startRadians + (i * sweepRadians) / numPoints;
    const x = center[0] + adjustedRadiusX * Math.cos(angle);
    const y = center[1] + radius * Math.sin(angle);
    coordinates.push([x, y]);
  }

  coordinates.push(center); // Close the polygon
  return {
    type: 'Polygon',
    coordinates: [coordinates], // GeoJSON format
  };
};

const createStaticCircle = (center, radius, numPoints = 64) => {
  const coordinates = [];
  const latitude = center[1];
  const adjustedRadiusX = radius / Math.cos((latitude * Math.PI) / 180);

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    const x = center[0] + adjustedRadiusX * Math.cos(angle);
    const y = center[1] + radius * Math.sin(angle);
    coordinates.push([x, y]);
  }

  coordinates.push(coordinates[0]); // Close the circle
  return {
    type: 'Polygon',
    coordinates: [coordinates], // GeoJSON format
  };
};

const RadarMap = () => {
  const center = useMemo(() => [-122.406417, 37.785834], []); // Center of radar
  const radius = 0.005; // Radar radius (in degrees)
  const radarRef = useRef(null); // Use ref for ShapeSource
  const animatedValue = useRef(new Animated.Value(0)).current;

  const staticCircle = useMemo(
    () => createStaticCircle(center, radius),
    [center, radius],
  );

  useEffect(() => {
    // Animation loop
    const startRadarAnimation = () => {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 360, // Rotate through 360 degrees
          duration: 5000, // 5 seconds for a full rotation
          easing: Easing.linear,
          useNativeDriver: false, // Not using native driver since we are updating manually
        }),
      ).start();
    };

    startRadarAnimation(); // Start the animation loop

    // Cleanup animation on unmount
    return () => animatedValue.stopAnimation();
  }, [animatedValue]);

  useEffect(() => {
    // Whenever the animated value changes, update the radar beam's shape
    const listenerId = animatedValue.addListener(({value}) => {
      const updatedRadarBeam = createRadarBeam(center, radius, value, 45); // Update radar beam shape

      // Apply the updated shape to the radar
      if (radarRef.current) {
        radarRef.current.setNativeProps({
          shape: updatedRadarBeam, // Update radar beam
        });
      }
    });

    // Clean up the listener on unmount
    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [center, radius, animatedValue]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
        scaleBarEnabled={false}
        logoEnabled={false}>
        <Camera zoomLevel={14} centerCoordinate={center} />
        {/* Static Circle Border Shape */}
        <ShapeSource id="circleBorderSource" shape={staticCircle}>
          <LineLayer
            id="circleBorder"
            style={{
              lineColor: 'rgba(110, 255, 0, 0.6)', // Static border color
              lineWidth: 2,
            }}
          />
        </ShapeSource>
        {/* Animated Radar Beam Shape */}
        <ShapeSource
          id="radarSource"
          shape={createRadarBeam(center, radius, 0, 45)}
          ref={radarRef}>
          <FillLayer
            id="radarBeam"
            style={{
              fillColor: 'rgba(255, 165, 0, 0.3)', // Radar beam color
              fillOpacity: 0.6,
            }}
          />
        </ShapeSource>
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  textContainer: {
    zIndex: 1,
    flexDirection: 'column-reverse',
    justifyContent: 'flex-end', // Pushes the content to the bottom
    alignItems: 'flex-end', // Center horizontally
    // paddingBottom: 20, // Add padding at the bottom
    backgroundColor: 'transparent', // Semi-transparent background for readability
    position: 'absolute', // Position at the bottom
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    // width: "20%"
  },
  text: {
    color: 'red',
    fontSize: 20,
  },
});

export default RadarMap;
