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
import {View, StyleSheet, Alert, Text, Dimensions} from 'react-native';
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

// Utility function to generate static circle border
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
  const angleRef = useRef(0); // Use ref to store angle
  const animationIdRef = useRef(null); // Use ref to hold the animation frame ID
  const radarRef = useRef(null); // Use ref for ShapeSource

const radarBeam = useMemo(
  () => createRadarBeam(center, radius, angleRef.current, 45),
  [center, radius, angleRef.current], // Add angleRef.current to dependencies
);

const staticCircle = useMemo(
  () => createStaticCircle(center, radius),
  [center, radius],
);

useEffect(() => {
  startRadarAnimation();
  // const rotateRadar = () => {
  //   angleRef.current = (angleRef.current + 0.09) % 360; // Increment angle

  //   // Update radar beam shape directly
  //   radarRef.current?.setNativeProps({
  //     shape: createRadarBeam(center, radius, angleRef.current, 45), // Use angleRef.current directly
  //   });

  //   animationIdRef.current = requestAnimationFrame(rotateRadar); // Request next frame
  // };

  // rotateRadar(); // Start rotation

  return () => {
    cancelAnimationFrame(animationIdRef.current); // Clean up animation
  };
}, [center, radius]);  // Add dependencies for re-calculating radarBeam if center or radius change


  const startRadarAnimation = () => {
    const rotateRadar = () => {
      angleRef.current = (angleRef.current + 1) % 360;
      if (radarRef.current) {
        console.log({angleRef: angleRef.current, radarRef: radarRef.current});
        // console.log({cc: radarRef.current.setNativeProps});
        radarRef.current.setNativeProps({
          style: {
            transform: [{rotate: `${angleRef.current}deg`}],
          },
        });
      }

      animationIdRef.current = requestAnimationFrame(rotateRadar);
    };

    // rotateRadar();
  };
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
        <ShapeSource id="radarSource" shape={radarBeam} ref={radarRef}>
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
