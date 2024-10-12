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

// Utility function to create radar beam
const createRadarBeam = (center, radius, startAngle, sweepAngle, numPoints = 10) => {
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

// Utility function to create static circle border
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
  const radarRef = useRef(null); // Ref for ShapeSource
  const angleRef = useRef(0); // Ref to track current angle
  const animationIdRef = useRef(null); // To store the animation frame reference
  const throttleUpdate = useRef(false); // Ref for throttling updates

  // Create static radar beam (initial)
  const radarBeam = useMemo(
    () => createRadarBeam(center, radius, 0, 45, 10), // Reduced numPoints for efficiency
    [center, radius]
  );

  // Create static circle border
  const staticCircle = useMemo(() => createStaticCircle(center, radius), [center, radius]);

  useEffect(() => {
    const rotateRadar = () => {
      angleRef.current = (angleRef.current + 1) % 360; // Update angle
      if (!throttleUpdate.current) {
        throttleUpdate.current = true;

        // Throttle radar beam updates to once every 100ms
        setTimeout(() => {
          const updatedRadarBeam = createRadarBeam(center, radius, angleRef.current, 45);
          if (radarRef.current) {
            radarRef.current.setNativeProps({ shape: updatedRadarBeam });
          }
          throttleUpdate.current = false; // Reset throttle flag
        }, 100); // Update every 100ms
      }
      animationIdRef.current = requestAnimationFrame(rotateRadar); // Continue animation
    };

    rotateRadar(); // Start the animation

    return () => {
      cancelAnimationFrame(animationIdRef.current); // Clean up animation on unmount
    };
  }, [center, radius]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
        scaleBarEnabled={false}
        logoEnabled={false}
      >
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
