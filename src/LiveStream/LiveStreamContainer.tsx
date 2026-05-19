import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Button,
  StyleSheet,
  Platform,
  StatusBar,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
// Using existing icon components from the app
import {
  CameraIcon,
  CameraReverseIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  CloseIcon,
  PlayIcon,
  StopIcon,
  CommonMaterialCommunityIcons,
} from '../UIComponents/Icons';
import { GlobalColors } from '../styles/GlobalColors';

const colors = GlobalColors.LiveStreamContainer;

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

// Bottom safe area inset for home indicator (iPhone X+)
const BOTTOM_INSET = Platform.OS === 'ios' && SCREEN_HEIGHT >= 812 ? 34 : 0;

import EndStreamModal from './EndStreamModal';
import MonthlyLimitModal from './MonthlyLimitModal';
import FreeStreamLimitModal from './FreeStreamLimitModal';
import {
  Camera,
  useCameraPermission,
  useCameraDevices,
} from 'react-native-vision-camera';
import {useStartStreamingMutation} from '../../features/LiveStream/LiveStream';
import {useBoostStreamMutation} from '../../features/registrations/LoginSliceApi';
import {NodeMediaClient, NodePublisher} from 'react-native-nodemediaclient';
import {useSelector} from 'react-redux';
import {useCoordinates} from '../CustomHooks/useGetLocation';
import RTMPStreamingHelper from './RTMPStreamingHelper';
import {useNavigation, CommonActions} from '@react-navigation/native';
import ChatList from '../WatchStream/ChatList';
import {useSocketInstance} from '../CustomHooks/useSocketInstance';
import useTranslation from '../Hooks/useTranslation';
import {FREE_STREAM_WARNING_SECONDS, FREE_STREAM_MAX_SECONDS} from '@env';

interface BoostPurchaseData {
  tier: 'basic' | 'premium' | 'ultimate' | 'visibility' | 'prime' | 'viral';
  duration: number;
  price: number;
  features: string[];
  transactionId: string;
  purchaseTime: Date;
}

interface VenueTagData {
  venueId: string;
  venueGooglePlaceId: string | null;
  venueName: string;
}

