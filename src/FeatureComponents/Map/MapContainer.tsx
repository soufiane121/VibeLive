import React, {useEffect, useRef, useMemo, MutableRefObject} from 'react';
import {
  setAccessToken,
  ShapeSource,
  setTelemetryEnabled,
  Camera,
} from '@rnmapbox/maps';
import {View, StyleSheet, Text} from 'react-native';
import {PUB_MAPBOX_KEY} from '@env';
import Map from './Map';
import {createRadarBeam, createStaticCircle} from './HelperFuncs';
import useGetLocation from '../../CustomHooks/useGetLocation';
import {featureCollection, point} from '@turf/helpers';
import ResetLocationButton from './ResetLocationButton';

setAccessToken(PUB_MAPBOX_KEY);

const MapContainer = () => {
  const {coordinates} = useGetLocation();
  const center = useMemo(() => [...coordinates], [coordinates]); // Center of radar
  const radius = 0.005; // Radar radius (in degrees)
  const radarRef = useRef<ShapeSource>(null); // Ref for ShapeSource
  const angleRef = useRef(0); // Ref to track current angle
  const animationIdRef = useRef<number | null>(null); // To store the animation frame reference
  const throttleUpdate = useRef(false); // Ref for throttling updates
  const cameraRef = useRef<Camera | null>(null);
  const activies = [
    [-80.856917, 35.225859],
    [-80.85591, 35.221859],
    [-80.85591, 35.223859],
    [-80.85091, 35.223859],
    [-80.85291, 35.226859],
  ];

  const coordinatesPoints = activies.map(ele => point(ele));

  // Create static radar beam (initial)
  const radarBeam = useMemo(
    () => createRadarBeam(center, radius, 0, 45, 10), // Reduced numPoints for efficiency
    [center, radius],
  );

  // Create static circle border
  const staticCircle = useMemo(
    () => createStaticCircle(center, radius),
    [center, radius],
  );

  useEffect(() => {
    setTelemetryEnabled(false);
    const rotateRadar = () => {
      angleRef.current = (angleRef.current + 0.2) % 360;
      if (!throttleUpdate.current) {
        throttleUpdate.current = true;

        // Throttle radar beam updates to once every 100ms
        setTimeout(() => {
          const updatedRadarBeam = createRadarBeam(
            center,
            radius,
            angleRef.current,
            45,
          );
          if (radarRef.current) {
            radarRef.current.setNativeProps({shape: updatedRadarBeam});
          }
          throttleUpdate.current = false;
        }, 100);
      }
      animationIdRef.current = requestAnimationFrame(rotateRadar); // Continue animation
    };

    // rotateRadar(); // Start the animation
    return () => {
      cancelAnimationFrame(animationIdRef.current); // Clean up animation on unmount
    };
  }, [center, radius]);

  const handleResetcurrentLocation = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: coordinates,
      zoomLevel: 14,
      animationDuration: 1000,
    });
  };

  return (
    <View style={styles.container}>
      {center.length > 0 && (
        <Map
          coordinate={center}
          radarBeam={radarBeam}
          staticCircle={staticCircle}
          radarRef={radarRef}
          activitiesShape={featureCollection(coordinatesPoints)}
          cameraRef={cameraRef}
        />
      )}
      {/* <View className="z-10 flex-col justify-end items-end absolute left-0 right-0 top-0 bottom-0">
        <Text>Hello there</Text>
      </View> */}
      <ResetLocationButton
        onPress={handleResetcurrentLocation}
        styles="
        flex
        z-10 
        absolute 
        bottom-0 
        right-3 
        justify-end 
        items-end 
        bg-slate-500 
        w-18
        h-18
        opacity-70
        rounded-full
        opacity-8
        p-2"
        iconStyle={{
          size: 19,
          color: '#cbd5e1',
          backgroundColor: 'transparent',
          fontSize: 40,
          width: 40,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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

export default MapContainer;
