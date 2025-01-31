import React, {useState, useRef, useEffect} from 'react';
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
} from 'react-native';
import Video from 'react-native-video';
import { SendIcon } from '../UIComponents/Icons';

const MAX_VISIBLE_MESSAGES = 10;
const NON_FADED_COUNT = 3; // Keep last 3 messages fully visible

const ChatList = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const sendMessage = () => {
    if (inputText.trim()) {
      const fadeAnim = new Animated.Value(1); // Start at full opacity

      const newMessage = {
        id: Date.now().toString(),
        user: 'You',
        avatar: 'https://via.placeholder.com/40',
        message: inputText,
        fadeAnim,
      };

      setMessages(prevMessages => {
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
      });

      setInputText('');
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({animated: true});
  }, [messages]);

  const renderItem = ({item}) => {
    return (
      <Animated.View
        style={[styles.messageContainer, {opacity: item.fadeAnim}]}>
        <Image source={{uri: item.avatar}} style={styles.avatar} />
        <View style={styles.messageContent}>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Live Video Background */}
      <Video
        source={{uri: 'https://your-live-stream-url.com/stream.m3u8'}}
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
          keyExtractor={item => item.id}
          renderItem={renderItem}
          //   inverted // New messages appear at the bottom
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Fixed Chat Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.footer}>
        <View style={styles.inputWrraper}>
          <TextInput
            style={styles.input}
            placeholder="Comment..."
            placeholderTextColor="#ddd"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            {/* <Text style={styles.sendText}>➤</Text> */}
            <SendIcon style={styles.sendText} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.reactionButton}>
          <Text style={styles.reactionIcon}>❤️</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: '-90%',
    // position: "absolute"
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
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 10,
    padding: 10,
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  messageText: {
    color: '#ddd',
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
    marginBottom: 5
    // backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  input: {
    flex: 1,
    height: 40,
    // backgroundColor: 'rgba(30, 30, 30, 0.9)',
    paddingHorizontal: 15,
    color: '#fff',
  },
  inputWrraper: {
    display: 'flex',
    flexDirection: 'row',
    width: '80%',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
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
    color: 'grey',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reactionButton: {
    marginLeft: 10,
    backgroundColor: '#ff4757',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionIcon: {
    fontSize: 20,
    color: '#fff',
  },
});

export default ChatList;
