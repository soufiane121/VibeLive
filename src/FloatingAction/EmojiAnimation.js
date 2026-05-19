import React, {useRef, useEffect} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {emojis as EMOJIS} from '../Utils/emojis';
import {useSelector} from 'react-redux';

export const FloatingEmoji = ({emoji, onComplete}) => {
  const positionY = useRef(new Animated.Value(0)).current;
  const positionX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 60;
    positionX.setValue(0);

    Animated.parallel([
      Animated.timing(positionY, {
        toValue: -350,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(positionX, {
        toValue: drift,
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
          transform: [{translateY: positionY}, {translateX: positionX}],
          opacity,
        },
      ]}
    />
  );
};

const FloatingEmojiReactions = () => {
  const [emojis, setEmojis] = React.useState([]);
  // Read reaction data from Redux — ChatList dispatches addReaction() on every get-reaction event.
  // We DON'T use useSocketInstance() here because each hook call creates a SEPARATE socket connection.
  // ChatList's socket joins the room and receives events; a second socket here would not.
  const {liveStreamData} = useSelector(state => state?.liveStreamSlice);

  useEffect(() => {
    // _ts is a unique timestamp added on every addReaction dispatch.
    // This ensures even consecutive identical emojis (e.g. "Like" twice) trigger this effect.
    if (!liveStreamData?.emoji || !liveStreamData?._ts) return;

    const emojiImage = EMOJIS[liveStreamData.emoji.toLowerCase()];
    if (emojiImage) {
      setEmojis(prev => [
        ...prev,
        {uid: `${liveStreamData._ts}-${Math.random()}`, emoji: emojiImage},
      ]);
    }
  }, [liveStreamData?._ts]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      {emojis.map(({uid, emoji}) => (
        <View key={uid} style={styles.emojiAnchor}>
          <FloatingEmoji
            emoji={emoji}
            onComplete={() => setEmojis(prev => prev.filter(e => e.uid !== uid))}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  emojiAnchor: {
    // Fixed anchor point — all emojis start from the same spot
    position: 'absolute',
    bottom: 110,
    right: 70,
    width: 40,
    height: 40,
  },
  emoji: {
    width: 40,
    height: 40,
  },
});

export default FloatingEmojiReactions;
