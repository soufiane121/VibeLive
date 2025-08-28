import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GlobalColors } from '../styles/GlobalColors';

interface BoostPurchaseData {
  tier: 'basic' | 'premium' | 'ultimate';
  duration: number;
  price: number;
  features: string[];
  transactionId: string;
  purchaseTime: Date;
}

interface BoostConfirmationScreenProps {
  boostData: BoostPurchaseData;
  category: string;
  title: string;
  onContinue: () => void;
}

const colors = GlobalColors.BoostFOMOFlow;

const tierConfig = {
  basic: {
    name: 'Visibility Boost',
    emoji: '⚡',
    color: colors.tierBasic,
    gradient: [colors.tierBasicGradientStart, colors.tierBasicGradientEnd],
  },
  premium: {
    name: 'Prime Time',
    emoji: '👑',
    color: colors.tierPremium,
    gradient: [colors.tierPremiumGradientStart, colors.tierPremiumGradientEnd],
  },
  ultimate: {
    name: 'Viral Mode',
    emoji: '🚀',
    color: colors.tierUltimate,
    gradient: [colors.tierUltimateGradientStart, colors.tierUltimateGradientEnd],
  },
};

export const BoostConfirmationScreen: React.FC<BoostConfirmationScreenProps> = ({
  boostData,
  category,
  title,
  onContinue,
}) => {
  const scaleAnim = useSharedValue(0);
  const rotateAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);
  const confettiAnim = useSharedValue(0);

  const config = tierConfig[boostData.tier];

  useEffect(() => {
    // Celebration animation sequence
    scaleAnim.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );

    rotateAnim.value = withSequence(
      withTiming(360, { duration: 1000 }),
      withTiming(0, { duration: 0 })
    );

    fadeAnim.value = withTiming(1, { duration: 800 });

    confettiAnim.value = withSequence(
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 500 })
    );
  }, []);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiAnim.value,
    transform: [{ translateY: confettiAnim.value * -50 }],
  }));

  const formatExpiryTime = () => {
    const expiryTime = new Date(boostData.purchaseTime);
    expiryTime.setHours(expiryTime.getHours() + boostData.duration);
    return expiryTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.surface, colors.overlay]}
      style={styles.container}>
      
      {/* Confetti Effect */}
      <Animated.View style={[styles.confettiContainer, confettiStyle]}>
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.confetti,
              {
                left: `${Math.random() * 100}%`,
                backgroundColor: i % 2 === 0 ? colors.primary : colors.accent,
              },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View style={[styles.iconContainer, scaleStyle]}>
          <LinearGradient
            colors={config.gradient}
            style={styles.iconGradient}>
            <Animated.Text style={[styles.successIcon, rotateStyle]}>
              {config.emoji}
            </Animated.Text>
          </LinearGradient>
        </Animated.View>

        {/* Success Message */}
        <Animated.View style={[styles.messageContainer, fadeStyle]}>
          <Text style={styles.successTitle}>🎉 Boost Activated!</Text>
          <Text style={styles.successSubtitle}>
            Your stream is now supercharged
          </Text>
        </Animated.View>

        {/* Boost Details */}
        <Animated.View style={[styles.detailsContainer, fadeStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.detailsCard}>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Boost Type:</Text>
              <Text style={[styles.detailValue, { color: config.color }]}>
                {config.name}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {boostData.duration} hours
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Active Until:</Text>
              <Text style={styles.detailValue}>
                {formatExpiryTime()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID:</Text>
              <Text style={styles.transactionId}>
                {boostData.transactionId.slice(-8).toUpperCase()}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Features Unlocked */}
        <Animated.View style={[styles.featuresContainer, fadeStyle]}>
          <Text style={styles.featuresTitle}>✨ Features Unlocked</Text>
          {boostData.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Stream Preview */}
        <Animated.View style={[styles.previewContainer, fadeStyle]}>
          <Text style={styles.previewTitle}>Your Boosted Stream</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewCategory}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            <Text style={styles.previewTitle}>{title || 'Live Stream'}</Text>
            <View style={styles.boostBadge}>
              <Text style={styles.boostBadgeText}>
                {config.emoji} BOOSTED
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View style={[styles.buttonContainer, fadeStyle]}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}>
            <LinearGradient
              colors={config.gradient}
              style={styles.buttonGradient}>
              <Text style={styles.continueButtonText}>
                Start Boosted Stream
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, fadeStyle]}>
          <Text style={styles.footerText}>
            🎯 Your stream will appear higher in search results
          </Text>
          <Text style={styles.footerText}>
            📈 Expect 3-10x more viewers than usual
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    zIndex: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 60,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 30,
  },
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  transactionId: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  featureIcon: {
    fontSize: 16,
    color: colors.success,
    marginRight: 12,
    fontWeight: '600',
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  previewContainer: {
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderActive,
    position: 'relative',
  },
  previewCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewStreamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  boostBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  boostBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
});
