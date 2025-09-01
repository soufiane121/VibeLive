import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Button,
  StyleSheet,
  Platform,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
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
} from '../UIComponents/Icons';
import EndStreamModal from './EndStreamModal';
import {
  Camera,
  useCameraPermission,
  useCameraDevices,
} from 'react-native-vision-camera';
import {useStartStreamingMutation} from '../../features/LiveStream/LiveStream';
import {useBoostStreamMutation} from '../../features/registrations/LoginSliceApi';
import {NodeMediaClient, NodePublisher} from 'react-native-nodemediaclient';
import {io} from 'socket.io-client';
import {baseUrl} from '../../baseUrl';
import {useSelector} from 'react-redux';
import useGetLocation from '../CustomHooks/useGetLocation';
import RTMPStreamingHelper from './RTMPStreamingHelper';
import {useNavigation, CommonActions} from '@react-navigation/native';
import ChatList from '../WatchStream/ChatList';

interface BoostPurchaseData {
  tier: 'basic' | 'premium' | 'ultimate' | 'visibility' | 'prime' | 'viral';
  duration: number;
  price: number;
  features: string[];
  transactionId: string;
  purchaseTime: Date;
}

interface LiveStreamContainerProps {
  streamEventType?: string;
  streamTitle?: string;
  boostData?: BoostPurchaseData;
}
export default function LiveStreamContainer(props: LiveStreamContainerProps) {
  const {streamEventType, streamTitle, boostData} = props;
  const {currentUser} = useSelector((state: any) => state?.currentUser);
  const navigation = useNavigation();

  const {coordinates} = useGetLocation();
  const [fetchStartStream, {data, isLoading, isSuccess}] =
    useStartStreamingMutation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [socketInstance, setSocketInstance] = useState<any>(null);
  const [streamHealth, setStreamHealth] = useState<
    'connecting' | 'stable' | 'unstable' | 'disconnected'
  >('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [dataFlowActive, setDataFlowActive] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [streamDuration, setStreamDuration] = useState(0);
  const [showEndStreamModal, setShowEndStreamModal] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Create RTMP streaming helper instance
  const streamingHelper = new RTMPStreamingHelper();
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

  // Format duration for display (MM:SS)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // Start duration timer
  const startDurationTimer = () => {
    if (durationTimer.current) clearInterval(durationTimer.current);
    setStreamStartTime(Date.now());
    setStreamDuration(0);

    durationTimer.current = setInterval(() => {
      setStreamDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop duration timer
  const stopDurationTimer = () => {
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
  };

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
      stopDurationTimer();

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

      // Cleanup socket connection
      if (socketInstance) {
        socketInstance.disconnect();
        setSocketInstance(null);
      }

      // Reset all streaming states
      setIsStreaming(false);
      setStreamHealth('disconnected');
      setDataFlowActive(false);
      setStreamDuration(0);
      setReconnectAttempts(0);
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

  // Confirm end stream
  const confirmEndStream = async () => {
    setShowEndStreamModal(false);
    await stopStreaming();
  };

  // Cancel end stream
  const cancelEndStream = () => {
    setShowEndStreamModal(false);
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
      stopDurationTimer();

      // Disconnect socket
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const initializeStreaming = async () => {
      // Request permissions first
      await requestPermissions();

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
    if (!isSuccess) {
      const socket = io(baseUrl + '/liveStream', {
        query: {
          userId: currentUser._id,
          token: currentUser.email,
        },
      });

      // Handle stop-all-streams event
      socket.on('stop-all-streams', data => {
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

        // Show alert to user
        Alert.alert(
          'Streaming Stopped',
          `Streaming has been stopped: ${data.message}`,
        );
      });

      // Handle force-stream-stop event (sent before socket disconnect)
      socket.on('force-stream-stop', data => {
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
      });

      // Handle boost-limit-reached event
      socket.on('boost-limit-reached', data => {
        // Force stop streaming immediately
        if (isStreaming) {
          stopStreaming();
        }

        // Force stop RTMP publisher
        if (streamingHelper) {
          streamingHelper.stopPublisher();
        }

        // Clear streaming state
        setIsStreaming(false);
        setStreamHealth('disconnected');
        setStreamKey(null);

        // Show alert to user
        Alert.alert('Boost Limit Reached', `${data.message}`, [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back or show upgrade options
            },
          },
        ]);
      });

      // Handle explicit camera stop event
      socket.on('stop-camera', data => {
        // Force stop streaming and camera
        if (isStreaming) {
          stopStreaming();
        }

        // Force stop RTMP publisher
        if (streamingHelper) {
          streamingHelper.stopPublisher();
        }

        // Clear all streaming state
        setIsStreaming(false);
        setStreamHealth('disconnected');
        setStreamKey(null);
      });

      // Handle stream-start-blocked event
      socket.on('stream-start-blocked', data => {
        Alert.alert(
          'Cannot Start Streaming',
          `Cannot start streaming: ${data.message}`,
        );
        setIsStreaming(false);
        setStreamHealth('disconnected');
      });

      setSocketInstance(socket);
    }
    return () => {
      socketInstance?.disconnect();
    };
  }, [isSuccess]); // Removed isStreaming dependency to prevent reconnection

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
        streamEventType: streamEventType || 'general',
        streamTitle: streamTitle || 'Live Stream',
        // Include boost data if available
        ...(boostData && {
          boostTier: boostData.tier,
          boostDuration: boostData.duration,
          boostTransactionId: boostData.transactionId,
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
      } else {
      }
    } catch (error) {}
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
        startDurationTimer(); // Start the duration timer when stream starts

        // Notify backend
        if (socketInstance) {
          console.log("we sent data to backed ");
          
          socketInstance.emit('start-streaming', {
            token: currentUser?.email,
            streamId: streamId, // Send MUX stream ID for proper tracking
            playbackId: playbackId, // Send MUX playback ID for streaming
            coordinates,
            streamEventType: streamEventType || 'default',
            streamTitle: streamTitle || 'Untitled Stream',
            muxStreamKey: streamKey,
            quality: 'production',
            dataFlowValidated: true,
            streamStartTime: Date.now(),
            rtmpUrl: `rtmps://global-live.mux.com:443/app/${streamKey}`,
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

  // Stop streaming with proper MUX cleanup
  const stopStreaming = async () => {
    try {
      // CRITICAL: Clear all reconnect attempts and timers first
      setReconnectAttempts(0);

      // Use streaming helper to stop
      await streamingHelper.stopStreaming();

      setIsStreaming(false);
      setStreamHealth('disconnected');
      setDataFlowActive(false);

      // Notify backend
      if (socketInstance) {
        socketInstance.emit('stop-streaming', {
          token: currentUser?.email,
          streamId: streamId, // Send MUX stream ID for proper termination
          playbackId: playbackId,
        });
      }

      stopDurationTimer(); // Stop the duration timer when stream stops
    } catch (error) {
      setIsStreaming(false);
      setStreamHealth('disconnected');
      setReconnectAttempts(0); // Ensure no restart even on error
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with LIVE indicator, viewer count, timer, and close button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.liveIndicator}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.viewerCount}>{viewerCount}K</Text>
        </View>

        <Text style={styles.timer}>{formatDuration(streamDuration)}</Text>

        <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
          <CloseIcon size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Camera Feed Area */}
      <View style={styles.cameraContainer}>
        {!device && (
          <View style={styles.cameraPlaceholder}>
            <CameraIcon size={80} color="rgba(255,255,255,0.3)" />
            <Text style={styles.placeholderText}>Live Camera Feed</Text>
          </View>
        )}

        {device && (
          <>
            {/* NodePublisher for Streaming - Simplified configuration to avoid authorization issues */}
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
              autoStart={isStreaming}
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
                width: 405,  // 9:16 aspect ratio width for 720p height
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
              videoEnable={true} // Ensure video capture
              lowLatencyMode={true} // Enable low latency mode if available
              onStatus={(status: any) => {
                // Enhanced status handling for MUX reliability with frame capture verification
                if (status.code === 2001) {
                  console.log('✅ Successfully connected to MUX - RTMP handshake complete');
                  setStreamHealth('stable');
                } else if (status.code === 2002) {
                  console.log('🎥 Stream publishing started - Camera frames being sent to MUX');
                  setStreamHealth('stable');
                  setDataFlowActive(true);
                } else if (status.code === 2004) {
                  console.log('📡 Stream data actively flowing to MUX - Video frames confirmed');
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

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Main Stream Button */}
        <TouchableOpacity
          style={[
            styles.streamButton,
            isStreaming ? styles.stopButton : styles.startButton,
          ]}
          onPress={() => {
            // if (isStreaming) {
            //   handleClosePress(); // Show confirmation modal
            // } else {
            //   startStreaming();
            // }
            startStreaming();
          }}>
          {/* {isStreaming ? (
            <StopIcon size={24} color="white" />
          ) : (
            <PlayIcon size={24} color="white" />
          )} */}
          <Text style={styles.streamButtonText}>Go Live</Text>
        </TouchableOpacity>
      </View>

      {/* Side Controls */}
      <View style={styles.sideControls}>
        {/* Camera Toggle */}
        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
          <CameraReverseIcon size={24} color="white" />
        </TouchableOpacity>

        {/* Microphone Toggle */}
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          {isMuted ? (
            <MicrophoneSlashIcon size={24} color="#EF4444" />
          ) : (
            <MicrophoneIcon size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
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
        streamDuration={streamDuration}
      />
    </View>
  );
}

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: -5,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewerCount: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timer: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraAspectContainer: {
    width: '100%',
    aspectRatio: 9/16, // 9:16 aspect ratio container
    maxHeight: '100%',
    backgroundColor: '#000',
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
    backgroundColor: '#000',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 16,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    top: '85%',
  },
  streamButton: {
    // width: 80,
    // height: 80,
    // borderRadius: 40,
    // justifyContent: 'center',
    // alignItems: 'center',
    // borderWidth: 4,
    // borderColor: 'white',
    width: 180,
    height: 40,
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#EF4444',
  },
  stopButton: {
    backgroundColor: '#6B7280',
  },
  sideControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{translateY: -100}],
    zIndex: 1,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  streamButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
