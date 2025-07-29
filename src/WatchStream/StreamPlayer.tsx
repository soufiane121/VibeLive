import {
  Animated,
  Easing,
  Image,
  SafeAreaView,
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
import {useSelector} from 'react-redux';
import {useEffect, useState} from 'react';
import {CloseIcon, EyeViewsIcon} from '../UIComponents/Icons';
import {formatToKSymbol} from '../Utils/helperFuncs';
import ChatList from './ChatList';
import FloatingEmojiReactions from '../FloatingAction/EmojiAnimation';
import { useAddFollowMutation } from '../../features/LiveStream/LiveStream';

type Props = {
  streamId?: string;
  userId?: string;
  liveDetails?: any;
  coordinates?: any;
};

const StreamPlayer = (props: Props) => {
  const {
    properties: {streamId, userId, liveDetails, coordinates},
  } = useNavigationState(state => state.routes[1]?.params) || {};
  const [addFollow] = useAddFollowMutation();
  const {socket, isConnected} = useSocketInstance();
  const {currentUser} = useSelector(state => state?.currentUser);
  const amIfollowing = currentUser?.following?.includes(userId);
  const [liveCount, setLiveCount] = useState<number>(9099);
  const MuxVideo = muxReactNativeVideo(Video);
  const {navigate, goBack} = useNavigation();
  const [areYouFollowing, setAreYouFollowing] = useState(amIfollowing);

  const [titleAnim] = useState(new Animated.Value(0));
  const titleContainerWidth = 100; // Adjust as needed
  const titleTextWidth = 260; // Adjust as needed for longest expected title

  console.log({userId, currentUser});
  
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
      socket?.on('stream-counts', data => {
        console.log({data: data.data.liveDetails}, 'streamCount');
        setLiveCount(+data.data.liveDetails.liveViewrsCount);
      });
    }
  }, [socket]);

  const handleFollow = async () => {
    try {
     const res = await addFollow({
       followingId: currentUser._id,
       followerId: userId,
     });
      console.log({res}, 'Follow Response');
      
    } catch (error) {
      console.error("Error adding follow:", error);
    }
  };

  return (
    <>
      {/* <SafeAreaView style={styles.safeHeaderArea}> */}
      <View style={styles.headerContainer}>
        <View style={styles.headerSubContainer}>
          <View style={styles.userInfoContainer}>
            <Image
              src={`https://images.unsplash.com/photo-1472457897821-70d3819a0e24?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`}
              style={styles.avatar}
            />
            <Text style={styles.userName}>User Name</Text>
            <TouchableWithoutFeedback onPress={() => handleFollow()}>
              <View style={styles.followContainer}>
                {areYouFollowing ? (
                  <Text style={styles.followText}>- Unfollow</Text>
                ) : (
                  <Text style={styles.followText}>+ Follow</Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
          <View
            style={{
              width: titleContainerWidth,
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
            <Animated.Text
              style={{
                color: '#CFD6DF',
                fontSize: 15,
                fontWeight: '500',
                width: titleTextWidth,
                transform: [{translateX: titleAnim}],
              }}
              numberOfLines={1}>
              {liveDetails?.title || "DJ vibe from rooftop don't miss it"}
            </Animated.Text>
          </View>
          <View style={styles.liveInfoContainer}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                width: '50%',
                alignItems: 'center',
                gap: 3,
              }}>
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
              goBack();
            }}
          />
        </View>
      </View>
      <MuxVideo
        style={{height: '100%', width: '100%'}}
        // source={{
        //   uri: `https://stream.mux.com/${streamId}.m3u8`,
        // }}
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
      <FloatingEmojiReactions />
      <ChatList
        streamId={streamId || props?.streamId}
        userId={userId || props?.userId}
        liveDetails={liveDetails || props?.liveDetails}
        coordinates={coordinates || props?.coordinates}
      />
      {/* </SafeAreaView> */}
    </>
  );
};

const styles = StyleSheet.create({
  safeHeaderArea: {
    // backgroundColor: 'black',
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
    // paddingLeft: '3%',
    paddingTop: '4%',
  },
  headerSubContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  userInfoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    // width: '62%',
    backgroundColor: 'rgba(136, 48, 78, 0.3)',
    borderRadius: 50,
  },
  avatar: {
    height: 30,
    width: 30,
    borderRadius: 50,
    marginTop: '1%',
  },
  userName: {
    color: '#CFD6DF',
    fontSize: 14,
    // marginLeft: '3%',
    fontWeight: '700',
    paddingHorizontal: 1,
    // fontFamily: '800',
  },
  liveInfoContainer: {
    borderWidth: 2,
    minWidth: '29%',
    maxWidth: '37%',
    width: '30%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(95,103,111, 0.2)',
    borderRadius: 40,
    flexDirection: 'row',
    // gap: '2%',
    // paddingHorizontal: 4,
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
    marginRight: '5%',
  },
  liveContainer: {
    backgroundColor: '#B71C1C', // darker red
    color: '#CFD6DF',
    width: '45%',
    // fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20, // more rounded
    marginLeft: '3%',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  live: {
    // backgroundColor: 'red',
    color: 'white',
    // width: '35%',
    fontSize: 16,
    fontWeight: '700',
    // textAlign: 'center',
    // paddingHorizontal: 4,
    // borderRadius: 90,
    // marginLeft: '3%',
    // height: "9%"
  },
  liveLogo: {
    // width: '40%',
    // height: '45%',
    // borderRadius: 2,
    // resizeMode: 'center',
    // position: 'static',
    // marginTop: "50%",
    // zIndex: 4,
  },
  close: {
    fontSize: 23,
    color: 'white',
    fontWeight: '800',
  },

  followContainer: {
    backgroundColor: 'rgba(136, 48, 78, 0.8)',
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginLeft: '1%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followText: {
    color: '#CFD6DF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StreamPlayer;
