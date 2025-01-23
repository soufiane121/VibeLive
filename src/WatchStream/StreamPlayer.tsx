import {SafeAreaView, Text, View} from 'react-native';
import {useNavigationState} from '@react-navigation/native';
import {MAPBOX_ENV_KEY} from '@env';
import Video from 'react-native-video'; // import Video from react-native-video like your normally would
import muxReactNativeVideo from '@mux/mux-data-react-native-video';
import { useSocketInstance } from '../CustomHooks/useSocketInstance';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';


type Props = {
  streamId: string;
};

const StreamPlayer = (props: Props) => {
  const {properties: {streamId, userId, roomName}} = useNavigationState(state => state.routes[1].params)|| {};
  const {socket} = useSocketInstance();
    const {currentUser} = useSelector(state => state?.currentUser);
  const MuxVideo = muxReactNativeVideo(Video);
console.log({roomName});

  useEffect(() => {
    socket?.emit('start-watching-live', {
      streamUserId: userId,
      viewerUserId: currentUser._id,
    });
    socket?.on("streamCounts", (data)=> {
console.log({data}, "streamCount");

    })
  }, [socket]);
  
  
  return (
    <SafeAreaView>
      <MuxVideo
        style={{height: '100%', width: '100%'}}
        source={{
          uri: `https://stream.mux.com/${streamId}.m3u8`,
        }}
        fullscreen={true}
        paused={false}
        // resizeMode="contain"
        poster={{
          source: {
            uri: `https://image.mux.com/${streamId}/thumbnail.png?height=121&time=25&width=214&fit_mode=preserve`,
          },
          // resizeMode: 'cover',
          // ...
        }}
        muted
        muxOptions={{
          application_name: 'test', // (required) the name of your application
          application_version: '1', // the version of your application (optional, but encouraged)
          data: {
            env_key: MAPBOX_ENV_KEY, // (required)
            video_id: 'My Video Id', // (required)
            video_title: 'My awesome video',
            player_software_version: '5.0.2', // (optional, but encouraged) the version of react-native-video that you are using
            player_name: 'React Native Player', // See metadata docs for available metadata fields /docs/web-integration-guide#section-5-add-metadata
          },
        }}
      />
    </SafeAreaView>
  );
};

export default StreamPlayer;
