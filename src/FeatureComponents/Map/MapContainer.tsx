import React, {
  useEffect,
  useRef,
  memo,
  useMemo,
  useCallback,
  useState,
} from 'react';
import {
  MapView,
  Camera,
  ShapeSource,
  SymbolLayer,
  CircleLayer,
  Images,
  setAccessToken,
  setTelemetryEnabled,
  FillLayer,
  LocationPuck,
} from '@rnmapbox/maps';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {point} from '@turf/helpers';
import Supercluster from 'supercluster';
import {debounce, throttle} from 'lodash';
import {PUB_MAPBOX_KEY} from '@env';
import useGetLocation from '../../CustomHooks/useGetLocation';
import {
  createRadarBeam,
  createStaticCircle,
  newCreateRadarBeam,
} from './HelperFuncs';
import ResetLocationButton from './ResetLocationButton';
import {useGetAllMapPointsMutation} from '../../../features/LiveStream/LiveStream';
import {useSelector} from 'react-redux';
import {useSocketInstance} from '../../CustomHooks/useSocketInstance';
import {PartialState, useNavigation} from '@react-navigation/native';
import { NativeStackNavigationProp } from 'react-native-screens/lib/typescript/native-stack/types';

const twIcon = require('../../../assests/tw.png');
const inIcon = require('../../../assests/in.jpg');

setAccessToken(PUB_MAPBOX_KEY);

// Generate 10,000+ random markers
const generateFeatures = count => {
  return Array.from({length: count}, (_, index) => ({
    id: `${index + 1}`,
    isLive: index % 3 === 0,
    coordinates: [
      -80.718976 + Math.random() * 0.1,
      35.15989 + Math.random() * 0.1,
    ],
  }));
};

const sampleFeatures = generateFeatures(10);

// Memoized marker component to avoid unnecessary re-renders
const LiveIcon = memo(
  ({feature, circleLayerRef}) => {
    const {navigate} = useNavigation<NativeStackNavigationProp<PartialState<any>>>();
    if (!feature.isLive) return null;

    return (
      <ShapeSource
        key={`marker-${feature.id}`}
        id={`marker-${feature.id}`}
        shape={point(feature.coordinates)}
        {...feature}
        onPress={e => {
          navigate('StreamPlayer', {
            properties: {...feature.properties},
          });
          console.log('clicked on the icon', {e: feature.properties});
        }}>
        <CircleLayer
          ref={circleLayerRef} // Reference to directly update properties
          id={`pulse-${feature.id}`}
          style={{
            circleRadius: 70, // Initial radius
            circleColor: 'rgba(255, 0, 0, 0.5)',
            circleOpacity: 0.9, // Initial opacity
          }}
        />
        <SymbolLayer
          id={`icon-${feature.id}`}
          style={{
            iconImage: feature.imageUrl || 'tw',
            iconSize: 0.1,
          }}
        />
      </ShapeSource>
    );
  },
  (prevProps, nextProps) => prevProps.feature.id === nextProps.feature.id,
);
const USA_BOUNDS = [
  [-125.0, 24.0], // Southwest corner [longitude, latitude]
  [-66.9, 49.0], // Northeast corner [longitude, latitude]
];

