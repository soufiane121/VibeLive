import React, {useState, useEffect} from 'react';
import MapboxGL from '@rnmapbox/maps';
import {View, StyleSheet, Alert} from 'react-native';

MapboxGL.setAccessToken(
  'sk.eyJ1IjoidGVzdC0xMjEiLCJhIjoiY20xd3drYzVhMHJ3azJqb2ttZmJjYTY1ZCJ9.k03054nYYuW8sQtJkU522w',
);

// Utility function to generate a radar arc polygon (animated beam)
const createRadarBeam = (
  center,
  radius,
  startAngle,
  sweepAngle,
  numPoints = 30,
) => {
  const coordinates = [center]; // Start with center point

  // Convert angles to radians
  const startRadians = (startAngle * Math.PI) / 180;
  const sweepRadians = (sweepAngle * Math.PI) / 180;
  const latitude = center[1]; // Latitude of the center point

  // Factor in the distortion due to the latitude when calculating the circle
  const adjustedRadiusX = radius / Math.cos((latitude * Math.PI) / 180); // Adjust radius for longitude

  for (let i = 0; i <= numPoints; i++) {
    const angle = startRadians + (i * sweepRadians) / numPoints;
    const x = center[0] + adjustedRadiusX * Math.cos(angle); // Adjust longitude
    const y = center[1] + radius * Math.sin(angle); // Latitude stays the same
    coordinates.push([x, y]);
  }

  coordinates.push(center); // Close the polygon by returning to the center

  return {
    type: 'Polygon',
    coordinates: [coordinates], // GeoJSON format
  };
};

// Utility function to generate static circle border
const createStaticCircle = (center, radius, numPoints = 64) => {
  const coordinates = [];
  const latitude = center[1]; // Latitude of the center point

  // Factor in the distortion due to latitude when calculating the circle
  const adjustedRadiusX = radius / Math.cos((latitude * Math.PI) / 180); // Adjust radius for longitude

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    const x = center[0] + adjustedRadiusX * Math.cos(angle); // Adjust longitude
    const y = center[1] + radius * Math.sin(angle); // Latitude stays the same
    coordinates.push([x, y]);
  }

  return {
    type: 'Polygon',
    coordinates: [coordinates], // GeoJSON format for static circle
  };
};

const RadarMap = () => {
  const [startAngle, setStartAngle] = useState(0); // Initial radar sweep angle
  const [center, setCenter] = useState([-122.406417, 37.785834]); // Center of radar (longitude, latitude)
  const radius = 0.005; // Radar radius (in degrees, adjust accordingly)

  const getLocation = async () => {
    try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to use this feature.',
          );
          return;
        }
    
        Geolocation.getCurrentPosition(
          position => {
            const {latitude, longitude} = position.coords;
            setCenter([longitude, latitude]);
          },
          error => {
            console.log(error);
            Alert.alert('Error', 'Unable to get location.');
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
        
    } catch (error) {
        
    }
  };

  useEffect(() => {
    getLocation();
    const rotateRadar = () => {
      setStartAngle(prevAngle => (prevAngle + 0.5) % 360); // Increment angle for slower rotation
      requestAnimationFrame(rotateRadar); // Continue the animation
    };

    rotateRadar(); // Start rotation
    return () => cancelAnimationFrame(rotateRadar); // Clean up animation
  }, []);

  // Create the radar beam polygon (sweeping animation)
  const radarBeam = createRadarBeam(center, radius, startAngle, 45); // Sweep angle of 45 degrees
  // Create the static circle border
  const staticCircle = createStaticCircle(center, radius);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11">
        <MapboxGL.Camera zoomLevel={14} centerCoordinate={center} />

        {/* Static Circle Border Shape */}
        <MapboxGL.ShapeSource id="circleBorderSource" shape={staticCircle}>
          <MapboxGL.LineLayer
            id="circleBorder"
            style={{
              lineColor: 'rgba(110, 255, 0, 0.6)', // Static border color (green, semi-transparent)
              lineWidth: 2,
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Animated Radar Beam Shape */}
        <MapboxGL.ShapeSource id="radarSource" shape={radarBeam}>
          <MapboxGL.FillLayer
            id="radarBeam"
            style={{
              fillColor: 'rgba(255, 165, 0, 0.3)', // Radar beam color (orange, semi-transparent)
              fillOpacity: 0.6,
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>
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
});

export default RadarMap;
