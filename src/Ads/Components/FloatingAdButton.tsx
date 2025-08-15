import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { PlusIcon, SparklesIcon, TrendingUpIcon } from '../../UIComponents/Icons';

const { width, height } = Dimensions.get('window');

interface FloatingAdButtonProps {
  visible?: boolean;
  style?: any;
}

const FloatingAdButton: React.FC<FloatingAdButtonProps> = ({ 
  visible = true, 
  style 
}) => {
  const navigation = useNavigation();
  const analytics = useAnalytics();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Continuous pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      // Glow effect
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      glowAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
      };
    }
  }, [visible]);

  const handlePress = () => {
    analytics.trackEvent('floating_ad_button_pressed', {
      timestamp: new Date().toISOString(),
      screen: 'map', // Could be dynamic based on current screen
    });

    navigation.navigate('CreateAdFlow' as never, {
      entryPoint: 'floating_button',
    } as never);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        tw`absolute bottom-24 right-4 z-50`,
        { opacity: fadeAnim },
        style,
      ]}
    >
      {/* Glow Effect */}
      <Animated.View
        style={[
          tw`absolute inset-0 bg-purple-500 rounded-full`,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.7],
            }),
            transform: [
              {
                scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.3],
                }),
              },
            ],
          },
        ]}
      />

      {/* Main Button */}
      <Animated.View
        style={[
          tw`bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg`,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          style={tw`w-16 h-16 rounded-full items-center justify-center`}
          activeOpacity={0.8}
        >
          <PlusIcon size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* FOMO Badge */}
      <Animated.View
        style={[
          tw`absolute -top-2 -right-2 bg-yellow-500 rounded-full px-2 py-1`,
          {
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [1, 1.05],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={tw`text-black text-xs font-bold`}>50%</Text>
      </Animated.View>

      {/* Tooltip */}
      <Animated.View
        style={[
          tw`absolute bottom-20 right-0 bg-gray-900 rounded-lg px-3 py-2 border border-purple-500`,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 0],
            }),
          },
        ]}
      >
        <Text style={tw`text-white text-sm font-bold`}>Promote Event</Text>
        <Text style={tw`text-purple-400 text-xs`}>50% off first ad!</Text>
        
        {/* Arrow */}
        <View style={tw`absolute -bottom-1 right-6 w-2 h-2 bg-gray-900 transform rotate-45 border-r border-b border-purple-500`} />
      </Animated.View>
    </Animated.View>
  );
};

export default FloatingAdButton;
