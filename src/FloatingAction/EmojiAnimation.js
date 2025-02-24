import React, {useRef, useEffect} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {emojis as EMOJIS} from '../Utils/emojis';
import {useDispatch, useSelector} from 'react-redux';
import { clearReactions } from '../../features/LiveStream/LiveStreamSlice';

const FloatingEmoji = ({emoji, onComplete}) => {
  const positionY = useRef(new Animated.Value(0)).current;
  const positionX = useRef(new Animated.Value(0)).current; // For horizontal movement
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const randomStartX = Math.random() * 80 + 10; // Random start position
    const randomEndX = Math.random() * 80 + 10; // Random end position

    positionX.setValue(randomStartX); // Set the initial horizontal position

    Animated.parallel([
      Animated.timing(positionY, {
        toValue: -350, // Moves the emoji up
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0, // Fades out the emoji
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(positionX, {
        toValue: randomEndX, // Animates the emoji horizontally
        duration: 3000,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, []);

  return (
    <Animated.Image
      source={emoji}
      style={[
        styles.emoji,
        {
          transform: [
            {translateY: positionY},
            {translateX: positionX}, // Apply the horizontal movement
          ],
          opacity,
        },
      ]}
    />
  );
};

const FloatingEmojiReactions = () => {
  const [emojis, setEmojis] = React.useState([]);
  const {emoji: emojiSelected} = useSelector(state => state?.liveStreamSlice);
  const dispatch = useDispatch();
  

  useEffect(() => {
    if (EMOJIS[emojiSelected.toLowerCase()]) {
      setEmojis(prev => [
        ...prev,
        {id: Date.now(), emoji: EMOJIS[emojiSelected.toLowerCase()]},
      ]);
      dispatch(clearReactions(''));
    }
  }, [emojiSelected]);

  return (
    <View style={styles.container}>
      <View style={styles.emojiContainer}>
        {emojis.map(({id, emoji}) => (
          <FloatingEmoji
            key={id}
            emoji={emoji}
            onComplete={() => setEmojis(prev => prev.filter(e => e.id !== id))}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: 'black',
    // justifyContent: 'flex-end',
    alignItems: 'start',
    paddingBottom: 50,
    // position: "absolute",
    borderWidth: 2,
  },
  emojiContainer: {
    // position: 'absolute',
    bottom: 100,
    width: '70%',
    height: '10%',
    // borderWidth: 5,
    display: 'flex',
    flexDirection: 'row-reverse',
  },
  emoji: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
});

export default FloatingEmojiReactions;