interface LiveStreamContainerProps {
  streamEventType?: string;
  streamTitle?: string;
  boostData?: BoostPurchaseData;
  subcategoriesTags?: string[];
  parentCategory?: string;
  venueTag?: VenueTagData | null;
  onBackToEventSelections?: () => void;
}
export default function LiveStreamContainer(props: LiveStreamContainerProps) {
  const { t } = useTranslation();
  const {
    streamEventType,
    streamTitle,
    boostData,
    subcategoriesTags,
    parentCategory,
    venueTag,
    onBackToEventSelections,
  } = props;
  const {currentUser} = useSelector((state: any) => state?.currentUser);
  const navigation = useNavigation();
  const {socket} = useSocketInstance();

  const coordinates = useCoordinates();
  const [fetchStartStream, {data, isLoading, isSuccess}] =
    useStartStreamingMutation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  // const [socketInstance, setSocketInstance] = useState<any>(null);
  const [streamHealth, setStreamHealth] = useState<
    'connecting' | 'stable' | 'unstable' | 'disconnected'
  >('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [dataFlowActive, setDataFlowActive] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [showEndStreamModal, setShowEndStreamModal] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [userEndedStream, setUserEndedStream] = useState(false);
  const userEndedStreamRef = useRef(false);
  const [isMonthlyLimitReached, setIsMonthlyLimitReached] =
    useState<boolean>(false);
  const [isWeeklyLimitReached, setIsWeeklyLimitReached] = useState(false);

  // Free streaming limit states
  const [showSevenMinuteWarning, setShowSevenMinuteWarning] = useState(false);
  const [showFreeStreamLimitModal, setShowFreeStreamLimitModal] =
    useState(false);
  const [freeStreamingStatus, setFreeStreamingStatus] = useState<any>(null);

  // Create RTMP streaming helper instance (persisted across renders)
  const streamingHelperRef = useRef(new RTMPStreamingHelper());
  const streamingHelper = streamingHelperRef.current;
  const {hasPermission} = useCameraPermission();
  const devices = useCameraDevices();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'front',
  );
  const device =
    devices.find(d => d.position === cameraPosition) ||
    devices.find(d => d.position === 'front') ||
    devices.find(d => d.position === 'back');

  const rtmp = useRef<any>(null);
  const streamHealthTimer = useRef<NodeJS.Timeout | null>(null);
  const durationTimer = useRef<NodeJS.Timeout | null>(null);

  // Toggle microphone mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Toggle camera position
  const toggleCamera = () => {
    setCameraPosition(cameraPosition === 'front' ? 'back' : 'front');
  };

  // Handle close button press
  const handleClosePress = async () => {
    if (isStreaming) {
      setShowEndStreamModal(true);
    } else {
      // Stop duration timer if running
      setStreamStartTime(null);

      // Stop RTMP publisher and camera completely
      if (rtmp.current) {
        try {
          // Stop streaming first
          rtmp.current.stop();
          // Stop preview to release camera
          if (rtmp.current.stopPreview) {
            rtmp.current.stopPreview();
          }
          // Release camera resources
          if (rtmp.current.release) {
            rtmp.current.release();
          }
          // Clear the ref to ensure complete cleanup
          rtmp.current = null;
        } catch (error) {}
      }

      // Reset all streaming states
      setIsStreaming(false);
      setStreamHealth('disconnected');
      setDataFlowActive(false);
      setReconnectAttempts(0);
      userEndedStreamRef.current = true;
      setUserEndedStream(true); // Mark that user ended the session
      setStreamKey(null);
      setPlaybackId(null);
      setStreamId(null);

      // Force a small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate back to the Map tab in the bottom navigation
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {name: 'Map'}, // This will reset to the Map tab in the bottom navigation
          ],
        }),
      );
    }
  };

  // Confirm end stream with playback retention preference
  const confirmEndStream = async (keepPlayback: boolean) => {
    setShowEndStreamModal(false);
    // CRITICAL: Set ref immediately so NodePublisher autoStart is false before any async work
    userEndedStreamRef.current = true;
    setUserEndedStream(true);
    await stopStreaming(keepPlayback);
  };

  // Cancel end stream
  const cancelEndStream = () => {
    setShowEndStreamModal(false);
  };

  // Handle monthly limit modal - Boost & Go Live
  const handleBoostAndGoLive = async () => {
    // Reset monthly limit state
    setIsMonthlyLimitReached(false);
    setIsWeeklyLimitReached(false);

    // Store current stream data in global state for EventSelections to pick up
    (global as any).streamSelectionData = {
      streamEventType,
      streamTitle,
      subcategoriesTags,
      parentCategory,
      flowStep: 'boost_tiers', // This will trigger the boost flow
      timestamp: Date.now(),
    };

    // Use the callback from SwitcherContainer to go back to EventSelections
    if (onBackToEventSelections) {
      onBackToEventSelections();
    } else {
      // Fallback to navigation.goBack() if callback not provided
      navigation.goBack();
    }
  };

  // Handle monthly limit modal - Cancel & Go Back
  const handleCancelAndGoBack = () => {
    // Reset monthly limit state
    setIsMonthlyLimitReached(false);
    setIsWeeklyLimitReached(false);

    // Navigate back using the existing close handler logic
    handleClosePress();
  };

  // Handle 7-minute warning for free streaming
  const handleSevenMinuteWarning = () => {
    setShowSevenMinuteWarning(true);
  };

  // Handle 10-minute limit reached for free streaming
  const handleTenMinuteLimit = async () => {
    try {
      // Use the unified stopStreaming with a reason parameter
      await stopStreaming(false, 'FREE_STREAM_TIME_LIMIT');

      // Show the free stream limit modal
      setShowFreeStreamLimitModal(true);
    } catch (error) {
      console.error('Error handling 10-minute limit:', error);
      // Still show modal even if there's an error
      setShowFreeStreamLimitModal(true);
    }
  };

  // Handle free stream limit modal actions
  const handleFreeStreamBoostAndGoLive = () => {
    setShowFreeStreamLimitModal(false);
    handleBoostAndGoLive(); // Reuse existing boost flow
  };

  const handleFreeStreamCancel = () => {
    setShowFreeStreamLimitModal(false);
    handleClosePress(); // Navigate back
  };

  // Dismiss 7-minute warning
  const dismissSevenMinuteWarning = () => {
    setShowSevenMinuteWarning(false);
  };

  // Check free streaming status
  const checkFreeStreamingStatus = async () => {
    try {
      if (socket && currentUser?._id) {
        socket.emit('check-free-streaming-status', {
          token: currentUser?.email,
          userId: currentUser._id,
        });
      }
    } catch (error) {
      console.error('Error checking free streaming status:', error);
    }
  };

  // Cleanup effect to ensure camera is released on unmount
  useEffect(() => {
    return () => {
      if (rtmp.current) {
        try {
          rtmp.current.stop();
          if (rtmp.current.stopPreview) {
            rtmp.current.stopPreview();
          }
          if (rtmp.current.release) {
            rtmp.current.release();
          }
          rtmp.current = null; // Clear the ref
        } catch (error) {}
      }

      // Stop timers
      setStreamStartTime(null);
    };
  }, []);

  useEffect(() => {
    const initializeStreaming = async () => {
      // Request permissions first
      await requestPermissions();

      // Check free streaming status
      await checkFreeStreamingStatus();

      // Initialize NodeMediaClient properly with authorization
      try {
        // Skip all license configuration - not needed for development
        // Initialize with proper audio session for iOS
        if (Platform.OS === 'ios') {
          try {
            NodeMediaClient.setAudioSessionMode(1); // AVAudioSessionModeVideoRecording
          } catch (e) {}
        }

        // Create stream after proper initialization with retry
        setTimeout(() => createStream(), 1000); // Wait for user auth
      } catch (error) {}
    };

    initializeStreaming();
  }, []);

  // Additional effect to handle camera state changes
  useEffect(() => {
    // If device becomes unavailable, ensure cleanup
    if (!device && rtmp.current) {
      try {
        rtmp.current.stop();
        if (rtmp.current.stopPreview) {
          rtmp.current.stopPreview();
        }
        rtmp.current = null; // Clear the ref
      } catch (error) {}
    }
  }, [device]);

  // Initialize NodePublisher camera capture when component mounts
  useEffect(() => {
    const initializeNodePublisher = () => {
      // Wait for NodePublisher to be mounted and ready
      setTimeout(() => {
        if (rtmp.current) {
          try {
            // The NodePublisher should now be ready to capture camera frames
            // when start() is called during streaming
          } catch (error) {}
        } else {
          // Handle error silently
        }
      }, 2000); // Wait 2 seconds for component to fully mount
    };

    initializeNodePublisher();
  }, [device]); // Re-initialize when device changes

  useEffect(() => {
    if (socket) {
      // Handle stop-all-streams event
      socket.on('stop-all-streams', data => {
        // CRITICAL: Prevent NodePublisher reconnection
        userEndedStreamRef.current = true;
        setUserEndedStream(true);

        // Force stop streaming immediately
        if (isStreaming) {
          stopStreaming();
        }

        // Also force stop the RTMP publisher directly
        if (rtmp.current) {
          try {
            rtmp.current.stop();
            rtmp.current.release();
          } catch (error) {}
        }

        // Force update state
        setIsStreaming(false);
        setStreamHealth('disconnected');
        setDataFlowActive(false);
        setStreamKey(null);

        // Show alert to user
        Alert.alert(
          t('streaming.stopped'),
          t('streaming.stoppedMessage', { message: data.message }),
        );
      });

      // Handle force-stream-stop event (sent before socket disconnect)
      socket.on('force-stream-stop', data => {
        // CRITICAL: Prevent NodePublisher reconnection
        userEndedStreamRef.current = true;
        setUserEndedStream(true);

        // Immediately stop RTMP publisher
        if (rtmp.current) {
          try {
            rtmp.current.stop();
            rtmp.current.release();
          } catch (error) {}
        }

        // Force update all streaming states
        setIsStreaming(false);
        setStreamHealth('disconnected');
        setDataFlowActive(false);
        setStreamStartTime(null);
        setStreamKey(null);
      });

      // Handle boost-limit-reached event
      socket.on('boost-limit-reached', data => {
        // CRITICAL: Prevent NodePublisher reconnection
        userEndedStreamRef.current = true;
        setUserEndedStream(true);

        // Force stop streaming immediately
        if (isStreaming) {
          stopStreaming();
        }

        // Force stop RTMP publisher
        if (rtmp.current) {
          try {
            rtmp.current.stop();
          } catch (error) {}
        }

        // Clear streaming state
        setIsStreaming(false);
        setStreamHealth('disconnected');
        setStreamKey(null);

        // Show alert to user
        Alert.alert(t('streaming.boostLimitReached'), t('streaming.boostLimitMessage', { message: data.message }), [
          {
            text: t('common.ok'),
            onPress: () => {
              // Navigate back or show upgrade options
            },
          },
        ]);
      });

      // Handle explicit camera stop event
      socket.on('stop-camera', data => {
        // CRITICAL: Prevent NodePublisher reconnection
        userEndedStreamRef.current = true;
        setUserEndedStream(true);

        // Force stop streaming and camera
        if (isStreaming) {
          stopStreaming();
        }

        // Force stop RTMP publisher
        if (rtmp.current) {
          try {
            rtmp.current.stop();
          } catch (error) {}
        }

        // Clear all streaming state
        setIsStreaming(false);
        setStreamHealth('disconnected');
        setStreamKey(null);
      });

      // Handle free streaming limit reached event
      socket.on('free-stream-limit-reached', data => {
        console.log('Free stream limit reached:', data);

        // CRITICAL: Prevent NodePublisher reconnection
        userEndedStreamRef.current = true;
        setUserEndedStream(true);

        // Immediately stop streaming
        if (isStreaming) {
          stopStreaming(false);
        }

        // Force stop RTMP publisher
        if (rtmp.current) {
          try {
            rtmp.current.stop();
            rtmp.current.release();
          } catch (error) {}
        }

        // Clear streaming state
        setIsStreaming(false);
        setStreamHealth('disconnected');
        setStreamKey(null);
        setStreamStartTime(null);

        // Show the free stream limit modal
        setFreeStreamingStatus(data.freeStreamingStatus);
        setShowFreeStreamLimitModal(true);
      });

      // Handle stream-start-blocked event
      socket.on('stream-start-blocked', data => {
        Alert.alert(
          t('streaming.cannotStart'),
          t('streaming.cannotStartMessage', { message: data.message }),
        );
        setIsStreaming(false);
        setStreamHealth('disconnected');
      });

      // Handle stream-stopped-confirmed — backend confirms stream fully ended
      socket.on('stream-stopped-confirmed', data => {
        console.log('✅ Stream stopped confirmed by server:', data);
        // Ensure all streaming state is cleared
        userEndedStreamRef.current = true;
        setUserEndedStream(true);
        setIsStreaming(false);
        setStreamHealth('disconnected');
        setStreamKey(null);
        setStreamStartTime(null);

        // Navigate back to Map after a brief delay for UI feedback
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Map' }],
            }),
          );
        }, 500);
      });
    }
  }, [socket]); // Removed isStreaming dependency to prevent reconnection

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    if (!hasPermission) {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();
      if (
        cameraPermission !== 'granted' ||
        microphonePermission !== 'granted'
      ) {
      }
    }
  };

  // Fetch stream key and playback ID from the backend
  const createStream = async () => {
    const hasValidUserId =
      (currentUser?._id && currentUser._id !== '') ||
      (currentUser?.id && currentUser.id !== '');

    if (!hasValidUserId) {
    }

    try {
      // Send stream metadata to backend for boost timeout tracking
      const streamRequestData = {
        streamEventType: streamEventType || t('streaming.defaultType'),
        streamTitle: streamTitle || t('streaming.defaultTitle'),
        subcategoriesTags: subcategoriesTags || [],
        parentCategory: parentCategory || '',
        // Include boost data if available so backend can verify the purchase
        // and skip limit enforcement for this user.
        ...(boostData && {
          boostTier: boostData.tier,
          boostDuration: boostData.duration,
          boostTransactionId: boostData.transactionId,
          boostPurchaseTime: boostData.purchaseTime,
        }),
        // Include venue tag if available
        ...(venueTag && {
          venueId: venueTag.venueId,
          venueGooglePlaceId: venueTag.venueGooglePlaceId,
          venueName: venueTag.venueName,
        }),
      };

      const response = await fetchStartStream(streamRequestData).unwrap();
      if (
        response?.data?.stream_key &&
        response?.data?.playback_ids?.[0]?.id &&
        response?.data?.id
      ) {
        setStreamKey(response.data.stream_key);
        setPlaybackId(response.data.playback_ids[0].id);
        setStreamId(response.data.id); // Store the MUX stream ID for tracking
      }
    } catch (error) {
      console.log('from error side', error);
      // CRITICAL (Issue 2): If the user has just purchased minutes (boostData is
      // present), do NOT re-set the limit flags. The backend may still return a
      // limit error if the boost hasn't fully propagated yet, but the purchase
      // receipt is valid and the user should be allowed to proceed.
      if (boostData) {
        console.log('⏩ Ignoring limit error — user has active boostData:', boostData.tier);
      } else if (error?.data?.code === 'MONTHLY_LIMIT_REACHED') {
        setIsMonthlyLimitReached(true);
      } else if (error?.data?.code === 'FREE_STREAMING_LIMIT_REACHED') {
        setIsWeeklyLimitReached(true);
      }
    }
  };

  // Boost activation is now handled in EventSelections.tsx during purchase
  // This function just returns true since boost is already activated
  const activateBoost = async () => {
    if (!boostData) {
      return true;
    }

    return true;
  };

  // Production MUX streaming with comprehensive data flow validation
  const startStreaming = async () => {
    // Reset user ended flag when starting a new stream
    userEndedStreamRef.current = false;
    setUserEndedStream(false);
    
    // Activate boost first if available
    let boostActivated = false;
    try {
      boostActivated = await activateBoost();
    } catch (activateError) {
      boostActivated = false;
    }

    if (boostData && !boostActivated) {
      return;
    }

    // Add delay after boost activation to ensure database is updated
    if (boostData && boostActivated) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!streamKey || !playbackId) {
      // Create stream credentials when starting (since auto-creation is disabled)
      await createStream();

      // Wait a moment for stream creation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if credentials were created
      if (!streamKey || !playbackId) {
        return;
      }
    }

    if (!device) {
      return;
    }

    try {
      if (!rtmp.current) {
        return;
      }

      // Minimal camera preparation for ultra low latency
      await new Promise(resolve => setTimeout(resolve, 500)); // Minimal 500ms wait

      // Set the RTMP reference in the streaming helper
      streamingHelper.setRtmpRef(rtmp.current);

      // Set up status callback
      streamingHelper.setStatusCallback(status => {
        setStreamHealth(status.isConnected ? 'stable' : 'disconnected');
        setIsStreaming(status.isStreaming);
      });

      // Configure stream with higher quality for MUX
      const streamConfig = {
        streamKey,
        rtmpUrl: `rtmps://global-live.mux.com:443/app/${streamKey}`,
        resolution: {width: 1280, height: 720}, // Match NodePublisher config
        bitrate: 3000000, // Higher bitrate for sufficient data
        fps: 30,
      };

      // CRITICAL: Ensure NodePublisher is capturing camera frames
      try {
        if (rtmp.current) {
          // Start preview to initialize camera capture
          try {
            // Some NodePublisher implementations need startPreview() first
            if (rtmp.current.startPreview) {
              rtmp.current.startPreview();
            }
          } catch (previewError) {}

          // Verify camera is active and capturing
        }
      } catch (error) {}

      // Start streaming through helper
      const success = await streamingHelper.startStreaming(streamConfig);

      if (success) {
        setStreamStartTime(Date.now()); // Set the start time for the timer

        // Notify backend
        if (socket) {
          console.log('we sent data to backed ');

          socket.emit('start-streaming', {
            token: currentUser?.email,
            streamId: streamId, // Send MUX stream ID for proper tracking
            playbackId: playbackId, // Send MUX playback ID for streaming
            coordinates,
            streamEventType: streamEventType || t('streaming.defaultType'),
            streamTitle: streamTitle || t('streaming.untitled'),
            muxStreamKey: streamKey,
            quality: 'production',
            dataFlowValidated: true,
            streamStartTime: Date.now(),
            rtmpUrl: `rtmps://global-live.mux.com:443/app/${streamKey}`,
            // Venue tag data for map display
            ...(venueTag && {
              venueId: venueTag.venueId,
              venueGooglePlaceId: venueTag.venueGooglePlaceId,
              venueName: venueTag.venueName,
            }),
          });
        }
      } else {
        // Enhanced retry logic - DISABLED to prevent auto-restart
        setReconnectAttempts(0); // Reset counter
      }
    } catch (error) {
      setIsStreaming(false);
      setStreamHealth('disconnected');
      setDataFlowActive(false);

      // Enhanced retry logic - DISABLED to prevent auto-restart
      setReconnectAttempts(0); // Reset counter
    }
  };

  // Stop streaming with proper MUX cleanup and playback retention
  const stopStreaming = async (keepPlayback: boolean = true, reason?: string) => {
    try {
      // CRITICAL: Mark stream as intentionally ended IMMEDIATELY (ref for sync access)
      userEndedStreamRef.current = true;
      setUserEndedStream(true);
      
      // CRITICAL: Clear all reconnect attempts and timers first
      setReconnectAttempts(0);

      // Capture stream identifiers before clearing state
      const currentStreamId = streamId;
      const currentPlaybackId = playbackId;
      const streamDuration = streamStartTime 
        ? Math.floor((Date.now() - streamStartTime) / 1000 / 60)
        : 0;

      // CRITICAL: Clear stream key FIRST so NodePublisher URL becomes empty
      // This prevents NodePublisher from having a valid RTMP endpoint to reconnect to
      setStreamKey(null);
      setIsStreaming(false);
      setStreamHealth('disconnected');
      setDataFlowActive(false);
      setStreamStartTime(null);

      // THEN stop the NodePublisher — it can no longer reconnect (URL is empty)
      if (rtmp.current) {
        try {
          rtmp.current.stop();
        } catch (e) {
          console.log('Error stopping NodePublisher directly:', e);
        }
      }

      // Use streaming helper to stop
      await streamingHelper.stopStreaming();

      // Notify backend with playback retention preference (using saved values)
      if (socket) {
        socket.emit('stop-streaming', {
          token: currentUser?.email,
          streamId: currentStreamId,
          playbackId: currentPlaybackId,
          keepPlayback: keepPlayback,
          isBoosted: !!boostData || currentUser?.isBoosted,
          reason: reason || 'USER_INITIATED',
          streamDuration: streamDuration,
        });
      }
    } catch (error) {
      setIsStreaming(false);
      setStreamHealth('disconnected');
      setReconnectAttempts(0);
      userEndedStreamRef.current = true;
      setUserEndedStream(true);
      setStreamKey(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera Feed Area */}
      {/* Camera Feed Area */}
      <View style={styles.cameraContainer}>
        {!device && (
          <View style={styles.cameraPlaceholder}>
            <CameraIcon size={80} color="rgba(255,255,255,0.3)" />
            <Text style={styles.placeholderText}>{t('streaming.liveCameraFeed')}</Text>
          </View>
        )}

        {device && (
          <>
            {/* NodePublisher for Streaming */}
            <View style={styles.cameraAspectContainer}>
              <NodePublisher
                ref={rtmp}
                style={[
                  styles.cameraPreview,
                  cameraPosition === 'front'
                    ? {transform: [{rotate: '-0deg'}]}
                    : {transform: [{rotate: '0deg'}, {scaleX: 1}]},
                ]}
                url={
                  streamKey
                    ? `rtmps://global-live.mux.com:443/app/${streamKey}`
                    : ''
                }
                autoStart={isStreaming && !userEndedStream && !userEndedStreamRef.current}
                isPreview={!isStreaming}
                audioParam={{
                  codecid: NodePublisher.NMC_CODEC_ID_AAC,
                  profile: NodePublisher.NMC_PROFILE_BASELINE,
                  samplerate: 44100,
                  channels: 2,
                  bitrate: 96000, // Lower audio bitrate for reduced latency
                }}
                videoParam={{
                  codecid: NodePublisher.NMC_CODEC_ID_H264,
                  profile: NodePublisher.NMC_PROFILE_BASELINE,
                  width: 405, // 9:16 aspect ratio width for 720p height
                  height: 720, // 720p height
                  fps: 30,
                  bitrate: 1500000, // Adjusted bitrate for 720p
                  preset: 0, // Ultrafast preset for minimum latency
                  videoFrontMirror: false, // Disable mirror for streaming
                  videoBitrateMode: 1, // CBR mode for consistent low latency
                  bufferTime: 300, // Ultra minimal buffer (300ms)
                  keyFrameInterval: 1, // Every 1 second for quick recovery
                  bFrames: 0, // No B-frames for lowest latency
                }}
                frontCamera={cameraPosition === 'front' ? true : false}
                HWAccelEnable={true}
                denoiseEnable={false} // Disable for lower latency
                keyFrameInterval={1} // Frequent keyframes for quick recovery
                videoOrientation={NodePublisher.VIDEO_ORIENTATION_PORTRAIT}
                videoFrontMirror={cameraPosition === 'front'}
                smoothSkinEnable={false} // Disable beauty filters for speed
                videoPreviewMirror={false} // No mirror for streaming
                audioEnable={isMuted ? false : true} // Ensure audio capture
                volume={isMuted ? 0.0 : 1.0} // Control microphone mute state
                videoEnable={true} // Ensure video capture
                lowLatencyMode={true} // Enable low latency mode if available
                onStatus={(status: any) => {
                  // CRITICAL: If user ended stream, ignore all status events to prevent reconnection
                  if (userEndedStreamRef.current) {
                    console.log('🛑 Ignoring NodePublisher status - user ended stream:', status.code);
                    return;
                  }
                  
                  // Enhanced status handling for MUX reliability with frame capture verification
                  if (status.code === 2001) {
                    console.log(
                      '✅ Successfully connected to MUX - RTMP handshake complete',
                    );
                    setStreamHealth('stable');
                  } else if (status.code === 2002) {
                    console.log(
                      '🎥 Stream publishing started - Camera frames being sent to MUX',
                    );
                    setStreamHealth('stable');
                    setDataFlowActive(true);
                  } else if (status.code === 2004) {
                    console.log(
                      '📡 Stream data actively flowing to MUX - Video frames confirmed',
                    );
                    setStreamHealth('stable');
                    setDataFlowActive(true);
                  } else if (status.code < 0) {
                    // Error codes are negative
                    console.error('❌ Streaming error:', status.msg);
                    setStreamHealth('disconnected');
                    setDataFlowActive(false);
                  }
                }}
              />
            </View>
          </>
        )}
      </View>

      {/* UI Overlay wrapped in SafeAreaView to protect headers from notches */}
      <SafeAreaView style={styles.overlayWrapper} pointerEvents="box-none">
        <View style={styles.overlayInner} pointerEvents="box-none">

          {/* Header with LIVE indicator, viewer count, timer, and close button */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t('streaming.liveIndicator')}</Text>
              </View>
              <View style={styles.viewerPill}>
                <CommonMaterialCommunityIcons name="account-group" size={14} color={colors.text} style={{marginRight: 4}} />
                <Text style={styles.viewerCount}>{t('streaming.viewersCount', { count: viewerCount })}</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <StreamTimer
                streamStartTime={streamStartTime}
                isStreaming={isStreaming}
                isBoosted={!!boostData || !!currentUser?.isBoosted}
                onSevenMinuteWarning={handleSevenMinuteWarning}
                onTenMinuteLimit={handleTenMinuteLimit}
              />

              <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
                <CloseIcon size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Control Panel */}
          <View style={styles.controlPanel}>
        <View style={styles.locationPillContainer}>
          <View style={styles.locationPill}>
            <View style={styles.locationDot} />
                <Text style={styles.locationText}>{t('streaming.fromVenue', { venue: venueTag })}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.streamButton,
            isStreaming || isMonthlyLimitReached
              ? styles.stopButton
              : styles.startButton,
          ]}
          disabled={isMonthlyLimitReached}
          onPress={() => {
            if (isStreaming) {
              handleClosePress(); // Show confirmation modal
            } else {
              if (!isMonthlyLimitReached) {
                startStreaming();
              }
            }
          }}>
          <CommonMaterialCommunityIcons name="bullseye" size={24} color={colors.text} style={{marginRight: 8}} />
          <Text style={styles.streamButtonText}>{isStreaming ? t('streaming.stopStreaming') : t('streaming.goLive')}</Text>
        </TouchableOpacity>
      </View>

      {/* Side Controls */}
      <View style={styles.sideControls}>
        <TouchableOpacity style={[styles.controlButton, styles.controlButtonActive]} onPress={() => {}}>
          <CommonMaterialCommunityIcons name="shield-outline" size={24} color={colors.controlsActiveIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          {isMuted ? (
            <MicrophoneSlashIcon size={24} color={colors.text} />
          ) : (
            <MicrophoneIcon size={24} color={colors.text} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
          <CameraReverseIcon size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => {}}>
          <CommonMaterialCommunityIcons name="bullseye" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
        </View>
      </SafeAreaView>

      {isStreaming && streamId && coordinates && (
        <ChatList
          streamId={streamId}
          coordinates={coordinates}
          showInput={false}
        />
      )}

      {/* End Stream Confirmation Modal */}
      <EndStreamModal
        visible={showEndStreamModal}
        onCancel={cancelEndStream}
        onConfirm={confirmEndStream}
        viewerCount={viewerCount}
        streamDuration={
          streamStartTime
            ? Math.floor((Date.now() - streamStartTime) / 1000)
            : 0
        }
      />

      {/* Monthly Limit Modal */}
      <MonthlyLimitModal
        labelsData={{
          title: t('streaming.freeMinutesUp'),
          subTitle: t('streaming.freeMinutesReset'),
          boostButtonLabel: t('streaming.getMoreMinutes'),
          cancelButtonLabel: t('streaming.maybeLater'),
        }}
        visible={isMonthlyLimitReached || isWeeklyLimitReached}
        onBoostAndGoLive={handleBoostAndGoLive}
        onCancel={handleCancelAndGoBack}
      />

      {/* Free Stream Limit Modal */}
      <FreeStreamLimitModal
        visible={showFreeStreamLimitModal}
        onBoostAndGoLive={handleFreeStreamBoostAndGoLive}
        onCancel={handleFreeStreamCancel}
        freeStreamingStatus={freeStreamingStatus}
      />

      {/* 7-Minute Warning Alert */}
      {showSevenMinuteWarning && (
        <View style={styles.warningOverlay}>
          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>{t('streaming.streamEndingSoon')}</Text>
            <Text style={styles.warningMessage}>
              {t('streaming.streamEndingMessage')}
            </Text>
            <View style={styles.warningActions}>
              <TouchableOpacity
                style={styles.boostWarningButton}
                onPress={() => {
                  dismissSevenMinuteWarning();
                  handleBoostAndGoLive();
                }}>
                <Text style={styles.boostWarningButtonText}>{t('streaming.boostStream')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.continueWarningButton}
                onPress={dismissSevenMinuteWarning}>
                <Text style={styles.continueWarningButtonText}>{t('common.continue')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3, // Increased to 3 to sit above ChatList (zIndex: 2)
  },
  overlayInner: {
    flex: 1,
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: sh(10),
    left: sw(20),
    right: sw(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: sw(8),
    paddingVertical: sh(4),
    borderRadius: 16,
    marginRight: sw(8),
  },
  liveDot: {
    width: sw(6),
    height: sw(6),
    borderRadius: sw(3),
    backgroundColor: colors.text,
    marginRight: sw(4),
  },
  liveText: {
    color: colors.text,
    fontSize: sf(12),
    fontWeight: 'bold',
  },
  viewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.controls,
    paddingHorizontal: sw(12),
    paddingVertical: sh(6),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewerCount: {
    color: colors.text,
    fontSize: sf(12),
    fontWeight: '600',
  },
  timer: {
    color: colors.text,
    fontSize: sf(16),
    fontWeight: '700',
  },
  closeButton: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(18),
    backgroundColor: colors.controls,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: sw(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraAspectContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 16,
  },
  controlPanel: {
    position: 'absolute',
    bottom: sh(40),
    left: sw(20),
    right: sw(20),
    zIndex: 1,
  },
  streamButton: {
    width: '100%',
    height: sh(56),
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: colors.btnsBG,
  },
  stopButton: {
    backgroundColor: colors.btnsBG,
  },
  streamButtonText: {
    color: colors.text,
    fontSize: sf(16),
    fontWeight: '800',
  },
  locationPillContainer: {
    flexDirection: 'row',
    marginBottom: sh(16),
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.controls,
    paddingHorizontal: sw(16),
    paddingVertical: sh(8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationDot: {
    width: sw(6),
    height: sw(6),
    borderRadius: sw(3),
    backgroundColor: '#EF4444',
    marginRight: sw(8),
  },
  locationText: {
    color: colors.text,
    fontSize: sf(13),
    fontWeight: '600',
  },
  sideControls: {
    position: 'absolute',
    right: sw(20),
    top: SCREEN_HEIGHT * 0.3,
    zIndex: 1,
  },
  controlButton: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(24),
    backgroundColor: colors.controls,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sh(16),
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 9999,
  },
  controlButtonActive: {
    backgroundColor: colors.controlsActive,
    borderColor: colors.controlsActiveBorder,
  },
  // 7-minute warning alert styles
  warningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  warningContainer: {
    backgroundColor: '#1F2937',
    margin: sw(20),
    padding: sw(20),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  warningTitle: {
    color: '#F59E0B',
    fontSize: sf(18),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: sh(12),
  },
  warningMessage: {
    color: 'white',
    fontSize: sf(16),
    textAlign: 'center',
    lineHeight: sh(24),
    marginBottom: sh(20),
  },
  warningActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: sw(12),
  },
  boostWarningButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: sh(12),
    borderRadius: 8,
    alignItems: 'center',
  },
  boostWarningButtonText: {
    color: '#000',
    fontSize: sf(16),
    fontWeight: 'bold',
  },
  continueWarningButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: sh(12),
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueWarningButtonText: {
    color: 'white',
    fontSize: sf(16),
    fontWeight: '500',
  },
});

// Enhanced StreamTimer component with free streaming limits
interface StreamTimerProps {
  streamStartTime: number | null;
  isStreaming: boolean;
  isBoosted: boolean;
  onSevenMinuteWarning: () => void;
  onTenMinuteLimit: () => void;
}

// Read from env, fall back to 7min/10min defaults
const WARNING_SECONDS = parseInt(FREE_STREAM_WARNING_SECONDS || '420', 10);
const MAX_SECONDS = parseInt(FREE_STREAM_MAX_SECONDS || '600', 10);

const StreamTimer = React.memo(
  ({
    streamStartTime,
    isStreaming,
    isBoosted,
    onSevenMinuteWarning,
    onTenMinuteLimit,
  }: StreamTimerProps) => {
    const [duration, setDuration] = useState(0);
    const sevenMinWarningShown = useRef(false);
    const tenMinLimitReached = useRef(false);

    useEffect(() => {
      if (!streamStartTime) {
        setDuration(0);
        sevenMinWarningShown.current = false;
        tenMinLimitReached.current = false;
        return;
      }

      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - streamStartTime) / 1000);
        setDuration(elapsed);

        // Only enforce limits for non-boosted users
        if (!isBoosted && isStreaming) {
          // Warning threshold (default 420 seconds = 7 minutes)
          if (elapsed >= WARNING_SECONDS && !sevenMinWarningShown.current) {
            sevenMinWarningShown.current = true;
            onSevenMinuteWarning();
          }

          // Hard limit threshold (default 600 seconds = 10 minutes)
          if (elapsed >= MAX_SECONDS && !tenMinLimitReached.current) {
            tenMinLimitReached.current = true;
            onTenMinuteLimit();
          }
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [
      streamStartTime,
      isStreaming,
      isBoosted,
      onSevenMinuteWarning,
      onTenMinuteLimit,
    ]);

    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    };

    // Color coding for free streaming limits
    const getTimerColor = (): string => {
      if (isBoosted) return 'white'; // Normal color for boosted users
      if (duration >= MAX_SECONDS) return '#EF4444'; // Red when limit reached
      if (duration >= WARNING_SECONDS) return '#F59E0B'; // Amber when warning shown
      return 'white'; // Normal color
    };

    return (
      <Text style={[styles.timer, {color: getTimerColor()}]}>
        {formatDuration(duration)}
      </Text>
    );
  },
);
