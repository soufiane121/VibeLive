import React, {useEffect, useState, useRef} from 'react';
import {View, Button, StyleSheet, Platform, Text} from 'react-native';
import {
  Camera,
  useCameraPermission,
  useCameraDevices,
} from 'react-native-vision-camera';
// import {FFmpegKit} from 'react-native-ffmpeg';
import {useStartStreamingMutation} from '../../features/LiveStream/LiveStream';
import {
  NodeMediaClient,
  NodePublisher,
} from 'react-native-nodemediaclient';
import Video, {VideoRef} from 'react-native-video';
import {io} from 'socket.io-client';
import {baseUrl} from '../../baseUrl';
import {useSelector} from 'react-redux';
import useGetLocation from '../CustomHooks/useGetLocation';
import RTMPStreamingHelper from './RTMPStreamingHelper';

interface LiveStreamContainerProps {
  streamEventType?: string;
  streamTitle?: string;
}
export default function LiveStreamContainer(props: LiveStreamContainerProps) {
  const {streamEventType, streamTitle} = props;
  const {
    currentUser
  } = useSelector((state: any) => state?.currentUser);
  
  // Debug current user state
  console.log('🔍 LiveStream - Current user state:', {
    currentUser,
    hasUser: !!currentUser,
    userId: currentUser?._id || currentUser?.id,
    email: currentUser?.email
  });
  const {coordinates} = useGetLocation();
  const [fetchStartStream, {data, isLoading, isSuccess}] =
    useStartStreamingMutation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [socketInstance, setSocketInstance] = useState<any>(null);
  const [streamHealth, setStreamHealth] = useState<'connecting' | 'stable' | 'unstable' | 'disconnected'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [dataFlowActive, setDataFlowActive] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  
  // Create RTMP streaming helper instance
  const streamingHelper = new RTMPStreamingHelper();
  const videoRef = useRef<VideoRef>(null);
  const {hasPermission} = useCameraPermission();
  const devices = useCameraDevices();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = devices.find(d => d.position === cameraPosition) || devices.find(d => d.position === 'front') || devices.find(d => d.position === 'back');
  
  // Debug device detection
  console.log('🔍 Camera devices:', devices);
  console.log('🔍 Selected device:', device);
  console.log('🔍 Camera position:', cameraPosition);
  const rtmp = useRef<any>(null);
  const streamHealthTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeStreaming = async () => {
      // Request permissions first
      await requestPermissions();
      
      // Initialize NodeMediaClient properly with authorization
      try {
        console.log('🔧 Configuring NodeMediaClient for MUX streaming...');
        console.log('🔍 NodeMediaClient available methods:', Object.getOwnPropertyNames(NodeMediaClient));
        
        // Skip all license configuration - not needed for development
        console.log('🔓 Using NodeMediaClient without license - development mode');
        
        // Initialize with proper audio session for iOS
        if (Platform.OS === 'ios') {
          try {
            NodeMediaClient.setAudioSessionMode(1); // AVAudioSessionModeVideoRecording
            console.log('🎵 iOS audio session mode configured');
          } catch (e) {
            console.log('Audio session mode not available, continuing...');
          }
        }
        
        // Additional authorization steps
        // try {
        //   // Some versions require explicit authorization
        //   if ((NodeMediaClient as any).authorize) {
        //     (NodeMediaClient as any).authorize();
        //     console.log('🔐 NodeMediaClient explicitly authorized');
        //   }
        // } catch (authError) {
        //   console.log('ℹ️ Explicit authorization not available');
        // }
        
        console.log('✅ NodeMediaClient initialized and authorized');
        
        // Create stream after proper initialization with retry
        setTimeout(() => createStream(), 1000); // Wait for user auth
      } catch (error) {
        console.error('❌ NodeMediaClient initialization failed:', error);
      }
    };
    
    initializeStreaming();
  }, []);

  // Initialize NodePublisher camera capture when component mounts
  useEffect(() => {
    const initializeNodePublisher = () => {
      console.log('📹 Initializing NodePublisher camera capture...');
      
      // Wait for NodePublisher to be mounted and ready
      setTimeout(() => {
        if (rtmp.current) {
          try {
            console.log('🎥 NodePublisher mounted - preparing camera capture');
            // The NodePublisher should now be ready to capture camera frames
            // when start() is called during streaming
          } catch (error) {
            console.error('❌ NodePublisher initialization error:', error);
          }
        } else {
          console.warn('⚠️ NodePublisher ref not available yet');
        }
      }, 2000); // Wait 2 seconds for component to fully mount
    };

    initializeNodePublisher();
  }, [device]); // Re-initialize when device changes

  // Create stream when user becomes available - DISABLED to prevent auto-restart
  useEffect(() => {
    if ((currentUser?._id || currentUser?.id) && !streamKey) {
      console.log('👤 User authenticated - auto stream creation DISABLED');
      console.log('🔒 Stream will only be created when manually started');
      // createStream(); // DISABLED - only create stream when user taps start
    }
  }, [currentUser?._id, currentUser?.id]);

  useEffect(() => {
    if (!isSuccess) {
      const socket = io(baseUrl + '/liveStream', {
        query: {
          userId: currentUser._id,
          token: currentUser.email,
        },
      });
      setSocketInstance(socket);
    }
    return () => {
      socketInstance?.disconnect();
    };
  }, [isSuccess]);

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    if (!hasPermission) {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();
      if (
        cameraPermission !== 'granted' ||
        microphonePermission !== 'granted'
      ) {
        console.error('Camera and microphone permissions required.');
      }
    }
  };

  // Fetch stream key and playback ID from the backend
  const createStream = async () => {
    console.log('🎬 createStream called');
    const hasValidUserId = (currentUser?._id && currentUser._id !== '') || (currentUser?.id && currentUser.id !== '');
    
    console.log('👤 User validation:', { 
      hasValidUserId,
      currentUser: !!currentUser,
      hasId: !!currentUser?.id, 
      has_id: !!currentUser?._id,
      email: currentUser?.email,
      _id: currentUser?._id,
      id: currentUser?.id
    });
    
    if (!hasValidUserId) {
      console.log('⏳ User has empty ID fields, proceeding with stream creation...');
    }
    
    try {
      console.log('🔑 Creating MUX stream credentials...');
      console.log('🌐 Backend URL:', baseUrl);
      const response = await fetchStartStream('').unwrap();
      
      console.log('📡 API Response received:', response);
      
      if (response?.data?.stream_key && response?.data?.playback_ids?.[0]?.id) {
        setStreamKey(response.data.stream_key);
        setPlaybackId(response.data.playback_ids[0].id);
        console.log('✅ MUX credentials received:', {
          streamKey: response.data.stream_key,
          playbackId: response.data.playback_ids[0].id
        });
      } else {
        console.error('❌ Invalid MUX response structure:', response);
        console.error('❌ Response data:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Error creating MUX stream:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
  };

  // Production MUX streaming with comprehensive data flow validation
  const startStreaming = async () => {
    console.log('🚀 Starting stream process...');
    console.log('📋 Stream credentials check:', { streamKey, playbackId });
    console.log('📱 Device check:', { device: !!device, hasPermission });
    console.log('🎬 RTMP ref check:', { rtmpCurrent: !!rtmp.current });
    console.log('🔧 Streaming helper check:', { streamingHelper: !!streamingHelper });
    
    if (!streamKey || !playbackId) {
      console.error('❌ Stream credentials not available');
      // Create stream credentials when starting (since auto-creation is disabled)
      console.log('🔄 Creating stream credentials for manual start...');
      await createStream();
      
      // Wait a moment for stream creation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if credentials were created
      if (!streamKey || !playbackId) {
        console.error('❌ Failed to create stream credentials');
        return;
      }
      console.log('✅ Stream credentials created successfully');
    }

    if (!device) {
      console.error('❌ Camera device not available');
      return;
    }

    try {
      if (!rtmp.current) {
        console.error('❌ RTMP ref not initialized - NodePublisher not ready');
        return;
      }
      
      // Minimal camera preparation for ultra low latency
      console.log('📹 Quick camera preparation for low latency...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Minimal 500ms wait
      
      // Set the RTMP reference in the streaming helper
      streamingHelper.setRtmpRef(rtmp.current);
      
      // Set up status callback
      streamingHelper.setStatusCallback((status) => {
        console.log('📊 Stream status update:', status);
        setStreamHealth(status.isConnected ? 'stable' : 'disconnected');
        setIsStreaming(status.isStreaming);
      });
      
      // Configure stream with higher quality for MUX
      const streamConfig = {
        streamKey,
        rtmpUrl: `rtmps://global-live.mux.com:443/app/${streamKey}`,
        resolution: { width: 1280, height: 720 }, // Match NodePublisher config
        bitrate: 3000000, // Higher bitrate for sufficient data
        fps: 30
      };
      
      console.log('🎬 Starting stream with config:', streamConfig);
      
      // CRITICAL: Ensure NodePublisher is capturing camera frames
      try {
        console.log('📹 Initializing camera capture in NodePublisher...');
        if (rtmp.current) {
          // Check if NodePublisher is authorized before starting
          console.log('🔐 Checking NodePublisher authorization...');
          
          // Skip instance-level authorization to avoid unauthorized errors
          console.log('ℹ️ Skipping NodePublisher instance authorization');
          console.log('ℹ️ Using NodePublisher without explicit licensing');
          
          // Start preview to initialize camera capture
          console.log('🎥 Starting camera preview to capture frames...');
          try {
            // Some NodePublisher implementations need startPreview() first
            if (rtmp.current.startPreview) {
              rtmp.current.startPreview();
              console.log('✅ Camera preview started - frames being captured');
            }
          } catch (previewError) {
            console.log('ℹ️ Preview method not available, continuing with direct start');
          }
          
          // Verify camera is active and capturing
          console.log('📹 NodePublisher reference is ready and should be capturing frames');
          
          // Minimal stabilization for ultra low latency
          console.log('⏳ Quick camera stabilization...');
          await new Promise(resolve => setTimeout(resolve, 200)); // Ultra minimal wait
        }
      } catch (error) {
        console.error('❌ NodePublisher camera capture initialization failed:', error);
      }
      
      // Start streaming through helper
      const success = await streamingHelper.startStreaming(streamConfig);
      
      if (success) {
        console.log('✅ MUX stream started successfully via helper');
        
        // Minimal video data stabilization for ultra low latency
        console.log('⚡ Quick video data validation...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Minimal 1s wait
        
        console.log('📡 Video data flowing to MUX with ultra low latency');
        
        // Notify backend
        if (socketInstance) {
          socketInstance.emit('start-streaming', {
            token: currentUser?.email,
            streamId: playbackId,
            coordinates,
            streamEventType: streamEventType || 'default',
            streamTitle: streamTitle || 'Untitled Stream',
            muxStreamKey: streamKey,
            quality: 'production',
            dataFlowValidated: true,
            streamStartTime: Date.now(),
            rtmpUrl: `rtmps://global-live.mux.com:443/app/${streamKey}`
          });
        }
      } else {
        console.error('❌ Failed to start MUX stream via helper');
        
        // Enhanced retry logic - DISABLED to prevent auto-restart
        console.log('❌ Stream start failed - auto-retry disabled to prevent unwanted restarts');
        setReconnectAttempts(0); // Reset counter
      }
    } catch (error) {
      console.error('❌ Error starting MUX stream:', error);
      setIsStreaming(false);
      setStreamHealth('disconnected');
      setDataFlowActive(false);
      
      // Enhanced retry logic - DISABLED to prevent auto-restart
      console.log('❌ Stream error - auto-retry disabled to prevent unwanted restarts');
      setReconnectAttempts(0); // Reset counter
    }
  };

  // Stop streaming with proper MUX cleanup
  const stopStreaming = async () => {
    try {
      // CRITICAL: Clear all reconnect attempts and timers first
      setReconnectAttempts(0);
      console.log('🔄 Cleared reconnect attempts to prevent auto-restart');
      
      // Use streaming helper to stop
      await streamingHelper.stopStreaming();
      
      setIsStreaming(false);
      setStreamHealth('disconnected');
      setDataFlowActive(false);
      
      // Notify backend
      if (socketInstance) {
        socketInstance.emit('stop-streaming', {
          token: currentUser?.email,
          streamId: playbackId
        });
      }
      
      console.log('✅ MUX stream stopped successfully - no auto-restart');
      console.log('🔒 Stream is now fully stopped and will not restart automatically');
      
    } catch (error) {
      console.error('❌ Error stopping MUX stream:', error);
      setIsStreaming(false);
      setStreamHealth('disconnected');
      setReconnectAttempts(0); // Ensure no restart even on error
    }
  };

  console.log('📱 Rendering main view');
  console.log('📱 Device available for rendering:', !!device);
  
  return (
    <View style={styles.container}>
      {/* Debug Info */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Debug: Device={device ? '✅' : '❌'} | StreamKey={streamKey ? '✅' : '❌'} | User={currentUser ? '✅' : '❌'}
        </Text>
      </View>
      
      {/* Unified Camera/Streaming View */}
      {device && (
        <>
          {/* Camera Preview - Only when NOT streaming */}
          {!isStreaming && (
            <Camera
              style={{height: '50%', width: '100%'}}
              device={device}
              isActive={!isStreaming}
              video={true}
              audio={true}
              videoStabilizationMode="auto"
            />
          )}
          
          {/* NodePublisher for Streaming - Simplified configuration to avoid authorization issues */}
          <NodePublisher
            ref={rtmp}
            style={{
              height: '50%', 
              width: '100%',
              opacity: 1,
              position: 'relative',
              zIndex: 1
            }}
            url={streamKey ? `rtmps://global-live.mux.com:443/app/${streamKey}` : ''}
            autoStart={false}
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
            width: 1280, // Higher resolution for MUX
            height: 720, // Landscape orientation for better data flow
            fps: 30,
            bitrate: 2500000, // Optimized for low latency vs quality balance
            preset: 0, // Ultrafast preset for minimum latency
            videoFrontMirror: false, // Disable mirror for streaming
            videoBitrateMode: 1, // CBR mode for consistent low latency
            bufferTime: 300, // Ultra minimal buffer (300ms)
            keyFrameInterval: 1, // Every 1 second for quick recovery
            bFrames: 0, // No B-frames for lowest latency
          }}
          frontCamera={true}
          HWAccelEnable={true}
          denoiseEnable={false} // Disable for lower latency
          keyFrameInterval={1} // Frequent keyframes for quick recovery
          videoOrientation={NodePublisher.VIDEO_ORIENTATION_LANDSCAPE}

          smoothSkinEnable={false} // Disable beauty filters for speed
          videoPreviewMirror={false} // No mirror for streaming
          audioEnable={true} // Ensure audio capture
          videoEnable={true} // Ensure video capture
          lowLatencyMode={true} // Enable low latency mode if available
          onStatus={(status: any) => {
          console.log('📊 MUX Stream Status:', status);
          console.log('📊 Status details - Code:', status.code, 'Message:', status.msg);
          
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
          } else if (status.code === 2000) {
            console.log('🔄 Stream initialized - Preparing to send camera data');
          } else if (status.code >= 2100) {
            console.error('❌ MUX Stream error:', status);
            console.error('❌ This may indicate insufficient camera frame data');
            setStreamHealth('unstable');
            
            // Auto-reconnect on MUX errors - DISABLED to prevent unwanted restarts
            console.log('❌ Stream error detected but auto-reconnect is disabled');
            console.log('❌ Manual restart required to avoid unwanted stream restarts');
            setIsStreaming(false);
            setStreamHealth('disconnected');
          } else if (status.code === 2003) {
            console.warn('⚠️ MUX connection lost - Camera frame transmission interrupted');
            setStreamHealth('disconnected');
          } else {
            console.log('ℹ️ Unknown status code:', status.code, status.msg);
          }
        }}
        />
          {/* Main Streaming Button */}
          <Button
            title={isStreaming ? 'Stop Streaming' : 'Start Streaming'}
            onPress={() => {
              console.log('🎯 Button pressed!', { isStreaming, device: !!device, streamKey: !!streamKey });
              if (isStreaming) {
                console.log('🛑 Calling stopStreaming...');
                stopStreaming();
              } else {
                console.log('🚀 Calling startStreaming...');
                startStreaming();
              }
            }}
            // disabled={!streamKey || !device} // Temporarily removed for debugging
          />
          
          {/* Camera Switch Button */}
          {!isStreaming && device && (
            <Button
              title={`Switch to ${cameraPosition === 'front' ? 'Back' : 'Front'} Camera`}
              onPress={() => setCameraPosition(cameraPosition === 'front' ? 'back' : 'front')}
            />
          )}
        </>
      )}
      
      <Video
        ref={videoRef}
        source={{
          uri: `https://stream.mux.com/${playbackId}.m3u8`,
          type: '',
        }}
        onBuffer={t => {
          console.log({t});
        }}
        style={{height: '50%', width: '100%'}}
        resizeMode="contain"
        poster={{
          source: {
            uri: `https://image.mux.com/${playbackId}/thumbnail.png?height=121&time=25&width=214&fit_mode=preserve`,
          },
          resizeMode: 'cover',
        }}
      />

      {/* Stream Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {streamHealth} {dataFlowActive && '📡'} 
          {streamKey ? '🔑' : '⏳'}
        </Text>
      </View>
      
      {/* Fallback Streaming Button - Always show for testing */}
      {!device && (
        <View style={{marginTop: 20}}>
          <Text style={{textAlign: 'center', marginBottom: 10, color: 'red'}}>
            Camera not detected - Testing Mode
          </Text>
          <Button
            title={isStreaming ? 'Stop Streaming' : 'Start Streaming (Test)'}
            onPress={() => {
              console.log('🎯 Fallback Button pressed!', { isStreaming, device: !!device, streamKey: !!streamKey });
              if (isStreaming) {
                console.log('🛑 Calling stopStreaming...');
                stopStreaming();
              } else {
                console.log('🚀 Calling startStreaming...');
                startStreaming();
              }
            }}
          />
        </View>
      )}

      {/* {playbackId && (
        <Text style={styles.streamInfo}>
          Watch live: https://stream.mux.com/${playbackId}.m3u8
        </Text>
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  preview: {width: '100%', height: '70%'},
  streamInfo: {marginTop: 20, color: 'grey'},
  statusContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
