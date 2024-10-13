import React from 'react';
import {
  MapView,
  ShapeSource,
  LineLayer,
  Camera,
  FillLayer,
  LocationPuck,
  setAccessToken,
} from '@rnmapbox/maps';
import {StyleSheet} from 'react-native';

type Props = {
  coordinate: number[];
  staticCircle: any;
  radarBeam: any;
  radarRef: any;
};

const Map = (props: Props) => {
  const {coordinate, staticCircle, radarBeam, radarRef} = props;

  return (
    <>
      <MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        scaleBarEnabled={false}
        logoEnabled={false}>
        <Camera zoomLevel={14} centerCoordinate={coordinate} />
        {/* Static Circle Border Shape */}
        <ShapeSource id="circleBorderSource" shape={staticCircle}>
          <LineLayer
            id="circleBorder"
            style={{
              lineColor: 'rgba(110, 255, 0, 0.6)', // Static border color (green, semi-transparent)
              lineWidth: 2,
            }}
          />
        </ShapeSource>
        {/* <LocationPuck puckBearingEnabled puckBearing="course" /> */}
        {/* Animated Radar Beam Shape */}
        <ShapeSource id="radarSource" shape={radarBeam} ref={radarRef}>
          <FillLayer
            id="radarBeam"
            style={{
              fillColor: 'rgba(255, 165, 0, 0.3)', // Radar beam color (orange, semi-transparent)
              fillOpacity: 0.6,
            }}
          />
        </ShapeSource>
      </MapView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    backgroundColor: "red"
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

export default Map;
