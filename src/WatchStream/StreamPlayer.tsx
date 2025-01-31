import {Image, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {useNavigationState} from '@react-navigation/native';
import {MAPBOX_ENV_KEY} from '@env';
import Video from 'react-native-video'; // import Video from react-native-video like your normally would
import muxReactNativeVideo from '@mux/mux-data-react-native-video';
import {useSocketInstance} from '../CustomHooks/useSocketInstance';
import {useSelector} from 'react-redux';
import {useEffect, useState} from 'react';
import {CloseIcon, EyeViewsIcon} from '../UIComponents/Icons';
import {formatToKSymbol} from '../Utils/helperFuncs';
import ChatList from './ChatList';
const live = require('../../assests/live.png');

type Props = {
  streamId: string;
};

const StreamPlayer = (props: Props) => {
  // const {
  //   properties: {streamId, userId, liveDetails},
  // } = useNavigationState(state => state.routes[1]?.params) || {};
  const {socket, isConnected} = useSocketInstance();
  const {currentUser} = useSelector(state => state?.currentUser);
  const [liveCount, setLiveCount] = useState<number>(0);
  const MuxVideo = muxReactNativeVideo(Video);

  useEffect(() => {
    if (isConnected) {
      // socket?.emit('start-watching-live', {
      //   streamUserId: userId,
      //   viewerUserId: currentUser._id,
      // });
      // socket?.on('stream-counts', data => {
      //   console.log({data: data.data.liveDetails}, 'streamCount');
      //   setLiveCount(+data.data.liveDetails);
      // });
    }
  }, [socket, isConnected]);

  return (
    <>
      {/* <SafeAreaView style={styles.safeHeaderArea}> */}
      <View style={styles.headerContainer}>
        <View style={styles.userInfoContainer}>
          <Image
            src="https://images.unsplash.com/photo-1472457897821-70d3819a0e24?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            style={styles.avatar}
          />
          <Text style={styles.userName}>User Name</Text>
        </View>
        <View style={styles.liveInfoContainer}>
          <View style={{display: 'flex', flexDirection: 'row', width: '50%', alignItems: 'center', gap: 3}}>
            <EyeViewsIcon style={styles.eyeIcon} />
            <Text style={styles.countNumber}>{formatToKSymbol(9000)}</Text>
          </View>
          <Text style={styles.live}>Live</Text>
          {/* <Image source={live} style={styles.liveLogo} /> */}
        </View>
        <CloseIcon style={styles.close} />
      </View>
      <MuxVideo
        style={{height: '100%', width: '100%'}}
        source={{
          uri: `https://stream.mux.com/urXvLG5vPSdI7VtkCBc8x8DrWj01y02ugmRTCaca7rhDM.m3u8`,
        }}
        fullscreen={true}
        paused={false}
        // resizeMode="contain"
        poster={{
          source: {
            uri: `https://image.mux.com/urXvLG5vPSdI7VtkCBc8x8DrWj01y02ugmRTCaca7rhDM/thumbnail.png?height=121&time=25&width=214&fit_mode=preserve`,
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
      <ChatList />
      {/* </SafeAreaView> */}
    </>
  );
};

const styles = StyleSheet.create({
  safeHeaderArea: {
    backgroundColor: 'black',
  },
  headerContainer: {
    position: 'absolute',
    marginTop: '8%',
    zIndex: 2,
    // display: 'flex',
    height: '6.5%',
    // backgroundColor: 'black',
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: '3%',
    paddingTop: '4%',
  },
  userInfoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '62%',
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 50,
    marginTop: '1%',
  },
  userName: {
    color: '#CFD6DF',
    fontSize: 15,
    marginLeft: '3%',
    fontFamily: "800"
  },
  liveInfoContainer: {
    borderWidth: 2,
    width: '29%',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#5F676F',
    borderRadius: 50,
    flexDirection: 'row',
    gap: '2%',
    borderColor: 'transparent',
  },
  eyeIcon: {
    fontSize: 25,
    color: '#CFD6DF',
    fontWeight: 900,
  },
  countNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CFD6DF',
  },
  live: {
    backgroundColor: 'red',
    color: 'white',
    width: '30%',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  liveLogo: {
    width: '40%',
    height: '45%',
    // borderRadius: 2,
    resizeMode: 'center',
    // position: 'static',
    // marginTop: "50%",
    // zIndex: 4,
  },
  close: {
    fontSize: 23,
    color: 'white',
    fontWeight: '800',
  },
});

export default StreamPlayer;
