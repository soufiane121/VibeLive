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
  MarkerView,
} from '@rnmapbox/maps';
import {View, StyleSheet, Animated, Easing, Text} from 'react-native';
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
import {useDispatch, useSelector} from 'react-redux';
import {useSocketInstance} from '../../CustomHooks/useSocketInstance';
import {PartialState, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import {setCurrentUser} from '../../../features/registrations/CurrentUser';
import {eventsApi, Event, useGetMapEventsQuery} from '../../../features/Events/EventsApi';
// import {FloatingEmoji} from '../../FloatingAction/EmojiAnimation';
import {emojis as EMOJIS} from '../../Utils/emojis';
import {FloatingEmoji} from '../../FloatingAction/FloatEmojiAnimation';
import { useAnalytics } from '../../Hooks/useAnalytics';

const twIcon = require('../../../assests/tw.png');
const inIcon = require('../../../assests/in.jpg');
const eventIcon = require('../../../assests/event-marker.png'); // We'll need to add this icon

setAccessToken(PUB_MAPBOX_KEY);

// Memoized event marker component
const EventIcon = memo(
  ({event, trackMapInteraction}: {event: Event; trackMapInteraction: any}) => {
    const {navigate} =
      useNavigation<NativeStackNavigationProp<PartialState<any>>>();

    const getEventTypeColor = (eventType: string) => {
      const colors = {
        music: '#9333ea', // Purple
        sports: '#059669', // Green
        nightlife: '#dc2626', // Red
        festival: '#ea580c', // Orange
        conference: '#0284c7', // Blue
        comedy: '#ca8a04', // Yellow
        theater: '#7c3aed', // Violet
        art: '#db2777', // Pink
        food: '#16a34a', // Green
        other: '#6b7280', // Gray
      };
      return colors[eventType as keyof typeof colors] || colors.other;
    };

    const isPromoted = event.promotionStatus === 'map' || event.promotionStatus === 'both';

    return (
      <ShapeSource
        key={`event-${event._id}`}
        id={`event-${event._id}`}
        shape={point(event.location.coordinates)}
        onPress={e => {
          // Track event marker click analytics
          trackMapInteraction('event_marker_clicked', {
            eventId: event._id,
            eventTitle: event.title,
            eventType: event.eventType,
            eventCoordinates: event.location.coordinates,
            isPromoted: isPromoted,
            rsvpCount: event.rsvpCount,
            attendeeCount: event.attendeeCount,
            isFree: event.ticketing.isFree,
            price: event.ticketing.price,
            startDate: event.startDate,
            timestamp: new Date().toISOString(),
          });

          navigate('EventDetails', {
            eventId: event._id,
          });
        }}>
        {isPromoted && (
          <CircleLayer
            id={`event-promotion-${event._id}`}
            style={{
              circleRadius: 25,
              circleColor: getEventTypeColor(event.eventType),
              circleOpacity: 0.3,
              circleStrokeWidth: 2,
              circleStrokeColor: getEventTypeColor(event.eventType),
              circleStrokeOpacity: 0.8,
            }}
          />
        )}
        <CircleLayer
          id={`event-circle-${event._id}`}
          style={{
            circleRadius: 15,
            circleColor: getEventTypeColor(event.eventType),
            circleOpacity: 0.9,
            circleStrokeWidth: 2,
            circleStrokeColor: '#ffffff',
            circleStrokeOpacity: 1,
          }}
        />
        <SymbolLayer
          id={`event-icon-${event._id}`}
          style={{
            iconImage: 'event-icon',
            iconSize: 0.8,
            iconColor: '#ffffff',
          }}
        />
      </ShapeSource>
    );
  },
  (prevProps, nextProps) => prevProps.event._id === nextProps.event._id,
);

// Memoized marker component to avoid unnecessary re-renders
const LiveIcon = memo(
  ({feature, circleLayerRef, trackMapInteraction}: {feature: any; circleLayerRef: any; trackMapInteraction: any}) => {
    const {navigate} =
      useNavigation<NativeStackNavigationProp<PartialState<any>>>();
    if (!feature.isLive) return null;

    return (
      <ShapeSource
        key={`marker-${feature.id}`}
        id={`marker-${feature.id}`}
        shape={point(feature.coordinates)}
        {...feature}
        onPress={e => {
          // Track marker click analytics
          trackMapInteraction('map_marker_clicked', {
            markerId: feature.id,
            markerCoordinates: feature.coordinates,
            markerType: feature.properties?.liveDetails?.isLive
              ? 'live_stream'
              : 'marker',
            streamId: feature.properties?.streamId,
            streamerId: feature.properties?.userId,
            streamCategory:
              feature.properties?.category ||
              feature.properties?.liveDetails?.category ||
              'unknown',
            streamTitle:
              feature.properties?.title ||
              feature.properties?.liveDetails?.title ||
              '',
            isLive: feature.properties?.liveDetails?.isLive || false,
            viewerCount: feature.properties?.liveDetails?.viewerCount || 0,
            isBoosted: feature.properties?.isBoosted || false,
            timestamp: new Date().toISOString(),
          });

          if (feature.properties?.liveDetails?.isLive && !feature.hasNestedMarkers) {
            navigate('StreamPlayer', {
              properties: {...feature?.properties},
            });
          } else {
            navigate('carrouselSwiper', {
              groupedData: feature?.groupedFeatures,
            });
          }
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
  (prevProps: any, nextProps: any) => prevProps.feature.id === nextProps.feature.id,
);
const USA_BOUNDS = [
  [-125.0, 24.0], // Southwest corner [longitude, latitude]
  [-66.9, 49.0], // Northeast corner [longitude, latitude]
];

interface EmojisState {
  [key: string]: [{emoji: string; id: string}];
}
const MapContainer = () => {
  const {coordinates} = useGetLocation();
  const [fetchMapFeatures, {data, isSuccess, isLoading}] =
    useGetAllMapPointsMutation();
  const [featuresPointsData, setFeaturesPointsData] = useState([]);
  
  // Fetch events for map
  const { data: eventsData } = useGetMapEventsQuery({
    coordinates: `${coordinates[1]},${coordinates[0]}`,
    useDB: true, // Use database for testing
  });
  
  const [mapEvents, setMapEvents] = useState<Event[]>([]);
  const center = useMemo(() => [...coordinates], [coordinates]); // Center of radar
  const radius = 0.005; // Radar radius (in degrees)
  const radarRef = useRef<ShapeSource>(null); // Ref for ShapeSource
  const angleRef = useRef(0); // Ref to track current angle
  const animationIdRef = useRef<number | null>(null); // To store the animation frame reference
  const throttleUpdate = useRef(false); // Ref for throttling updates
  const cameraRef = useRef<Camera | null>(null);
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  
  // Analytics integration - using powerful useAnalytics for all tracking
  const { trackEvent, trackMapInteraction } = useAnalytics({ screenName: 'MapContainer', trackScreenView: true });
  
  const [clusters, setClusters] = React.useState([]);
  const [bounds, setBounds] = React.useState([-80.9, 35.2, -81.8, 36.3]);
  const [zoomLevel, setZoomLevel] = useState(14);
  const {socket, isConnected} = useSocketInstance();
  const [emojis, setEmojis] = useState<EmojisState>({});
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    // socket?.emit('get-updated-user', {}, (resp)=>{
    //   console.log({resp: resp.data.streamsDetails});
    //   dispatch(setCurrentUser(resp.data))
    // });

    // add new marker to map
    socket?.on('add-to-map', data => {
      console.log({data}, 'add-to-map---------------------');
      setFeaturesPointsData(prevState => [...prevState, data?.data?.mapItem]);
    });
    socket?.on('update-current-user', data => {
      console.log('socket new user', {data});
    });
    socket?.on('add-reaction-to-map', data => {
      const {id, reactEmogi} = data?.data;
      setEmojis(prevState => ({
        ...prevState,
        [id]: [...(prevState[id] || []), {id: Date.now(), emoji: reactEmogi}],
      }));
    });
  }, [socket]);

  useEffect(() => {
    if (coordinates.length > 0) {
      handleGetMapsPoints();
    }
  }, [coordinates.length]);

  // Update map events when data changes
  useEffect(() => {
    if (eventsData?.success && eventsData.data) {
      setMapEvents(eventsData.data);
    }
  }, [eventsData]);

  // Register dynamic images using URLs
  const images = useMemo(() => {
    const imgUrl =
      'https://fastly.picsum.photos/id/218/20/20.jpg?hmac=pIx-HTJBJRheNaHmhgqsQRX8JbTGvag_zic9NTNWFJU';
    const imageRegistry = {} as any;
    if (featuresPointsData.length > 0) {
      featuresPointsData?.forEach(feature => {
        imageRegistry[feature?.imageUrl] = {uri: feature?.imageUrl};
      });
    }
    // Add event icon - using a simple text-based icon for now
    imageRegistry['event-icon'] = {uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE5IDNIMTVWMUgxM1YzSDExVjFIOVYzSDVDMy45IDMgMyAzLjkgMyA1VjE5QzMgMjAuMSAzLjkgMjEgNSAyMUgxOUMyMC4xIDIxIDIxIDIwLjEgMjEgMTlWNUMyMSAzLjkgMjAuMSAzIDE5IDNaTTE5IDE5SDVWOEgxOVYxOVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='}; // Base64 encoded calendar SVG
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

    // animatePulse(); to start live circle animation

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
      // const region = await map?.getVisibleBounds();
      const region = await map?.getBounds()();
      const {ne, sw} = region;
      const newBounds = [sw.lng, sw.lat, ne.lng, ne.lat];
      setBounds(newBounds);

      const zoom = await map.getZoom();
      const previousZoom = zoomLevel;
      setZoomLevel(zoom);

      // Track map movement analytics
      trackMapInteraction('map_moved', {
        bounds: newBounds,
        center: [(sw.lng + ne.lng) / 2, (sw.lat + ne.lat) / 2],
        timestamp: new Date().toISOString()
      });

      // Track zoom change analytics if zoom level changed significantly
      if (Math.abs(zoom - previousZoom) > 0.5) {
        trackMapInteraction('map_zoomed', {
          previousZoom,
          newZoom: zoom,
          zoomDelta: zoom - previousZoom,
          bounds: newBounds,
          timestamp: new Date().toISOString()
        });
      }
    }, 300),
    [zoomLevel, trackMapInteraction],
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
            ref={mapRef}
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
            <ShapeSource id="radarSource" shape={radarBeam as any} ref={radarRef}>
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
                  ? {...images, 'event-icon': {uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE5IDNIMTVWMUgxM1YzSDExVjFIOVYzSDVDMy45IDMgMyAzLjkgMyA1VjE5QzMgMjAuMSAzLjkgMjEgNSAyMUgxOUMyMC4xIDIxIDIxIDIwLjEgMjEgMTlWNUMyMSAzLjkgMjAuMSAzIDE5IDNaTTE5IDE5SDVWOEgxOVYxOVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='}}
                  : {tw: twIcon, in: inIcon, 'event-icon': {uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE5IDNIMTVWMUgxM1YzSDExVjFIOVYzSDVDMy45IDMgMyAzLjkgMyA1VjE5QzMgMjAuMSAzLjkgMjEgNSAyMUgxOUMyMC4xIDIxIDIxIDIwLjEgMjEgMTlWNUMyMSAzLjkgMjAuMSAzIDE5IDNaTTE5IDE5SDVWOEgxOVYxOVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='}}
              }
            />

            {/* Render event markers */}
            {shouldRenderMarkers &&
              mapEvents.map(event => (
                <EventIcon
                  key={`event-${event._id}`}
                  event={event}
                  trackMapInteraction={trackMapInteraction}
                />
              ))}

            {/* Render live stream markers */}
            {shouldRenderMarkers &&
              clusters.map(cluster => {
                const isCluster = cluster.properties.cluster;
                const imageUrl = cluster?.properties?.imageUrl || 'in';
                const coordinates = cluster.geometry.coordinates;
                const id = isCluster
                  ? `cluster-${cluster.properties.id}`
                  : `marker-${cluster.properties.id}`;
                const hasNestedMarkers =
                  cluster?.hasOwnProperty('groupedFeatures');

                return !isCluster ? (
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
                  <>
                    <LiveIcon
                      key={id}
                      feature={{
                        id: cluster.properties.id,
                        isLive: isCluster,
                        coordinates: cluster.properties.coordinates, // Ensure this is an array [longitude, latitude]
                        imageUrl: cluster?.properties?.imageUrl,
                        properties: {
                          ...cluster?.properties,
                        },
                        hasNestedMarkers: hasNestedMarkers,
                        groupedFeatures: cluster?.groupedFeatures,
                      }}
                      circleLayerRef={ref => {
                        circleLayerRefs.current[
                          `pulse-${cluster.properties.id}`
                        ] = ref;
                      }}
                      trackMapInteraction={trackMapInteraction}
                    />

                    {emojis[cluster?.properties?.streamId] && (
                      <MarkerView coordinate={cluster?.properties?.coordinates}>
                        <>
                          {emojis[cluster?.properties?.streamId]?.map(
                            (emoji, idx) => {
                              return (
                                <FloatingEmoji
                                  key={idx}
                                  coordinates={cluster?.properties?.coordinates} // Ensure correct coordinates are passed here
                                  mapRef={mapRef} // Ensure mapRef is passed here correctly
                                  emoji={
                                    EMOJIS[emoji.emoji.toLocaleLowerCase()]
                                  }
                                  onComplete={() => {
                                    setEmojis(prevState => ({
                                      ...prevState,
                                      [cluster?.properties?.streamId]:
                                        prevState[
                                          cluster?.properties?.streamId
                                        ]?.filter(e => e.id !== emoji.id),
                                    }));
                                  }}
                                />
                              );
                            },
                          )}
                        </>
                      </MarkerView>
                    )}
                  </>
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
