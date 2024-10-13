import React, {useEffect, useRef, useMemo, MutableRefObject} from 'react';
import {setAccessToken, ShapeSource} from '@rnmapbox/maps';
import {View, StyleSheet} from 'react-native';
import {PUB_MAPBOX_KEY} from '@env';
import Map from './Map';
import {createRadarBeam, createStaticCircle} from './HelperFuncs';
import useGetLocation from '../../CustomHooks/useGetLocation';

setAccessToken(PUB_MAPBOX_KEY);

const MapContainer = () => {
  const {coordinates} = useGetLocation();
  const center = useMemo(() => [...coordinates], [coordinates]); // Center of radar
  const radius = 0.005; // Radar radius (in degrees)
  const radarRef = useRef<ShapeSource>(null); // Ref for ShapeSource
  const angleRef = useRef(0); // Ref to track current angle
  const animationIdRef = useRef<number | null>(null); // To store the animation frame reference
  const throttleUpdate = useRef(false); // Ref for throttling updates

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

  return (
    <View style={styles.container}>
      <Map
        coordinate={center}
        radarBeam={radarBeam}
        staticCircle={staticCircle}
        radarRef={radarRef}
      />
      {/* <View style={styles.textContainer}>
        <Text style={styles.text}>Hello there</Text>
      </View> */}
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
