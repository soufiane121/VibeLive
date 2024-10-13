import React from 'react';
import {
  MapView,
  ShapeSource,
  LineLayer,
  Camera,
  FillLayer,
  LocationPuck,
  setAccessToken,
  SymbolLayer,
  Image,
  Images,
  CircleLayer,
} from '@rnmapbox/maps';
import {StyleSheet} from 'react-native';
import live from '../../../assests/live.png';

type Props = {
  coordinate: number[];
  staticCircle: any;
  radarBeam: any;
  radarRef: any;
  activitiesShape: any;
  cameraRef: any;
};

const Map = (props: Props) => {
  const {
    coordinate,
    staticCircle,
    radarBeam,
    radarRef,
    activitiesShape,
    cameraRef,
  } = props;

  return (
    <>
      <MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        scaleBarEnabled={false}
        logoEnabled={false}>
        <Camera zoomLevel={14} centerCoordinate={coordinate} ref={cameraRef} />
        {/* Static Circle Border Shape */}
        {/* <ShapeSource id="circleBorderSource" shape={staticCircle}>
          <LineLayer
            id="circleBorder"
            style={{
              lineColor: 'rgba(110, 255, 0, 0.6)', // Static border color (green, semi-transparent)
              lineWidth: 2,
            }}
          />
        </ShapeSource> */}
        {/* <LocationPuck puckBearingEnabled puckBearing="course" /> */}
        {/* Animated Radar Beam Shape */}
        <ShapeSource id="radarSource" shape={radarBeam} ref={radarRef}>
          <FillLayer
            id="radarBeam"
            style={{
              fillColor: '#cbd5e1', // Radar beam color (orange, semi-transparent)
              fillOpacity: 0.2,
            }}
          />
        </ShapeSource>
        <Images images={{live}} />

        <ShapeSource
          id="activities"
          shape={activitiesShape}
          cluster={true}
          clusterRadius={50}
          clusterMaxZoomLevel={14}>
          <SymbolLayer
            id="icon"
            style={{
              iconImage: 'live',
              iconSize: 0.03,
            }}
          />
          <CircleLayer
            id="clusterCircle"
            filter={['has', 'point_count']} // Only apply to clusters
            style={{
              circleColor: '#FF4F4F', // Color for cluster circle
              circleRadius: [
                'step',
                ['get', 'point_count'],
                20,
                10,
                30,
                50,
                40,
                100,
                50, // Adjust size based on the number of points in cluster
              ],
              circleOpacity: 0.6,
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
    backgroundColor: 'red',
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
