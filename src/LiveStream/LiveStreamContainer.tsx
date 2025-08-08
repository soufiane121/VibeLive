import React, {useEffect, useState, useRef} from 'react';
import {View, Button, StyleSheet, Platform} from 'react-native';
import {
  Camera,
  useCameraPermission,
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

interface LiveStreamContainerProps {
  streamEventType?: string;
  streamTitle?: string;
}
export default function LiveStreamContainer(props: LiveStreamContainerProps) {
  const {streamEventType, streamTitle} = props;
  const {
    currentUser
  } = useSelector(state => state?.currentUser);
  const {coordinates} = useGetLocation();
  const [fetchStartStream, {data, isLoading, isSuccess}] =
    useStartStreamingMutation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [socketInstance, setSocketInstance] = useState<any>(null);
  const videoRef = useRef<VideoRef>(null);
  const {hasPermission} = useCameraPermission();
  const rtmp = useRef(null);

  useEffect(() => {
    requestPermissions();
    if (Platform.OS === 'ios') {
      NodeMediaClient.setLicense('');
    }
    createStream();
  }, []);


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
    try {
      const response = await fetchStartStream('').unwrap();
      setStreamKey(response.data.stream_key);
      setPlaybackId(response.data.playback_ids[0].id);
    } catch (error) {
      console.error('Error creating stream:', error);
    }
  };

  // Start streaming using FFmpeg and the Vision Camera
  const startStreaming = async () => {
    const rtmpUrl = `rtmp://global-live.mux.com:5222/app/${streamKey}`;
    // const ffmpegCommand = `-f android_camera -i /dev/video0 -c:v libx264 -preset  veryfast -tune zerolatency -b:v 1000k -c:a aac -ar 44100 -b:a 128k -f flv ${rtmpUrl}`;
    // -vf "transpose=1"
    // try {
    //   const result = await FFmpegKit.execute(ffmpegCommand);
    //   console.log('FFmpeg Result:', result);
    // } catch (error) {}
    if (rtmp.current) {
      const pp = rtmp.current.start();
      setIsStreaming(true);
      socketInstance.emit('start-streaming', {
        token: currenUser.email,
        streamId: playbackId,
        coordinates,
        streamEventType: streamEventType || 'default',
        streamTitle: streamTitle,
      });
    }
  };

  // Stop streaming
  const stopStreaming = async () => {
    if (rtmp.current) {
      const pp = rtmp.current.stop();
      console.log('teest', pp);
      setIsStreaming(false);
      // not implmeneted yet
      // socketInstance.emit('stop-streaming', {
      //   token:
      //     'Bearer eyJhbGciOiJIUzI1NiJ9.YWFAZy5jb20.Ps3Ybd241XNaGgnWPfzkEzGGB3zsmlMhPd8KhbW5pRk',
      // });
    }
  };

  return (
    <View style={styles.container}>
      <NodePublisher
        ref={rtmp}
        style={{height: '50%', width: '100%'}}
        // style={{height: '90%', width: '200%', marginTop: "120%", transform: [{rotate: '270deg'}]}}
        url={`rtmp://global-live.mux.com:5222/app/${streamKey}`}
        audioParam={{
          codecid: NodePublisher.NMC_CODEC_ID_AAC,
          profile: NodePublisher.NMC_PROFILE_AUTO,
          samplerate: 32000, //48000,
          channels: 1,
          bitrate: 20000, //32 * 1000, //64 * 1000,
        }}
        videoParam={{
          codecid: NodePublisher.NMC_CODEC_ID_H264,
          profile: NodePublisher.NMC_PROFILE_AUTO,
          width: 720,
          height: 1280,
          fps: 15, //30,
          bitrate: 1000 * 1000, //2000 * 1000,
          preset: 4,
          videoFrontMirror: true,
        }}
        frontCamera={true}
        HWAccelEnable={true}
        denoiseEnable={false}
        keyFrameInterval={2}
        videoOrientation={NodePublisher.VIDEO_ORIENTATION_PORTRAIT}
      />
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

      <Button
        title={isStreaming ? 'Stop Streaming' : 'Start Streaming'}
        onPress={isStreaming ? stopStreaming : startStreaming}
      />
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
});
