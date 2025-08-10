import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  withSpring,
} from 'react-native-reanimated';

interface BoostFOMOFlowProps {
  category: string;
  title: string;
  onPurchase: (tier: 'basic' | 'premium' | 'ultimate') => void;
  onSkip: () => void;
  onClose: () => void;
}

interface BoostTier {
  id: 'basic' | 'premium' | 'ultimate';
  name: string;
  price: number;
  originalPrice: number;
  duration: number;
  features: string[];
  color: string;
  gradient: string[];
  popular?: boolean;
}

const boostTiers: BoostTier[] = [
  {
    id: 'basic',
    name: 'Visibility Boost',
    price: 2.99,
    originalPrice: 4.99,
    duration: 2,
    features: ['2x visibility', 'Priority in search', 'Basic analytics'],
    color: '#00FFFF',
    gradient: ['#00FFFF', '#0080FF'],
  },
  {
    id: 'premium',
    name: 'Prime Time',
    price: 7.99,
    originalPrice: 12.99,
    duration: 6,
    features: ['5x visibility', 'Featured placement', 'Advanced analytics', 'Custom badges'],
    color: '#FFD700',
    gradient: ['#FFD700', '#FF8C00'],
    popular: true,
  },
  {
    id: 'ultimate',
    name: 'Viral Mode',
    price: 14.99,
    originalPrice: 24.99,
    duration: 12,
    features: ['10x visibility', 'Homepage featured', 'Premium analytics', 'VIP badges', 'Push notifications'],
    color: '#FF1493',
    gradient: ['#FF1493', '#8A2BE2'],
  },
];

export const BoostFOMOFlow: React.FC<BoostFOMOFlowProps> = ({
  category,
  title,
  onPurchase,
  onSkip,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(1847); // 30:47 in seconds
  const [slotsLeft, setSlotsLeft] = useState(3);
  const [competitorCount, setCompetitorCount] = useState(47);

  // Animation values
  const pulseAnim = useSharedValue(0);
  const flashAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    // Pulse animation
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );

    // Flash animation for urgency
    flashAnim.value = withRepeat(
      withTiming(1, { duration: 500 }),
      -1,
      true
    );

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, 1.05]);
    return { transform: [{ scale }] };
  });

  const flashStyle = useAnimatedStyle(() => {
    const opacity = interpolate(flashAnim.value, [0, 1], [0.7, 1]);
    return { opacity };
  });

  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.urgencyHeader}>
        <Animated.View style={flashStyle}>
          <Text style={styles.urgencyTitle}>⚡ PRIME TIME ALERT ⚡</Text>
        </Animated.View>
        <Text style={styles.urgencySubtitle}>
          Peak hours detected in your area!
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Special pricing ends in:</Text>
        <Animated.View style={[styles.timerBox, flashStyle]}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </Animated.View>
      </View>

      <View style={styles.socialProofContainer}>
        <Text style={styles.socialProofTitle}>🔥 Right now near you:</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{competitorCount}</Text>
            <Text style={styles.statLabel}>streamers competing</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2.3K</Text>
            <Text style={styles.statLabel}>viewers online</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>89%</Text>
            <Text style={styles.statLabel}>boost success rate</Text>
          </View>
        </View>
      </View>

      <View style={styles.successStories}>
        <Text style={styles.successTitle}>💫 Recent Success Stories</Text>
        <View style={styles.storyItem}>
          <Text style={styles.storyText}>
            "Got 500+ viewers in first 10 mins with Premium boost!" - @alex_vibes
          </Text>
        </View>
        <View style={styles.storyItem}>
          <Text style={styles.storyText}>
            "Viral Mode got me featured on homepage!" - @party_queen
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setCurrentStep(2)}>
        <LinearGradient
          colors={['#FF1493', '#8A2BE2']}
          style={styles.buttonGradient}>
          <Text style={styles.continueButtonText}>See What You're Missing 👀</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.scarcityHeader}>
        <Text style={styles.scarcityTitle}>⚠️ LIMITED SPOTS AVAILABLE</Text>
        <View style={styles.slotsVisualization}>
          <Text style={styles.slotsText}>Premium spots left:</Text>
          <View style={styles.slotsContainer}>
            {[...Array(10)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.slot,
                  i < 7 ? styles.slotTaken : styles.slotAvailable,
                ]}
              />
            ))}
          </View>
          <Text style={styles.slotsCount}>{slotsLeft}/10 remaining</Text>
        </View>
      </View>

      <View style={styles.competitorWarning}>
        <Text style={styles.warningTitle}>🚨 Your Competition</Text>
        <Text style={styles.warningText}>
          While you're deciding, {competitorCount} other streamers are going live nearby.
          Without a boost, your stream might get buried.
        </Text>
        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Without Boost</Text>
            <Text style={styles.comparisonValue}>~12 viewers</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>With Premium Boost</Text>
            <Text style={styles.comparisonValue}>~150+ viewers</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setCurrentStep(3)}>
        <LinearGradient
          colors={['#FFD700', '#FF8C00']}
          style={styles.buttonGradient}>
          <Text style={styles.continueButtonText}>Choose Your Boost Level 🚀</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>I'll take my chances</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.tierHeader}>
        <Text style={styles.tierTitle}>🎯 Choose Your Boost</Text>
        <Text style={styles.tierSubtitle}>
          Limited time pricing - save up to 40%!
        </Text>
      </View>

      {boostTiers.map((tier) => (
        <Animated.View key={tier.id} style={pulseStyle}>
          <TouchableOpacity
            style={[
              styles.tierCard,
              tier.popular && styles.popularTier,
            ]}
            onPress={() => onPurchase(tier.id)}>
            {tier.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}
            
            <LinearGradient
              colors={tier.gradient}
              style={styles.tierGradient}>
              <View style={styles.tierContent}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>${tier.originalPrice}</Text>
                  <Text style={styles.currentPrice}>${tier.price}</Text>
                </View>
                <Text style={styles.duration}>{tier.duration} hours boost</Text>
                
                <View style={styles.featuresContainer}>
                  {tier.features.map((feature, index) => (
                    <Text key={index} style={styles.feature}>
                      ✓ {feature}
                    </Text>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ))}

      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Start Without Boost</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  currentStep >= step && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </LinearGradient>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: '#00FFFF',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  urgencyHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  urgencyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 8,
  },
  urgencySubtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  timerBox: {
    backgroundColor: 'rgba(255,20,147,0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FF1493',
  },
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  socialProofContainer: {
    marginBottom: 30,
  },
  socialProofTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  successStories: {
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  storyItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  storyText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  scarcityHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scarcityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  slotsVisualization: {
    alignItems: 'center',
  },
  slotsText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  slotsContainer: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 8,
  },
  slot: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  slotTaken: {
    backgroundColor: '#FF1493',
  },
  slotAvailable: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  slotsCount: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  competitorWarning: {
    backgroundColor: 'rgba(255,69,0,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,69,0,0.3)',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 10,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 5,
  },
  comparisonValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  tierHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  tierTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tierSubtitle: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
  },
  tierCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  popularTier: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    left: 20,
    right: 20,
    backgroundColor: '#FFD700',
    paddingVertical: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 10,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  tierGradient: {
    padding: 20,
    paddingTop: 30,
  },
  tierContent: {
    alignItems: 'center',
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#B0B0B0',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  duration: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  featuresContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  feature: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  continueButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#888888',
    textDecorationLine: 'underline',
  },
});
