import React, {useEffect, useRef, memo, useMemo, useCallback} from 'react';
import {
  MapView,
  Camera,
  ShapeSource,
  SymbolLayer,
  CircleLayer,
  Images,
  setAccessToken,
} from '@rnmapbox/maps';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {point} from '@turf/helpers';
import Supercluster from 'supercluster';
import {debounce, throttle} from 'lodash';
import {PUB_MAPBOX_KEY} from '@env';

const twIcon = require('./assests/tw.png');
const inIcon = require('./assests/in.png');

setAccessToken(PUB_MAPBOX_KEY);

// Generate 10,000+ random markers
const generateFeatures = count => {
  return Array.from({length: count}, (_, index) => ({
    id: `${index + 1}`,
    isLive: index % 3 === 0,
    coordinates: [
      -80.856917 + Math.random() * 0.1,
      35.225859 + Math.random() * 0.1,
    ],
  }));
};

const sampleFeatures = generateFeatures(10000);

// Memoized marker component to avoid unnecessary re-renders
const LiveIcon = memo(
  ({feature, circleLayerRef}) => {
    if (!feature.isLive) return null;

    return (
      <ShapeSource
        key={`marker-${feature.id}`}
        id={`marker-${feature.id}`}
        shape={point(feature.coordinates)}>
        <CircleLayer
          ref={circleLayerRef} // Reference to directly update properties
          id={`pulse-${feature.id}`}
          style={{
            circleRadius: 10, // Initial radius
            circleColor: 'rgba(255, 0, 0, 0.5)',
            circleOpacity: 0.5, // Initial opacity
          }}
        />
        <SymbolLayer
          id={`icon-${feature.id}`}
          style={{
            iconImage: 'tw',
            iconSize: 0.1,
          }}
        />
      </ShapeSource>
    );
  },
  (prevProps, nextProps) => prevProps.feature.id === nextProps.feature.id,
);

const RadarMap = () => {
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const [clusters, setClusters] = React.useState([]);
  const [bounds, setBounds] = React.useState([-80.9, 35.2, -80.8, 35.3]);
  const [zoomLevel, setZoomLevel] = React.useState(14);

  const circleLayerRefs = useRef({}); // Store references to the CircleLayer components

  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 75,
      maxZoom: 20,
    });

    cluster.load(
      sampleFeatures.map(feature => ({
        type: 'Feature',
        properties: {
          cluster: false,
          ...feature,
        },
        geometry: {
          type: 'Point',
          coordinates: feature.coordinates,
        },
      })),
    );

    return cluster;
  }, []);

  // Recalculate clusters when bounds or zoomLevel changes
  useEffect(() => {
    const debouncedFetchClusters = debounce(() => {
      if (bounds && zoomLevel) {
        const newClusters = supercluster.getClusters(bounds, zoomLevel);
        setClusters(newClusters);
      }
    }, 300);

    debouncedFetchClusters();

    return () => {
      debouncedFetchClusters.cancel();
    };
  }, [bounds, zoomLevel, supercluster]);

  // Pulse animation for live markers without using listeners
  useEffect(() => {
    const animatePulse = () => {
      Animated.loop(
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false, // Disable native driver for non-transform properties
        }),
      ).start();
    };

    // Update animation frame directly within the animation block
    pulseAnimation.addListener(({value}) => {
      const scale = 10 + value * 30;
      const opacity = 0.5 - value * 0.5;

      // Apply changes to all CircleLayer refs directly
      Object.values(circleLayerRefs.current).forEach(ref => {
        if (ref) {
          ref.setNativeProps({
            style: {
              circleRadius: scale,
              circleOpacity: opacity,
            },
          });
        }
      });
    });

    animatePulse();

    return () => {
      pulseAnimation.stopAnimation();
    };
  }, [pulseAnimation]);

  // Throttled region update handler
  const handleRegionChange = useCallback(
    throttle(async map => {
      const region = await map.getVisibleBounds();
      const {ne, sw} = region;
      const newBounds = [sw.lng, sw.lat, ne.lng, ne.lat];
      setBounds(newBounds);

      const zoom = await map.getZoom();
      setZoomLevel(zoom);
    }, 300),
    [],
  );

  const shouldRenderMarkers = zoomLevel > 10;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        onCameraChanged={handleRegionChange}
        styleURL="mapbox://styles/mapbox/streets-v11">
        <Images images={{tw: twIcon, in: inIcon}} />
        <Camera
          zoomLevel={zoomLevel}
          centerCoordinate={[-80.856917, 35.225859]}
        />

        {shouldRenderMarkers &&
          clusters.map(cluster => {
            const isCluster = cluster.properties.cluster;
            const coordinates = cluster.geometry.coordinates;
            const id = isCluster
              ? `cluster-${cluster.properties.cluster_id}`
              : `marker-${cluster.properties.id}`;

            return isCluster ? (
              <ShapeSource key={id} id={id} shape={point(coordinates)}>
                <SymbolLayer
                  id={`cluster-icon-${id}`}
                  style={{
                    iconImage: 'tw',
                    iconSize: 0.1,
                  }}
                />
              </ShapeSource>
            ) : (
              <LiveIcon
                key={id}
                feature={{
                  id: cluster.properties.id,
                  isLive: !isCluster,
                  coordinates,
                }}
                circleLayerRef={ref => {
                  circleLayerRefs.current[`pulse-${cluster.properties.id}`] =
                    ref;
                }}
              />
            );
          })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  map: {flex: 1},
});

export default RadarMap;
