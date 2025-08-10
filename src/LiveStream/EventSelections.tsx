import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { BoostColors } from '../Utils/BoostColors';
// import { LinearGradient } from 'react-native-linear-gradient';
// import Animated, { 
//   useSharedValue, 
//   useAnimatedStyle, 
//   withTiming, 
//   withRepeat,
//   interpolate,
//   runOnJS
// } from 'react-native-reanimated';

// TODO: Install these packages manually:
// npm install react-native-linear-gradient
// npm install react-native-reanimated
// For iOS: cd ios && pod install

const eventsList = [
  {key: 'nightlife', label: 'Nightlife & Parties', emoji: '🎉'},
  {key: 'bars', label: 'Bars & Lounges', emoji: '🍸'},
  {key: 'concerts', label: 'Concerts & Music', emoji: '🎵'},
  {key: 'sports', label: 'Sports Events', emoji: '🏟️'},
  {key: 'festivals', label: 'Festivals & Fairs', emoji: '🎪'},
  {key: 'food', label: 'Food & Drink events', emoji: '🍽️'},
  {key: 'art', label: 'Art & Culture', emoji: '🎨'},
  {key: 'show', label: 'Show & Performances', emoji: '🎭'},
  {key: 'shopping', label: 'Markets & Pop-ups', emoji: '🛍️'},
];

interface BoostTier {
  id: 'basic' | 'premium' | 'ultimate';
  name: string;
  price: number;
  originalPrice: number;
  duration: number; // hours
  features: string[];
  multiplier: string;
  badge?: string;
  color: string;
}

interface BoostPurchaseData {
  tier: 'basic' | 'premium' | 'ultimate';
  duration: number;
  price: number;
  features: string[];
  transactionId: string;
  purchaseTime: Date;
}

interface EventSelectionsProps {
  onCompleteSelection: (value: string, boostData?: BoostPurchaseData) => void;
  onTitleChange?: (title: string) => void;
}

type FlowStep = 'category' | 'boost_intro' | 'boost_tiers' | 'processing' | 'confirmation';

const BOOST_TIERS: BoostTier[] = [
  {
    id: 'basic',
    name: 'Visibility Boost',
    price: 2.99,
    originalPrice: 4.99,
    duration: 2,
    features: ['2x visibility', 'Priority in nearby feeds', 'Basic analytics'],
    multiplier: '2x',
    color: '#00FFFF'
  },
  {
    id: 'premium',
    name: 'Prime Time',
    price: 7.99,
    originalPrice: 12.99,
    duration: 6,
    features: ['5x visibility', 'Featured placement', 'Advanced analytics', 'Custom badges'],
    multiplier: '5x',
    badge: 'MOST POPULAR',
    color: '#FF1493'
  },
  {
    id: 'ultimate',
    name: 'Viral Mode',
    price: 14.99,
    originalPrice: 24.99,
    duration: 12,
    features: ['10x visibility', 'Homepage featured', 'Premium analytics', 'VIP support', 'Custom effects'],
    multiplier: '10x',
    color: '#FFD700'
  }
];