const MapContainer = () => {
  const {coordinates} = useGetLocation();
  const [fetchMapFeatures, {data, isSuccess, isLoading}] =
    useGetAllMapPointsMutation();
  const [featuresPointsData, setFeaturesPointsData] = useState([]);
  const center = useMemo(() => [...coordinates], [coordinates]); // Center of radar
  const radius = 0.005; // Radar radius (in degrees)
  const radarRef = useRef<ShapeSource>(null); // Ref for ShapeSource
  const angleRef = useRef(0); // Ref to track current angle
  const animationIdRef = useRef<number | null>(null); // To store the animation frame reference
  const throttleUpdate = useRef(false); // Ref for throttling updates
  const cameraRef = useRef<Camera | null>(null);
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const [clusters, setClusters] = React.useState([]);
  const [bounds, setBounds] = React.useState([-80.9, 35.2, -81.8, 36.3]);
  const [zoomLevel, setZoomLevel] = React.useState(14);
  const {socket} = useSocketInstance();


  useEffect(() => {
    // add new marker to map
    socket?.on('add-to-map', data => {
      console.log({data}, 'add-to-map');
      setFeaturesPointsData(prevState => [...prevState, data?.data?.mapItem]);
    });
  }, [socket]);

  useEffect(() => {
    if (coordinates.length > 0) {
      handleGetMapsPoints();
    }
  }, [coordinates.length]);

  // Register dynamic images using URLs
  const images = useMemo(() => {
    const imgUrl =
      'https://fastly.picsum.photos/id/218/20/20.jpg?hmac=pIx-HTJBJRheNaHmhgqsQRX8JbTGvag_zic9NTNWFJU';
    const imageRegistry = {} as any;
    featuresPointsData.forEach(feature => {
      imageRegistry[feature?.imageUrl] = {uri: feature?.imageUrl};
    });
    return imageRegistry;
  }, [featuresPointsData]);

  const handleGetMapsPoints = async () => {
    try {
      const {data} = await fetchMapFeatures({
        coordinates,
      }).unwrap();
      if (data) {
        setFeaturesPointsData(data.features);
      }
    } catch (error) {}
  };

  const circleLayerRefs = useRef({}); // Store references to the CircleLayer components

  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 20,
      maxZoom: 22,
    });
    cluster.load(featuresPointsData);

    return cluster;
  }, [featuresPointsData]);

  // Recalculate clusters when bounds or zoomLevel changes
  useEffect(() => {
    const debouncedFetchClusters = debounce(() => {
      if (bounds && zoomLevel && featuresPointsData.length > 0) {
        const newClusters = supercluster.getClusters(bounds, zoomLevel);
        setClusters(newClusters);
      }
    }, 300);

    debouncedFetchClusters();

    return () => {
      debouncedFetchClusters.cancel();
    };
  }, [bounds, zoomLevel, supercluster, featuresPointsData.length]);

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

  // Throttled region update handler
  const handleRegionChange = useCallback(
    throttle(async map => {
      const region = await map?.getVisibleBounds();
      const {ne, sw} = region;
      const newBounds = [sw.lng, sw.lat, ne.lng, ne.lat];
      setBounds(newBounds);

      const zoom = await map.getZoom();
      setZoomLevel(zoom);
    }, 300),
    [],
  );

  const radarBeam = useMemo(
    () => newCreateRadarBeam(center, radius, 0, 45, 10), // Reduced numPoints for efficiency
    [center, radius],
  );

  const shouldRenderMarkers = zoomLevel > 10;

  const handleResetcurrentLocation = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: coordinates,
      zoomLevel: 14,
      animationDuration: 2000,
    });
  };
  return (
    <View style={styles.container}>
      {coordinates.length > 0 && (
        <>
          <MapView
            style={styles.map}
            onCameraChanged={handleRegionChange}
            styleURL="mapbox://styles/mapbox/dark-v11"
            scaleBarEnabled={false}
            logoEnabled={false}>
            <Camera
              zoomLevel={zoomLevel}
              centerCoordinate={coordinates}
              maxBounds={USA_BOUNDS} // Restrict the map to USA bounds
              minZoomLevel={8} // Prevent zooming out too far
              maxZoomLevel={17}
              ref={cameraRef}
            />
            {/* still need to copy radar animation to here
             */}
            <LocationPuck puckBearingEnabled puckBearing="course" />
            <ShapeSource id="radarSource" data={radarBeam} ref={radarRef}>
              <FillLayer
                id="radarBeam"
                style={{
                  fillColor: '#cbd5e1', // Radar beam color (orange, semi-transparent)
                  fillOpacity: 0.2,
                }}
              />
            </ShapeSource>
            <Images
              images={
                !images.hasOwnProperty('undefined')
                  ? images
                  : {tw: twIcon, in: inIcon}
              }
              // images={{tw: twIcon, in: inIcon}}
            />

            {shouldRenderMarkers &&
              clusters.map(cluster => {
                const isCluster = cluster.properties.cluster;
                const imageUrl = cluster?.properties?.imageUrl || 'in';
                const coordinates = cluster.geometry.coordinates;
                const id = isCluster
                  ? `cluster-${cluster.properties.cluster_id}`
                  : `marker-${cluster.properties.id}`;

                return isCluster ? (
                  <ShapeSource
                    key={id}
                    id={id}
                    {...cluster.properties}
                    shape={point(coordinates)}
                    clusterRadius={50}>
                    <SymbolLayer
                      id={`cluster-icon-${id}`}
                      style={{
                        iconImage: imageUrl || 'in',
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
                      imageUrl: cluster?.properties?.imageUrl,
                      properties: {...cluster?.properties},
                    }}
                    circleLayerRef={ref => {
                      circleLayerRefs.current[
                        `pulse-${cluster.properties.id}`
                      ] = ref;
                    }}
                  />
                );
              })}
          </MapView>
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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  map: {flex: 1},
});

export default MapContainer;
