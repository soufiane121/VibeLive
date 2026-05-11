import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  Touchable,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useNavigation, useNavigationState} from '@react-navigation/native';
import {MAPBOX_ENV_KEY} from '@env';
import Video from 'react-native-video'; // import Video from react-native-video like your normally would
import muxReactNativeVideo from '@mux/mux-data-react-native-video';
import {useSocketInstance} from '../CustomHooks/useSocketInstance';
import {useDispatch, useSelector} from 'react-redux';
import {useEffect, useState, useRef} from 'react';
import {CloseIcon, EyeViewsIcon} from '../UIComponents/Icons';
import {formatToKSymbol} from '../Utils/helperFuncs';
import {useAnalytics} from '../Hooks/useAnalytics';
import {GlobalColors} from '../styles/GlobalColors';
import FloatingEmojiReactions from '../FloatingAction/EmojiAnimation';
import BottomModal from '../UIComponents/BottomModal';
import ChatList from './ChatList';
import {
  useAddFollowMutation,
  useRemoveFollowMutation,
} from '../../features/LiveStream/LiveStream';
import {setCurrentUser} from '../../features/registrations/CurrentUser';

const colors = GlobalColors.StreamPlayer;

// ─────────────────────────────────────────────────────────────
// Responsive helpers — scale values relative to a baseline
// iPhone 14 Pro (393 × 852) is the design baseline.
// ─────────────────────────────────────────────────────────────
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

/** Scale a value horizontally (width-relative) */
const sw = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
/** Scale a value vertically (height-relative) */
const sh = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
/** Scale font sizes — clamped between 80% and 120% of original */
const sf = (size: number) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * Math.min(Math.max(scale, 0.8), 1.2));
};

// Status bar height for iOS (varies by device)
const STATUS_BAR_HEIGHT =
  Platform.OS === 'ios'
    ? // iPhone X+ / Dynamic Island devices have ≥ 44pt status bar
      SCREEN_HEIGHT >= 812
      ? 50
      : 20
    : StatusBar.currentHeight || 0;

type NavigationData = {
  properties?: {
    streamId: string;
    userId: string;
    liveDetails: any;
    coordinates: string[]; // Changed from number[] to string[]
  };
};

type Props = {
  streamId: string;
  userId: string;
  liveDetails?: any;
  coordinates?: string[]; // Changed from number[] to string[]
  parentGroupStreamId?: string;
};

