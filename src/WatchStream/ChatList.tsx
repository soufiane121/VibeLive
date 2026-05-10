import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  FlatList,
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Video from 'react-native-video';
import { SendIcon } from '../UIComponents/Icons';
import { useSocketInstance } from '../CustomHooks/useSocketInstance';
import FloatingActionButton from '../FloatingAction/FloatingButton';
import { useDispatch } from 'react-redux';
import { addReaction } from '../../features/LiveStream/LiveStreamSlice';
import { GlobalColors } from '../styles/GlobalColors';

const colors = GlobalColors.ChatList;

const MAX_VISIBLE_MESSAGES = 10;
const NON_FADED_COUNT = 4; // Keep last 3 messages fully visible

interface Props {
  streamId: string;
  userId?: string;
  liveDetails?: Object;
  coordinates?: string[];
  parentGroupStreamId?: string;
  showInput?: boolean;
  currentUser?: any;
}
const ChatList = (props: Props) => {
  const { showInput = true } = props;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  const { socket, offEvent, emitEvent } = useSocketInstance();
  const dispatch = useDispatch();

  const fadeMessagesHelper = (prevMessages, newMessage) => {
    const updatedMessages = [...prevMessages, newMessage];

    // Apply fading to older messages (except last 3)
    if (updatedMessages.length > NON_FADED_COUNT) {
      for (let i = 0; i < updatedMessages.length - NON_FADED_COUNT; i++) {
        Animated.timing(updatedMessages[i].fadeAnim, {
          toValue: 0.3, // Fade to 30% opacity
          duration: 2000,
          useNativeDriver: true,
        }).start();
      }
    }

    return updatedMessages;
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      const fadeAnim = new Animated.Value(1); // Start at full opacity

      const newMessage = {
        id: Date.now().toString(),
        avatar: 'https://via.placeholder.com/40',
        message: inputText,
        fadeAnim,
      };

      emitEvent('send-message', {
        roomName: props?.streamId,
        streamerId: props.userId,
        newMessage,
        token: props?.currentUser?.email
      });

      // socket?.emit('send-message', {
      //   roomName: props?.streamId,
      //   streamerId: props.userId,
      //   newMessage
      // });
      setMessages(prevMessages => {
        return fadeMessagesHelper(prevMessages, newMessage);
      });
      setInputText('');
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendReactions = (reactEmogi: string) => {
    let isThrottled = false;
    if (!isThrottled) {
      dispatch(addReaction({ id: props?.streamId, emoji: reactEmogi }));
      emitEvent('reaction-to-stream', {
        roomName: props?.streamId,
        streamerId: props.userId,
        id: props?.streamId,
        reactEmogi,
        coordinates: props.coordinates,
        parentGroupStreamId: props?.parentGroupStreamId,
        token: props?.currentUser?.email
      });
      isThrottled = true;

      setTimeout(() => {
        isThrottled = false;
      }, 5000);
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Attach listeners
    const handleChat = (data) => {
      console.log("get-chat message received", {data});
      if (data?.data.newMessage?.hasOwnProperty('id')) {
        setMessages(prevMessages => {
          return fadeMessagesHelper(prevMessages, data?.data.newMessage);
        });
      }
    };

    const handleReaction = (data) => {
      console.log("get-reaction from UI", data);
      const { id, reactEmogi } = data?.data;
      dispatch(addReaction({ id: id, emoji: reactEmogi }));
    };

    socket.on('get-chat', handleChat);
    socket.on('get-reaction', handleReaction);

    // Join the room
    if (props?.streamId) {
      emitEvent('join-chat-room', {
        roomName: props.streamId,
        token: props?.currentUser?.email
      });
    }

    // Cleanup: remove only OUR listeners, re-attaches on next run
    return () => {
      socket.off('get-chat', handleChat);
      socket.off('get-reaction', handleReaction);
    };
  }, [socket, props?.streamId]);

  const renderItem = ({ item }) => {
    return (
      <Animated.View
        style={[styles.messageContainer, { opacity: item?.fadeAnim }]}
        key={item?.id + JSON.stringify(new Date())}>
        <Image source={{ uri: item?.avatar }} style={styles.avatar} />
        <View style={styles.messageContent}>
          <Text style={styles.userName}>{item?.user}</Text>
          <Text style={styles.messageText}>{item?.message}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Live Video Background */}
      <Video
        source={{ uri: 'https://your-live-stream-url.com/stream.m3u8' }}
        style={styles.video}
        resizeMode="cover"
        repeat
        muted
      />

      {/* Chat Messages */}
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages.slice(-MAX_VISIBLE_MESSAGES)}
          keyExtractor={item => item?.id}
          renderItem={renderItem}
          //   inverted // New messages appear at the bottom
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Fixed Chat Input */}
      {showInput && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.footer}>
          <View style={styles.inputWrraper}>
            <TextInput
              style={styles.input}
              placeholder="Comment..."
              placeholderTextColor={colors.inputPlaceholder}
              value={inputText}
              onChangeText={setInputText}
              onPress={Keyboard.dismiss}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              {/* <Text style={styles.sendText}>➤</Text> */}
              <SendIcon style={styles.sendText} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.reactionButton}>
            {/* <Text style={styles.reactionIcon}>❤️</Text> */}
            <FloatingActionButton sendReactions={sendReactions} />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    // marginTop: '-90%',
    // position: "absolute",
    zIndex: 2,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  chatContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    height: '60%',
    paddingHorizontal: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingHorizontal: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  messageContent: {
    backgroundColor: colors.messageBackground,
    borderRadius: 10,
    padding: 10,
    flex: 1,
  },
  userName: {
    color: colors.userName,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  messageText: {
    color: colors.messageText,
    fontSize: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // borderTopWidth: 1,
    // borderTopColor: '#333',
    padding: 10,
    marginBottom: 5,
    // backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  input: {
    flex: 1,
    height: 40,
    // backgroundColor: 'rgba(30, 30, 30, 0.9)',
    paddingHorizontal: 15,
    color: colors.inputText,
  },
  inputWrraper: {
    display: 'flex',
    flexDirection: 'row',
    width: '80%',
    backgroundColor: colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  sendButton: {
    marginLeft: 10,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    color: colors.sendIcon,
    fontSize: 18,
    fontWeight: 'bold',
  },
  reactionButton: {
    marginLeft: 10,
    // backgroundColor: '#ff4757',
    backgroundColor: colors.reactionBackground,

    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionIcon: {
    fontSize: 20,
    // color: '#fff',
    color: colors.reactionIcon,
  },
});

export default ChatList;