const EventSelections = ({onCompleteSelection, onTitleChange}: EventSelectionsProps) => {
  const [title, setTitle] = useState('');
  const [currentStep, setCurrentStep] = useState<FlowStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<BoostTier | null>(null);
  const [boostData, setBoostData] = useState<BoostPurchaseData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // FOMO state
  const [timeLeft, setTimeLeft] = useState(1847); // 30:47 in seconds
  const [premiumSlotsLeft] = useState(3);
  const [competingStreamers] = useState(47);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const countdownFlash = useRef(new Animated.Value(0)).current;

  // Reset state when screen comes into focus (user returns from map or other flows)
  useFocusEffect(
    React.useCallback(() => {
      // Reset all state to initial values
      setTitle('');
      setCurrentStep('category');
      setSelectedCategory('');
      setSelectedTier(null);
      setBoostData(null);
      setIsProcessing(false);
      setTimeLeft(1847); // Reset countdown timer
      
      // Reset animations
      pulseAnim.setValue(0);
      glowAnim.setValue(0);
      countdownFlash.setValue(0);
      
      // Notify parent component of title reset
      if (onTitleChange) {
        onTitleChange('');
      }
      
      // Track screen focus for analytics
      trackEvent('go_live_screen_focused', {
        timestamp: new Date().toISOString(),
      });
    }, [onTitleChange])
  );

  useEffect(() => {
    // Start animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ).start();
  }, []);

  useEffect(() => {
    // Countdown timer
    if (currentStep === 'boost_intro' || currentStep === 'boost_tiers') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          
          // Flash animation when under 5 minutes
          if (prev <= 300 && prev % 10 === 0) {
            Animated.sequence([
              Animated.timing(countdownFlash, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
              }),
              Animated.timing(countdownFlash, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }),
            ]).start();
          }
          
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTitleChange = (text: string) => {
    if (text.length <= 60) {
      setTitle(text);
      onTitleChange && onTitleChange(text);
    }
  };

  // Analytics tracking (mock implementation)
  const trackEvent = (eventName: string, properties: any) => {
    console.log(`Analytics: ${eventName}`, properties);
    // TODO: Replace with actual analytics service
    // AnalyticsService.track(eventName, properties);
  };

  const handleCategorySelection = (category: string) => {
    setSelectedCategory(category);
    trackEvent('category_selected', {
      category,
      title: title.trim(),
      timestamp: new Date().toISOString(),
    });
    
    // Give user choice: boost or go directly to streaming
    setCurrentStep('boost_intro');
  };

  const handleGoDirectToStream = (category: string) => {
    setSelectedCategory(category);
    trackEvent('direct_stream_selected', {
      category,
      title: title.trim(),
      timestamp: new Date().toISOString(),
    });
    
    // Skip boost flow entirely
    onCompleteSelection(category);
  };

  const handleSkipBoost = () => {
    trackEvent('boost_skipped', {
      category: selectedCategory,
      title: title.trim(),
      step: currentStep,
      timestamp: new Date().toISOString(),
    });
    
    onCompleteSelection(selectedCategory);
  };

  const handleBoostTierSelection = (tier: BoostTier) => {
    setSelectedTier(tier);
    trackEvent('boost_tier_selected', {
      tier: tier.id,
      price: tier.price,
      category: selectedCategory,
      timestamp: new Date().toISOString(),
    });
  };

  const handleBoostPurchase = async () => {
    if (!selectedTier) return;
    
    setIsProcessing(true);
    setCurrentStep('processing');
    
    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful purchase
      const transactionId = `boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const purchaseData: BoostPurchaseData = {
        tier: selectedTier.id,
        duration: selectedTier.duration,
        price: selectedTier.price,
        features: selectedTier.features,
        transactionId,
        purchaseTime: new Date(),
      };
      
      setBoostData(purchaseData);
      setCurrentStep('confirmation');
      
      trackEvent('boost_purchased', {
        tier: selectedTier.id,
        price: selectedTier.price,
        category: selectedCategory,
        title: title.trim(),
        transactionId,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('Boost purchase failed:', error);
      Alert.alert(
        'Purchase Failed',
        'Unable to complete your boost purchase. Please try again.',
        [
          { text: 'Try Again', onPress: () => setCurrentStep('boost_tiers') },
          { text: 'Skip Boost', onPress: handleSkipBoost },
        ]
      );
      
      trackEvent('boost_purchase_failed', {
        tier: selectedTier.id,
        category: selectedCategory,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBoostConfirmation = () => {
    onCompleteSelection(selectedCategory, boostData!);
  };



  // Processing Screen
  if (currentStep === 'processing') {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.processingText}>Processing your boost...</Text>
        <Text style={styles.processingSubtext}>Securing your premium spot</Text>
      </View>
    );
  }

  // Boost Confirmation Screen
  if (currentStep === 'confirmation' && boostData) {
    return (
      <View style={styles.confirmationContainer}>
        <View style={styles.confettiContainer}>
          <Text style={styles.confettiEmoji}>🎉</Text>
          <Text style={styles.confettiEmoji}>✨</Text>
          <Text style={styles.confettiEmoji}>🚀</Text>
        </View>
        
        <Text style={styles.confirmationTitle}>Boost Activated! 🔥</Text>
        <Text style={styles.confirmationSubtitle}>
          Your stream is now supercharged for maximum visibility
        </Text>
        
        <View style={styles.boostDetailsCard}>
          <View style={styles.boostDetailRow}>
            <Text style={styles.boostDetailLabel}>Tier:</Text>
            <Text style={[styles.boostDetailValue, { color: selectedTier?.color }]}>
              {selectedTier?.name}
            </Text>
          </View>
          <View style={styles.boostDetailRow}>
            <Text style={styles.boostDetailLabel}>Duration:</Text>
            <Text style={styles.boostDetailValue}>{boostData.duration} hours</Text>
          </View>
          <View style={styles.boostDetailRow}>
            <Text style={styles.boostDetailLabel}>Visibility:</Text>
            <Text style={styles.boostDetailValue}>{selectedTier?.multiplier} boost</Text>
          </View>
          <View style={styles.boostDetailRow}>
            <Text style={styles.boostDetailLabel}>Transaction:</Text>
            <Text style={styles.boostDetailValue}>{boostData.transactionId.slice(-8)}</Text>
          </View>
        </View>
        
        <View style={styles.featuresUnlocked}>
          <Text style={styles.featuresTitle}>Features Unlocked:</Text>
          {boostData.features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>✓ {feature}</Text>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: selectedTier?.color }]}
          onPress={handleBoostConfirmation}>
          <Text style={styles.continueButtonText}>Start Boosted Stream 🚀</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Boost Tiers Selection
  if (currentStep === 'boost_tiers') {
    return (
      <View style={styles.boostTiersContainer}>
        <View style={styles.urgencyHeader}>
          <Animated.View style={{
            backgroundColor: countdownFlash.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255, 20, 147, 0.2)', 'rgba(255, 20, 147, 0.6)']
            })
          }}>
            <Text style={styles.urgencyText}>
              ⏰ Special pricing ends in {formatTime(timeLeft)}
            </Text>
          </Animated.View>
          <Text style={styles.scarcityText}>
            Only {premiumSlotsLeft} premium spots left today!
          </Text>
        </View>

        <Text style={styles.tiersTitle}>Choose Your Boost Level</Text>
        
        <FlatList
          data={BOOST_TIERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Animated.View style={{
              transform: [{
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, item.badge ? 1.02 : 1]
                })
              }]
            }}>
              <TouchableOpacity
                style={[
                  styles.tierCard,
                  { borderColor: item.color },
                  selectedTier?.id === item.id && { backgroundColor: `${item.color}20` }
                ]}
                onPress={() => handleBoostTierSelection(item)}>
                
                {item.badge && (
                  <View style={[styles.badge, { backgroundColor: item.color }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                
                <Text style={[styles.tierName, { color: item.color }]}>{item.name}</Text>
                <Text style={styles.tierMultiplier}>{item.multiplier} Visibility</Text>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>${item.originalPrice}</Text>
                  <Text style={[styles.currentPrice, { color: item.color }]}>
                    ${item.price}
                  </Text>
                </View>
                
                <Text style={styles.duration}>{item.duration} hours active</Text>
                
                <View style={styles.featuresContainer}>
                  {item.features.map((feature, index) => (
                    <Text key={index} style={styles.feature}>✓ {feature}</Text>
                  ))}
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              { backgroundColor: selectedTier?.color || '#666' },
              !selectedTier && styles.disabledButton
            ]}
            onPress={handleBoostPurchase}
            disabled={!selectedTier}>
            <Text style={styles.purchaseButtonText}>
              {selectedTier ? `Boost for $${selectedTier.price}` : 'Select a tier'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipBoost}>
            <Text style={styles.skipButtonText}>Start Without Boost</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Boost Intro Screen
  if (currentStep === 'boost_intro') {
    return (
      <View style={styles.boostIntroContainer}>
        <View style={styles.urgencyBanner}>
          <Text style={styles.urgencyTitle}>🚨 Prime Time Alert!</Text>
          <Text style={styles.urgencySubtitle}>
            {competingStreamers} streamers nearby are competing for attention
          </Text>
          <Animated.View style={{
            backgroundColor: countdownFlash.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255, 20, 147, 0.2)', 'rgba(255, 20, 147, 0.6)']
            })
          }}>
            <Text style={styles.countdownText}>
              Special pricing ends in {formatTime(timeLeft)}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.socialProofContainer}>
          <Text style={styles.socialProofTitle}>Why streamers boost:</Text>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>89%</Text>
            <Text style={styles.statLabel}>get 5x more viewers</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>73%</Text>
            <Text style={styles.statLabel}>reach trending page</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>94%</Text>
            <Text style={styles.statLabel}>would boost again</Text>
          </View>
        </View>

        <View style={styles.scarcityContainer}>
          <Text style={styles.scarcityTitle}>⚡ Limited Availability</Text>
          <View style={styles.slotsVisualization}>
            {[...Array(10)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.slot,
                  i < 7 ? styles.takenSlot : styles.availableSlot
                ]}
              />
            ))}
          </View>
          <Text style={styles.slotsText}>
            {premiumSlotsLeft}/10 premium spots available today
          </Text>
        </View>

        <View style={styles.introButtons}>
          <Animated.View style={{
            transform: [{
              scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05]
              })
            }]
          }}>
            <TouchableOpacity
              style={styles.boostButton}
              onPress={() => setCurrentStep('boost_tiers')}>
              <Text style={styles.boostButtonText}>🚀 Boost My Stream</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity style={styles.skipIntroButton} onPress={handleSkipBoost}>
            <Text style={styles.skipIntroButtonText}>No Thanks</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Category Selection Screen (Default)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ready to go live? 🎬</Text>
        <Text style={styles.headerSubtitle}>
          Choose your vibe and reach more people
        </Text>
      </View>

      <TextInput
        style={styles.titleInput}
        placeholder="Give your stream a vibe, party? chill? wild?"
        placeholderTextColor="#888"
        value={title}
        onChangeText={handleTitleChange}
        maxLength={60}
      />
      
      <Text style={styles.categoryTitle}>What's your vibe?</Text>
      
      <FlatList
        data={eventsList}
        numColumns={3}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryTag,
              selectedCategory === item.key && styles.selectedCategoryTag
            ]}
            onPress={() => setSelectedCategory(item.key)}>
            <Text style={styles.categoryEmoji}>{item.emoji}</Text>
            <Text style={styles.categoryLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
      
      {selectedCategory && (
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>Ready to go live?</Text>
          
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => handleGoDirectToStream(selectedCategory)}>
            <Text style={styles.primaryActionText}>🎬 Start Streaming</Text>
          </TouchableOpacity>
          
          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity
            style={styles.boostActionButton}
            onPress={() => handleCategorySelection(selectedCategory)}>
            <Animated.View style={{
              transform: [{
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.02]
                })
              }]
            }}>
              <Text style={styles.boostActionText}>🚀 Boost for More Viewers</Text>
              <Text style={styles.boostActionSubtext}>Get 5x more visibility</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Base container
  container: {
    flex: 1,
    backgroundColor: BoostColors.background.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BoostColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: BoostColors.text.secondary,
    textAlign: 'center',
  },
  
  // Title input
  titleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: BoostColors.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: BoostColors.text.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  
  // Category selection
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BoostColors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingBottom: 30,
    justifyContent: 'center',
  },
  categoryTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: BoostColors.ui.border,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: (width - 80) / 3,
    maxWidth: (width - 80) / 3,
  },
  selectedCategoryTag: {
    borderColor: BoostColors.primary,
    backgroundColor: BoostColors.tiers.basic.background,
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: BoostColors.text.primary,
    textAlign: 'center',
  },
  
  // Action section
  actionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BoostColors.ui.divider,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BoostColors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryActionButton: {
    backgroundColor: BoostColors.buttons.primary.background,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 20,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BoostColors.buttons.primary.text,
    textAlign: 'center',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BoostColors.ui.divider,
  },
  orText: {
    fontSize: 14,
    color: BoostColors.text.secondary,
    marginHorizontal: 15,
  },
  boostActionButton: {
    backgroundColor: BoostColors.buttons.secondary.background,
    borderWidth: 1,
    borderColor: BoostColors.buttons.secondary.border,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  boostActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BoostColors.buttons.secondary.text,
    textAlign: 'center',
  },
  boostActionSubtext: {
    fontSize: 12,
    color: BoostColors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Boost preview
  boostPreview: {
    backgroundColor: BoostColors.tiers.premium.background,
    borderWidth: 1,
    borderColor: BoostColors.tiers.premium.border,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BoostColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: BoostColors.text.secondary,
    textAlign: 'center',
  },
  
  // Processing screen
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BoostColors.background.primary,
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BoostColors.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: BoostColors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Confirmation screen
  confirmationContainer: {
    flex: 1,
    backgroundColor: BoostColors.background.primary,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    width: '100%',
  },
  confettiEmoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  confirmationTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: BoostColors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: BoostColors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  boostDetailsCard: {
    backgroundColor: BoostColors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  boostDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  boostDetailLabel: {
    fontSize: 16,
    color: BoostColors.text.secondary,
  },
  boostDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BoostColors.text.primary,
  },
  featuresUnlocked: {
    marginBottom: 30,
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BoostColors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  featureItem: {
    fontSize: 14,
    color: BoostColors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BoostColors.text.inverse,
    textAlign: 'center',
  },
  
  // Boost tiers screen
  boostTiersContainer: {
    flex: 1,
    backgroundColor: BoostColors.background.primary,
    padding: 16,
    paddingTop: 10,
  },
  urgencyHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BoostColors.semantic.urgency,
    textAlign: 'center',
    padding: 10,
    borderRadius: 8,
  },
  scarcityText: {
    fontSize: 12,
    color: BoostColors.semantic.scarcity,
    textAlign: 'center',
    marginTop: 6,
  },
  tiersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BoostColors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  tierCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  tierMultiplier: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#888888',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresContainer: {
    alignItems: 'center',
  },
  feature: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  actionButtons: {
    marginTop: 20,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#666666',
    borderRadius: 25,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  
  // Boost intro screen
  boostIntroContainer: {
    flex: 1,
    backgroundColor: BoostColors.background.primary,
    padding: 16,
    paddingTop: 10,
  },
  urgencyBanner: {
    backgroundColor: 'rgba(255, 20, 147, 0.1)',
    borderWidth: 1,
    borderColor: BoostColors.semantic.urgency,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  urgencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BoostColors.semantic.urgency,
    textAlign: 'center',
    marginBottom: 6,
  },
  urgencySubtitle: {
    fontSize: 13,
    color: BoostColors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF1493',
    textAlign: 'center',
    padding: 8,
    borderRadius: 8,
  },
  socialProofContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  socialProofTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BoostColors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  scarcityContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: BoostColors.semantic.scarcity,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  scarcityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BoostColors.semantic.scarcity,
    marginBottom: 12,
  },
  slotsVisualization: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  slot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  takenSlot: {
    backgroundColor: '#FF6B6B',
  },
  availableSlot: {
    backgroundColor: '#4ECDC4',
  },
  slotsText: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
  },
  competitorWarning: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#FFA500',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },
  warningText: {
    fontSize: 14,
    color: '#FFA500',
    textAlign: 'center',
  },
  introButtons: {
    marginTop: 16,
    paddingBottom: 20,
  },
  boostButton: {
    backgroundColor: '#FF1493',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 12,
  },
  boostButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  skipIntroButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#666666',
    borderRadius: 25,
  },
  skipIntroButtonText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  
  // Legacy text style
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default EventSelections;