const StreamPlayer = (props: Props) => {
  const [modalVisible, setModalVisible] = useState(false);
  let alertTimeoutId = useRef<NodeJS.Timeout | null>(null);

  // Get data from navigation if available, otherwise use direct props
  const navigationState = useNavigationState(state => {
    const route = state.routes.find(
      r => r.name === 'carrouselSwiper' || r.name === 'StreamPlayer',
    );
    return route?.params as NavigationData | undefined;
  });

  // Use navigation data if available, otherwise use direct props
  // At least one of them must be provided
  const streamId =
    navigationState?.parentData?.properties?.liveDetails?.playbackId ||
    navigationState?.parentData?.playbackId ||
    props?.liveDetails?.playbackId;
  const userId =
    navigationState?.parentData?.properties?.userId ||
    navigationState?.parentData?.userId ||
    props?.userId;

  // if (!streamId || !userId) {
  //   console.error('StreamPlayer: Missing required streamId or userId');
  //   return null;
  // }

  const liveDetails =
    navigationState?.parentData?.properties?.liveDetails ||
    props.liveDetails ||
    {};
  const coordinates = (navigationState?.parentData?.properties?.coordinates ||
    props.coordinates ||
    []) as string[];
  const dispatch = useDispatch();
  const [addFollow] = useAddFollowMutation();
  const [removeFollow] = useRemoveFollowMutation();
  const {socket, isConnected} = useSocketInstance();
  const {currentUser} = useSelector(state => state?.currentUser);
  const amIfollowing = currentUser?.following?.includes(userId);
  const [liveCount, setLiveCount] = useState<number>(9099);
  const MuxVideo = muxReactNativeVideo(Video);
  const {goBack, dispatch: navigationDispatch} = useNavigation();
  const [areYouFollowing, setAreYouFollowing] = useState(amIfollowing);
  const [titleAnim] = useState(new Animated.Value(0));
  const titleContainerWidth = sw(100); // responsive
  const titleTextWidth = sw(260); // responsive

  useEffect(() => {
    titleAnim.setValue(titleContainerWidth);
    Animated.loop(
      Animated.timing(titleAnim, {
        toValue: -titleTextWidth,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [liveDetails?.title]);

  useEffect(() => {
    if (socket) {
      // ── Named handlers so we can reliably remove them ──
      const handleStreamCounts = (data: any) => {
        console.log({data: data.data.liveDetails}, 'streamCount');
        setLiveCount(+data.data.liveDetails.liveViewrsCount);
      };

      const handleStreamStopped = (data: any) => {
        console.log('stream-stopped', {data});

        // Match on EITHER playbackId OR streamId so both normal-stop
        // (which includes playbackId) and disconnect-stop (which now also
        // includes playbackId) are caught.
        const matchesPlayback =
          data?.playbackId && data?.playbackId === streamId;
        const matchesStream =
          data?.streamId && data?.streamId === streamId;

        if (matchesPlayback || matchesStream) {
          if (alertTimeoutId.current) {
            clearTimeout(alertTimeoutId.current);
          }
          setModalVisible(true);

          alertTimeoutId.current = setTimeout(() => {
            setModalVisible(false);
            goBack();
          }, 9000); // 9 seconds
        }
      };

      socket?.emit(
        'start-watching-live',
        {
          streamUserId: userId,
          viewerUserId: currentUser._id,
        },
        ({data}) => {
          setLiveCount(+data?.liveDetails?.liveViewrsCount);
        },
      );

      socket.on('stream-counts', handleStreamCounts);
      socket.on('stream-stopped', handleStreamStopped);

      // CRITICAL: Clean up listeners on unmount / socket change to prevent
      // listener accumulation on reconnection.
      return () => {
        if (alertTimeoutId.current) {
          clearTimeout(alertTimeoutId.current);
        }
        socket.off('stream-counts', handleStreamCounts);
        socket.off('stream-stopped', handleStreamStopped);
      };
    }
  }, [socket]);

  const handleFollowAndUnfollow = async (e: any) => {
    try {
      if (areYouFollowing) {
        const resp = await removeFollow({
          followingId: currentUser._id,
          followerId: userId,
        }).unwrap();
        if (resp?.status === 200) {
          console.log({resp: resp}, 'Unfollow Response');
          setAreYouFollowing(false);
          dispatch(setCurrentUser(resp.data));
        }
      } else {
        const res = await addFollow({
          followingId: currentUser._id,
          followerId: userId,
        }).unwrap();
        if (res?.status === 200) {
          setAreYouFollowing(true);
          dispatch(setCurrentUser(res.data));
        }
      }
    } catch (error) {
      console.error('Error adding follow:', error);
    }
  };

  return (
    <>
      {/* Stream Stopped Modal */}
      <BottomModal
        visible={modalVisible}
        onClose={() => {
          if (alertTimeoutId.current) {
            clearTimeout(alertTimeoutId.current);
          }
          setModalVisible(false);
          goBack();
        }}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Stream Ended</Text>
          <Text style={styles.modalMessage}>
            The live stream has been stopped by the broadcaster.
          </Text>
          <TouchableWithoutFeedback
            onPress={() => {
              if (alertTimeoutId.current) {
                clearTimeout(alertTimeoutId.current);
              }
              setModalVisible(false);
              goBack();
            }}>
            <View style={styles.modalButton}>
              <Text style={styles.modalButtonText}>OK</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </BottomModal>

      {/* Header — wrapped in SafeAreaView for notch / Dynamic Island */}
      <SafeAreaView style={styles.safeHeaderArea}>
        <View style={styles.headerContainer}>
          <View style={styles.headerSubContainer}>
            <View style={styles.userInfoContainer}>
              <Image
                src={`https://images.unsplash.com/photo-1472457897821-70d3819a0e24?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`}
                style={styles.avatar}
              />
              <Text style={styles.userName}>User Name</Text>
              <TouchableWithoutFeedback onPress={e => handleFollowAndUnfollow(e)}>
                <View style={styles.followContainer}>
                  {areYouFollowing ? (
                    <Text style={styles.followText} key={'unfollow'}>
                      Unfollow
                    </Text>
                  ) : (
                    <Text style={styles.followText} key={'follow'}>
                      +Follow
                    </Text>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
            <View
              style={{
                flex: 1,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'flex-start',
                marginHorizontal: sw(8),
              }}>
              <Animated.Text
                style={{
                  color: colors.titleText,
                  fontSize: sf(15),
                  fontWeight: '500',
                  width: titleTextWidth,
                  transform: [{translateX: titleAnim}],
                }}
                numberOfLines={1}>
                {liveDetails?.streamTitle || "DJ vibe from rooftop don't miss it"}
              </Animated.Text>
            </View>
            <View style={styles.liveInfoContainer}>
              <View style={styles.viewerRow}>
                <EyeViewsIcon style={styles.eyeIcon} />
                <Text style={styles.countNumber}>
                  {formatToKSymbol(liveCount)}
                </Text>
              </View>
              <View style={styles.liveContainer}>
                <Text style={styles.live}>Live</Text>
              </View>
              {/* <Image source={live} style={styles.liveLogo} /> */}
            </View>
            <CloseIcon
              style={styles.close}
              onPress={() => {
                console.log("go back");
                goBack();
              }}
            />
          </View>
        </View>
      </SafeAreaView>

      <MuxVideo
        style={styles.muxVideo}
        source={{
          uri: `https://stream.mux.com/${streamId}.m3u8`,
        }}
        fullscreen={true}
        paused={false}
        resizeMode="contain"
        // Remove poster for live streams to avoid blocking live content
        // poster={{
        //   source: {
        //     uri: `https://image.mux.com/${streamId}/thumbnail.png?height=121&time=25&width=214&fit_mode=preserve`,
        //   },
        // }}
        muted={false}
        bufferConfig={{
          minBufferMs: 1000, // Minimum buffer for live streams
          maxBufferMs: 3000, // Maximum buffer to reduce latency
          bufferForPlaybackMs: 500, // Start playback quickly
          bufferForPlaybackAfterRebufferMs: 1000,
        }}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        automaticallyWaitsToMinimizeStalling={false}
        controls={false}
        repeat={false}
        muxOptions={{
          application_name: 'VibeLive', // (required) the name of your application
          application_version: '1.0.0', // the version of your application (optional, but encouraged)
          data: {
            env_key: MAPBOX_ENV_KEY, // (required)
            video_id: streamId, // Use actual stream ID
            video_title: liveDetails?.streamTitle || 'Live Stream',
            player_software_version: '6.0.0', // Updated version
            player_name: 'VibeLive Player', // See metadata docs for available metadata fields /docs/web-integration-guide#section-5-add-metadata
          },
        }}
      />
      <FloatingEmojiReactions />
      <ChatList
        streamId={streamId || props?.streamId}
        userId={userId || props?.userId}
        liveDetails={liveDetails || props?.liveDetails}
        coordinates={coordinates || props?.coordinates}
        parentGroupStreamId={props?.parentGroupStreamId}
        currentUser={currentUser}
      />
      {/* </SafeAreaView> */}
    </>
  );
};

const styles = StyleSheet.create({
  muxVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'black',
    zIndex: 1,
    // transform: [{rotate: '0deg'}, {scaleX: 1}],
  },
  safeHeaderArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  headerContainer: {
    zIndex: 3,
    height: sh(52),
    backgroundColor: colors.headerBackground,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: sh(4),
    paddingHorizontal: sw(4),
  },
  headerSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.userInfoBackground,
    borderRadius: 50,
  },
  avatar: {
    height: sw(30),
    width: sw(30),
    borderRadius: 50,
    marginTop: sh(1),
  },
  userName: {
    color: colors.userName,
    fontSize: sf(14),
    fontWeight: '700',
    paddingHorizontal: sw(2),
  },
  liveInfoContainer: {
    borderWidth: 2,
    minWidth: sw(100),
    maxWidth: sw(140),
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.liveInfoBackground,
    borderRadius: 40,
    flexDirection: 'row',
    borderColor: colors.border,
  },
  viewerRow: {
    flexDirection: 'row',
    width: '50%',
    alignItems: 'center',
    gap: 3,
  },
  eyeIcon: {
    fontSize: sf(25),
    color: colors.eyeIcon,
    fontWeight: 900,
  },
  countNumber: {
    fontSize: sf(16),
    fontWeight: 'bold',
    color: colors.countText,
    marginRight: sw(5),
  },
  liveContainer: {
    backgroundColor: colors.liveBackground,
    color: colors.text,
    width: '45%',
    fontWeight: '700',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20, // more rounded
    marginLeft: sw(3),
    paddingVertical: sh(4),
    paddingHorizontal: sw(4),
  },
  live: {
    color: 'white',
    fontSize: sf(16),
    fontWeight: '700',
  },
  liveLogo: {
    // placeholder styles
  },
  close: {
    fontSize: sf(23),
    color: colors.closeIcon,
    fontWeight: '800',
  },

  followContainer: {
    backgroundColor: colors.followBackground,
    borderRadius: 50,
    paddingVertical: sh(4),
    paddingHorizontal: sw(4),
    marginLeft: sw(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  followText: {
    color: colors.followText,
    fontSize: sf(14),
    fontWeight: '600',
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: sf(20),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: sh(12),
  },
  modalMessage: {
    fontSize: sf(16),
    color: colors.text,
    textAlign: 'center',
    marginBottom: sh(24),
    opacity: 0.8,
  },
  modalButton: {
    backgroundColor: colors.followBackground,
    paddingHorizontal: sw(32),
    paddingVertical: sh(12),
    borderRadius: 25,
    minWidth: sw(100),
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.followText,
    fontSize: sf(16),
    fontWeight: '600',
  },
});

export default StreamPlayer;
