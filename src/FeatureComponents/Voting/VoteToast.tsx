import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import type {VoteConfirmation} from '../../Services/VotingNotificationHandler';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const TOAST_DURATION_MS = 2500;
const SLIDE_DURATION_MS = 300;

interface VoteToastProps {
  confirmation: VoteConfirmation | null;
  onDismiss: () => void;
}

const VoteToast: React.FC<VoteToastProps> = ({confirmation, onDismiss}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: SLIDE_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: SLIDE_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    if (!confirmation) return;

    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: SLIDE_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    dismissTimer.current = setTimeout(dismiss, TOAST_DURATION_MS);

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [confirmation, translateY, opacity, dismiss]);

  if (!confirmation) return null;

  const isHot = confirmation.voteType === 'hot';
  const accentColor = isHot ? '#FF6B35' : '#8B5CF6';
  const bgColor = isHot ? 'rgba(255, 107, 53, 0.12)' : 'rgba(139, 92, 246, 0.12)';
  const borderColor = isHot ? 'rgba(255, 107, 53, 0.3)' : 'rgba(139, 92, 246, 0.3)';
  const emoji = isHot ? '🔥' : '💀';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateY}],
          opacity,
          backgroundColor: bgColor,
          borderColor,
        },
      ]}
      pointerEvents="none">
      <View style={styles.content}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, {color: accentColor}]}>
            {isHot ? 'Hot!' : 'Dead'}
          </Text>
          <Text style={styles.message} numberOfLines={1}>
            {confirmation.message}
          </Text>
        </View>
        <View style={[styles.indicator, {backgroundColor: accentColor}]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  emoji: {
    fontSize: 28,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  indicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginLeft: 12,
  },
});

export default VoteToast;
