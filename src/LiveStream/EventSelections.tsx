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
  Easing,
  Platform,
  ScrollView,
} from 'react-native';
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {GlobalColors} from '../styles/GlobalColors';
import {useBoostStreamMutation} from '../../features/registrations/LoginSliceApi';
import {useLazyGetNearbyVenuesQuery, NearbyVenue} from '../../features/LiveStream/LiveStream';
import useGetLocation from '../CustomHooks/useGetLocation';
import {IAPAdapter} from '../Payment/adapters/IAPAdapter';
import {AnalyticsEventType} from '../types/AnalyticsEnums';
import {
  BarIcon,
  FoodIcon,
  MusicIcon,
  NightLifeIcon,
  SmileFaceIcon,
  SportIcon,
  StarIcon,
  StreamIcon,
  TVPlayIcon,
} from '../UIComponents/Icons';

const colors = GlobalColors.BoostFOMOFlow;
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
    {
      key: 'nightlife',
      label: 'Nightlife & Parties',
      emoji: (color: string)=> (<NightLifeIcon size={32} color={color} />),
    },
    {
      key: 'bars',
      label: 'Bars & Lounges',
      emoji: (color: string)=> (<BarIcon size={32} color={color} />),
    },
    {
      key: 'concerts',
      label: 'Music & Concerts',
      emoji: (color: string)=> (<MusicIcon size={32} color={color} />),
    },
    {
      key: 'sports',
      label: 'Sports Events',
      emoji: (color: string)=> (<SportIcon size={32} color={color} />),
    },
    {
      key: 'festivals',
      label: 'Festivals & Fairs',
      emoji: (color: string)=> (<StarIcon size={32} color={color} />),
    },
    {
      key: 'food',
      label: 'Food & Drink events',
      emoji: (color: string)=> (<FoodIcon size={32} color={color} />),
    },
    {
      key: 'art',
      label: 'Art & Culture',
      emoji: (color: string)=> (<SmileFaceIcon size={32} color={color} />),
    },
    {
      key: 'show',
      label: 'Show & Performances',
      emoji: (color: string)=> (<TVPlayIcon size={32} color={color} />),
    },
    // no needed for now, includes prides, ramadan, halloween
    // {key: 'special', label: 'Special & Seasonal', emoji: '🎉'},
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

export interface VenueTagData {
  venueId: string;
  venueGooglePlaceId: string | null;
  venueName: string;
}

interface onCompleteSelection {
  value: string;
  boostData?: BoostPurchaseData;
  title?: string;
  subcategories?: string[];
  parentCategory?: string;
  venueTag?: VenueTagData | null;
}

interface EventSelectionsProps {
  onCompleteSelection: (args: onCompleteSelection) => void;
  onTitleChange?: (title: string) => void;
  navigation?: any;
}

type FlowStep =
  | 'category'
  | 'boost_intro'
  | 'boost_tiers'
  | 'processing'
  | 'confirmation';

const BOOST_TIERS: BoostTier[] = [
  {
    id: 'basic',
    name: 'Visibility Boost',
    price: 2.99,
    originalPrice: 4.99,
    duration: 2,
    features: ['2x visibility', 'Priority in nearby feeds', 'Basic analytics'],
    multiplier: '2x',
    color: colors.primary,
  },
  {
    id: 'premium',
    name: 'Prime Time',
    price: 7.99,
    originalPrice: 12.99,
    duration: 6,
    features: [
      '5x visibility',
      'Featured placement',
      'Advanced analytics',
      'Custom badges',
    ],
    multiplier: '5x',
    badge: 'MOST POPULAR',
    color: colors.accent,
  },
  {
    id: 'ultimate',
    name: 'Viral Mode',
    price: 14.99,
    originalPrice: 24.99,
    duration: 12,
    features: [
      '10x visibility',
      'Homepage featured',
      'Premium analytics',
      'VIP support',
      'Custom effects',
    ],
    multiplier: '10x',
    color: colors.primary,
  },
];

const EventSelections = ({onCompleteSelection}: EventSelectionsProps) => {
  const [title, setTitle] = useState('');
  const [currentStep, setCurrentStep] = useState<FlowStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    [],
  );
  const [selectedTier, setSelectedTier] = useState<BoostTier | null>(null);
  const [boostData, setBoostData] = useState<BoostPurchaseData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigation = useNavigation();
  // RTK Query mutation for boost activation
  const [boostStream, {isLoading: isBoostLoading}] = useBoostStreamMutation();

  // Venue tagging state
  const {coordinates, hasPermission} = useGetLocation();
  const [fetchNearbyVenues] = useLazyGetNearbyVenuesQuery();
  const [nearbyVenues, setNearbyVenues] = useState<NearbyVenue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [venueLoadingState, setVenueLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'hidden'>('idle');
  const venuesFetchedRef = useRef(false);
  // IAP adapter instance for real App Store purchases (iOS)
  const iapAdapterRef = useRef<IAPAdapter | null>(null);

  // FOMO state
  const [timeLeft, setTimeLeft] = useState(1847); // 30:47 in seconds
  const [premiumSlotsLeft] = useState(3);
  const [competingStreamers] = useState(47);

  // Animations
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const countdownFlash = useRef(new Animated.Value(0)).current;

  // Handle returning from subcategory screen and monthly limit modal via global state
  useFocusEffect(
    React.useCallback(() => {
      // Check for subcategory data from global state when screen focuses
      const checkGlobalData = () => {
        try {
          const globalData = (global as any).subcategoryData;
          if (globalData && globalData.timestamp) {
            console.log(
              'Received subcategories from global state:',
              globalData.subcategories,
            );
            setSelectedSubcategories(globalData.subcategories || []);
            setSelectedCategory(globalData.categoryKey || '');

            // Clear the global data to avoid reprocessing
            delete (global as any).subcategoryData;
          }
        } catch (error) {
          console.log('Error handling global subcategory data:', error);
        }
      };

      // Check for stream selection data from monthly limit modal
      const checkStreamSelectionData = () => {
        try {
          const streamData = (global as any).streamSelectionData;
          if (streamData && streamData.timestamp) {
            console.log(
              'Received stream selection data from monthly limit modal:',
              streamData,
            );

            // Set the stream data
            if (streamData.streamTitle) {
              setTitle(streamData.streamTitle);
            }
            if (streamData.streamEventType) {
              setSelectedCategory(streamData.streamEventType);
            }
            if (streamData.subcategoriesTags) {
              setSelectedSubcategories(streamData.subcategoriesTags);
            }

            // Set the flow step to boost_intro to trigger boost flow
            if (streamData.flowStep === 'boost_tiers') {
              setCurrentStep('boost_tiers');
            }

            // Clear the global data to avoid reprocessing
            delete (global as any).streamSelectionData;
          }
        } catch (error) {
          console.log('Error handling stream selection data:', error);
        }
      };

      checkGlobalData();
      checkStreamSelectionData();
    }, []),
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
      ]),
    ).start();

    Animated.loop(
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ).start();
  }, []);

  // Fetch nearby venues once when coordinates are available
  useEffect(() => {
    if (venuesFetchedRef.current) return;
    if (!hasPermission) {
      setVenueLoadingState('hidden');
      return;
    }
    // coordinates from useGetLocation are [longitude, latitude]
    const [lng, lat] = coordinates;
    if (!lat || !lng) return;

    venuesFetchedRef.current = true;
    setVenueLoadingState('loading');

    const timeoutId = setTimeout(() => {
      // If still loading after 5s, hide the section
      setVenueLoadingState(prev => (prev === 'loading' ? 'hidden' : prev));
    }, 5000);

    fetchNearbyVenues({lat, lng, limit: 5})
      .unwrap()
      .then(result => {
        clearTimeout(timeoutId);
        setNearbyVenues(result.venues || []);
        setVenueLoadingState('loaded');
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setVenueLoadingState('hidden');
      });

    return () => clearTimeout(timeoutId);
  }, [coordinates, hasPermission]);

  // Helper: build VenueTagData from selected venue
  const getSelectedVenueTag = useCallback((): VenueTagData | null => {
    if (!selectedVenueId) return null;
    const venue = nearbyVenues.find(v => v.id === selectedVenueId);
    if (!venue) return null;
    return {
      venueId: venue.id,
      venueGooglePlaceId: venue.googlePlaceId,
      venueName: venue.name,
    };
  }, [selectedVenueId, nearbyVenues]);

  // Format distance for display
  const formatDistance = (metres: number): string => {
    if (metres < 1000) return `${metres}m`;
    return `${(metres / 1000).toFixed(1)}km`;
  };

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
      // onTitleChange && onTitleChange(text);
    }
  };

  // Analytics tracking (mock implementation)
  const trackEvent = (eventName: string, properties: any) => {
    console.log(`Analytics: ${eventName}`, properties);
    // TODO: Replace with actual analytics service
    // AnalyticsService.track(eventName, properties);
  };

  const handleCategorySelection = (
    category: string,
    skipSubcategories = false,
  ) => {
    setSelectedCategory(category);
    trackEvent(AnalyticsEventType.STREAM_CATEGORY_SELECTED, {
      category,
      title: title.trim(),
      skipSubcategories,
      timestamp: new Date().toISOString(),
    });

    if (skipSubcategories) {
      // Go directly to boost flow, skip subcategory selection
      setCurrentStep('boost_intro');
    } else {
      // Navigate to subcategory selection screen via stack navigation
      const selectedEvent = eventsList.find(event => event.key === category);
      if (navigation && selectedEvent) {
        (navigation as any).navigate('SubcategorySelection', {
          parentCategory: selectedEvent.label,
          categoryKey: category,
          title: title.trim(),
        });
      } else {
        console.log('Navigation not available, category selected:', category);
      }
    }
  };

  const handleGoDirectToStream = (category: string) => {
    const selectedEvent = eventsList.find(event => event.key === category);
    trackEvent(AnalyticsEventType.GO_LIVE_STARTED, {
      category,
      parentCategory: selectedEvent?.label,
      subcategories: selectedSubcategories,
      title: title.trim(),
      timestamp: new Date().toISOString(),
    });

    // Skip boost flow entirely - include subcategories and parent category
    onCompleteSelection({
      value: category,
      title: title.trim(),
      subcategories: selectedSubcategories,
      parentCategory: selectedEvent?.label,
      venueTag: getSelectedVenueTag(),
    });
  };

  const handleSkipBoost = () => {
    const selectedEvent = eventsList.find(
      event => event.key === selectedCategory,
    );
    console.log('🚫 User skipped boost - proceeding without boost data');
    trackEvent(AnalyticsEventType.BOOST_SKIPPED, {
      category: selectedCategory,
      parentCategory: selectedEvent?.label,
      subcategories: selectedSubcategories,
      title: title.trim(),
      step: currentStep,
      timestamp: new Date().toISOString(),
    });

    console.log('📤 Calling onCompleteSelection without boost data:', {
      value: selectedCategory,
      title: title.trim(),
      subcategories: selectedSubcategories,
      parentCategory: selectedEvent?.label,
      boostData: null,
    });
    onCompleteSelection({
      value: selectedCategory,
      title: title.trim(),
      subcategories: selectedSubcategories,
      parentCategory: selectedEvent?.label,
      venueTag: getSelectedVenueTag(),
    });
  };

  const handleBoostTierSelection = (tier: BoostTier) => {
    setSelectedTier(tier);
    trackEvent(AnalyticsEventType.BOOST_TIER_SELECTED, {
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
      console.log('🚀 Starting boost purchase process:', {
        tier: selectedTier.id,
        duration: selectedTier.duration,
        price: selectedTier.price,
        category: selectedCategory,
        title: title.trim(),
        platform: Platform.OS,
      });

      let transactionId: string;
      let receipt: string | undefined;

      // Use real IAP for iOS/Android, mock for web/dev
      // TODO:: if (Platform.OS === 'ios' || Platform.OS === 'android') {
      if (Platform.OS === 'android') {
        // Initialize IAP adapter if not already done
        if (!iapAdapterRef.current) {
          iapAdapterRef.current = new IAPAdapter();
        }
        await iapAdapterRef.current.initialize();

        console.log('💳 Requesting App Store purchase...');
        const iapResult = await iapAdapterRef.current.purchaseBoost(
          {
            id: selectedTier.id,
            price: selectedTier.price,
            duration: selectedTier.duration,
            features: selectedTier.features,
          },
          {
            category: selectedCategory,
            title: title.trim(),
            userId: '', // Backend uses auth token
          },
        );

        if (!iapResult.success) {
          throw new Error(iapResult.error || 'IAP purchase failed');
        }

        console.log(
          '✅ App Store purchase successful:',
          iapResult.transactionId,
        );
        transactionId = iapResult.transactionId;
        receipt = iapResult.receipt;
      } else {
        // Fallback mock for web/development
        console.log('💳 Using mock payment (non-mobile platform)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        transactionId = `boost_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        receipt = `mock_receipt_${transactionId}`;
      }

      // Call backend boost activation endpoint using RTK Query
      console.log('🚀 Calling backend boost activation API...');
      const boostResult = await boostStream({
        transactionId,
        tier: selectedTier.id,
        duration: selectedTier.duration,
        price: selectedTier.price,
        category: selectedCategory,
        title: title.trim(),
        // receipt: receipt || `receipt_${transactionId}`,
        receipt: `receipt_${transactionId}`,
      }).unwrap();

      console.log('✅ Backend boost activation successful:', boostResult);

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

      console.log('🎉 Boost purchase completed successfully:', purchaseData);

      trackEvent(AnalyticsEventType.BOOST_PURCHASED, {
        tier: selectedTier.id,
        price: selectedTier.price,
        category: selectedCategory,
        title: title.trim(),
        transactionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('❌ Boost purchase failed:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Purchase Failed',
        `Unable to complete your boost purchase: ${
          error?.data?.error || error?.message || 'Unknown error'
        }`,
        [
          {text: 'Try Again', onPress: () => setCurrentStep('boost_tiers')},
          {text: 'Skip Boost', onPress: handleSkipBoost},
        ],
      );

      trackEvent(AnalyticsEventType.PAYMENT_FAILED, {
        tier: selectedTier.id,
        category: selectedCategory,
        error: error?.data?.error || error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBoostConfirmation = () => {
    const selectedEvent = eventsList.find(
      event => event.key === selectedCategory,
    );
    console.log(
      '🎉 User confirmed boost purchase - proceeding with boost data',
    );
    console.log('📤 Calling onCompleteSelection WITH boost data:', {
      value: selectedCategory,
      boostData: boostData,
      subcategories: selectedSubcategories,
      parentCategory: selectedEvent?.label,
      title: title.trim(),
    });
    onCompleteSelection({
      value: selectedCategory,
      boostData: boostData!,
      subcategories: selectedSubcategories,
      parentCategory: selectedEvent?.label,
      title: title.trim(),
      venueTag: getSelectedVenueTag(),
    });
  };

  // Processing Screen
  if (currentStep === 'processing') {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
            <Text
              style={[styles.boostDetailValue, {color: selectedTier?.color}]}>
              {selectedTier?.name}
            </Text>
          </View>
          <View style={styles.boostDetailRow}>
            <Text style={styles.boostDetailLabel}>Duration:</Text>
            <Text style={styles.boostDetailValue}>
              {boostData.duration} hours
            </Text>
          </View>
          <View style={styles.boostDetailRow}>
            <Text style={styles.boostDetailLabel}>Visibility:</Text>
            <Text style={styles.boostDetailValue}>
              {selectedTier?.multiplier} boost
            </Text>
          </View>
          <View style={styles.boostDetailRow}>
            <Text style={styles.boostDetailLabel}>Transaction:</Text>
            <Text style={styles.boostDetailValue}>
              {boostData.transactionId.slice(-8)}
            </Text>
          </View>
        </View>

        <View style={styles.featuresUnlocked}>
          <Text style={styles.featuresTitle}>Features Unlocked:</Text>
          {boostData.features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>
              ✓ {feature}
            </Text>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            {backgroundColor: selectedTier?.color},
          ]}
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
          <Animated.View
            style={{
              backgroundColor: countdownFlash.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.pulse, colors.flash],
              }),
            }}>
            <Text style={styles.urgencyText}>
              Special pricing ends in {formatTime(timeLeft)}
            </Text>
          </Animated.View>
          <Text style={styles.scarcityText}>
            Only {premiumSlotsLeft} premium spots left today!
          </Text>
        </View>

        <Text style={styles.tiersTitle}>Choose Your Boost Level</Text>

        <FlatList
          data={BOOST_TIERS}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <Animated.View
              style={{
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, item.badge ? 1.02 : 1],
                    }),
                  },
                ],
              }}>
              <TouchableOpacity
                style={[
                  styles.tierCard,
                  selectedTier?.id === item.id && styles.tierCardSelected,
                ]}
                onPress={() => handleBoostTierSelection(item)}>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}

                <View style={styles.tierIcon}>
                  <Text style={styles.tierIconText}>{item.name.charAt(0)}</Text>
                </View>

                <View style={styles.tierContent}>
                  <Text style={styles.tierName}>{item.name}</Text>
                  <Text style={styles.tierPrice}>${item.price}</Text>

                  <View style={styles.tierFeatures}>
                    {item.features.map((feature, index) => (
                      <Text key={index} style={styles.tierFeature}>
                        • {feature}
                      </Text>
                    ))}
                  </View>
                </View>

                <View
                  style={[
                    styles.radioButton,
                    selectedTier?.id === item.id && styles.radioButtonSelected,
                  ]}>
                  {selectedTier?.id === item.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        />

        <TouchableOpacity
          style={[
            styles.continueToPaymentButton,
            !selectedTier && styles.disabledButton,
          ]}
          onPress={handleBoostPurchase}
          disabled={!selectedTier}>
          <Text style={styles.continueToPaymentText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Boost Intro Screen
  if (currentStep === 'boost_intro') {
    return (
      <View style={styles.boostIntroContainer}>
        <View style={styles.urgencyBanner}>
          <Text style={styles.urgencyTitle}>Prime Time Alert!</Text>
          <Text style={styles.urgencySubtitle}>
            {competingStreamers} streamers nearby are competing for attention
          </Text>
          <Animated.View
            style={{
              backgroundColor: countdownFlash.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.pulse, colors.flash],
              }),
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
                  i < 7 ? styles.takenSlot : styles.availableSlot,
                ]}
              />
            ))}
          </View>
          <Text style={styles.slotsText}>
            {premiumSlotsLeft}/10 premium spots available today
          </Text>
        </View>

        <View style={styles.introButtons}>
          <Animated.View
            style={{
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                },
              ],
            }}>
            <TouchableOpacity
              style={styles.boostButton}
              onPress={() => setCurrentStep('boost_tiers')}>
              <Text style={styles.boostButtonText}>🚀 Boost My Stream</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.skipIntroButton}
            onPress={handleSkipBoost}>
            <Text style={styles.skipIntroButtonText}>No Thanks</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Category Selection Screen (Default)
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ready to go live?</Text>
          <Text style={styles.headerSubtitle}>
            Choose your vibe and reach more people
          </Text>
        </View>

      {/* <TextInput
        style={styles.titleInput}
        placeholder="Give your stream a vibe, party? chill? wild?"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={handleTitleChange}
        maxLength={60}
      /> */}

        <Text style={styles.categoryTitle}>What's your vibe?</Text>

        <FlatList
          data={eventsList}
          scrollEnabled={false}
          numColumns={3}
          keyExtractor={item => item.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                styles.categoryTag,
                selectedCategory === item.key && styles.selectedCategoryTag,
              ]}
              onPress={() => {
                console.log(
                  'Category pressed:',
                  item.key,
                  'Navigation available:',
                  !!navigation,
                );
                handleCategorySelection(item.key, false);
              }}>
            {/* <Text style={styles.categoryEmoji}>{item.emoji}</Text> */}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: selectedCategory === item.key ? colors.primaryBorder : colors.border,
                  height: 60,
                  width: 60,
                  backgroundColor: selectedCategory === item.key ? colors.selectedIconBG : colors.iconsBG,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 8
                }}>
                {item.emoji(selectedCategory === item.key ? colors.selectedIconColor : colors.iconColor)}
              </View>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Venue Tagging Section */}
        {venueLoadingState === 'loading' && (
          <View style={venueStyles.section}>
            <Text style={styles.categoryTitle}>Tag a venue</Text>
            <View style={venueStyles.skeletonRow}>
              {[0, 1, 2].map(i => (
                <View key={i} style={venueStyles.skeletonCard} />
              ))}
            </View>
          </View>
        )}

        {venueLoadingState === 'loaded' && nearbyVenues.length > 0 && (
          <View style={venueStyles.section}>
            <Text style={styles.categoryTitle}>Tag a venue</Text>
            <FlatList
              horizontal
              data={[{id: '__none__', name: 'None', primaryTag: null, distanceMetres: 0, googlePlaceId: null} as NearbyVenue, ...nearbyVenues]}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={venueStyles.listContent}
              renderItem={({item}) => {
                const isNone = item.id === '__none__';
                const isSelected = isNone ? selectedVenueId === null : selectedVenueId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      venueStyles.card,
                      isSelected && venueStyles.cardSelected,
                    ]}
                    onPress={() => {
                      if (isNone) {
                        setSelectedVenueId(null);
                      } else {
                        setSelectedVenueId(prev => prev === item.id ? null : item.id);
                      }
                    }}
                    activeOpacity={0.7}>
                    {isSelected && (
                      <View style={venueStyles.checkmark}>
                        <Text style={venueStyles.checkmarkText}>✓</Text>
                      </View>
                    )}
                    <Text
                      style={[venueStyles.cardName, isSelected && venueStyles.cardNameSelected]}
                      numberOfLines={1}>
                      {item.name}
                    </Text>
                    {!isNone && item.primaryTag && (
                      <Text style={venueStyles.cardTag} numberOfLines={1}>
                        {item.primaryTag.replace(/_/g, ' ')}
                      </Text>
                    )}
                    {!isNone && (
                      <Text style={venueStyles.cardDistance}>
                        {formatDistance(item.distanceMetres)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {selectedCategory && (
          <View style={styles.actionSection}>
            <Text style={styles.actionTitle}>Ready to stream?</Text>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => handleGoDirectToStream(selectedCategory)}>
              <StreamIcon color={colors.text} size={20} />
              <Text style={styles.primaryActionText}>Start Streaming</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.boostActionButton}
              onPress={() => handleCategorySelection(selectedCategory, true)}>
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                }}>
                <Text style={styles.boostActionText}>
                  {' '}
                  Boost for More Viewers
                </Text>
              {/* <Text style={styles.boostActionSubtext}>
                Get 5x more visibility
              </Text> */}
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const {width} = Dimensions.get('window');

const venueStyles = StyleSheet.create({
  section: {
    marginBottom: 10,
  },
  listContent: {
    paddingRight: 10,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  skeletonCard: {
    width: 110,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.surface || 'rgba(255,255,255,0.05)',
  },
  card: {
    width: 120,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.primaryBorder || colors.primary,
    backgroundColor: colors.tierBasicBackground || 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  cardName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 3,
  },
  cardNameSelected: {
    color: colors.primary,
  },
  cardTag: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  cardDistance: {
    fontSize: 10,
    color: colors.textMuted || colors.textSecondary,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  // Base container
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight:'700'
  },

  // Title input
  titleInput: {
    backgroundColor: colors.inputBG,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.inputText,
    marginBottom: 30,
    textAlign: 'center',
    // opacity: 0.4,
    fontWeight: '600',
  },

  // Category selection
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    opacity: 0.4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  categoriesContainer: {
    paddingBottom: 30,
    // justifyContent: 'center',

  },
  categoryTag: {
    // backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 14,
    margin: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: (width - 69) / 2.9,
    maxWidth: (width - 73) / 2.9,
  },
  selectedCategoryTag: {
    // backgroundColor: colors.tierBasicBackground,
    // borderColor: colors.primaryBorder,
    backgroundColor: colors.tierBasicBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 7
  },

  // Action section
  actionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryActionButton: {
    backgroundColor: colors.buttonSecondary,
    borderWidth: 1,
    borderColor: colors.borderActive,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    // height: 43,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    // marginBottom: 20,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
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
    backgroundColor: colors.border,
  },
  orText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 15,
  },
  boostActionButton: {
    backgroundColor: colors.buttonSecondary,
    borderWidth: 1,
    borderColor: colors.borderActive,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    // paddingVertical: 10,
    // paddingHorizontal: 32,
    // borderRadius: 15,
    marginBottom: 10,
  },
  boostActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  boostActionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    // marginTop: 4,
  },

  // Boost preview
  boostPreview: {
    backgroundColor: colors.tierPremiumBackground,
    borderWidth: 1,
    borderColor: colors.borderActive,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Processing screen
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  processingText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  processingSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },

  // Confirmation screen
  confirmationContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  boostDetailsCard: {
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
  },
  boostDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  featuresUnlocked: {
    marginBottom: 30,
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  featureItem: {
    fontSize: 14,
    color: colors.textSecondary,
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
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  // Boost tiers screen
  boostTiersContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingTop: 10,
  },
  urgencyHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.urgency,
    textAlign: 'center',
    padding: 10,
    borderRadius: 8,
  },
  scarcityText: {
    fontSize: 12,
    color: colors.scarcity,
    textAlign: 'center',
    marginTop: 6,
  },
  tiersTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  tierCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tierIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
  },
  tierContent: {
    flex: 1,
  },
  tierFeatures: {
    marginTop: 8,
  },
  tierFeature: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    paddingLeft: 8,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  continueToPaymentButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginHorizontal: 16,
  },
  continueToPaymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    textAlign: 'center',
  },
  tierCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  tierMultiplier: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  duration: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  featuresContainer: {
    marginTop: 8,
  },
  feature: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  actionButtons: {
    marginTop: 20,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Boost intro screen
  boostIntroContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingTop: 10,
  },
  urgencyBanner: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.urgency,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  urgencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.urgency,
    textAlign: 'center',
    marginBottom: 6,
  },
  urgencySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.urgency,
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
    fontWeight: '600',
    color: colors.text,
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
    color: colors.primary,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scarcityContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: colors.scarcity,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  scarcityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.scarcity,
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
    backgroundColor: colors.error,
  },
  availableSlot: {
    backgroundColor: colors.success,
  },
  slotsText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  competitorWarning: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },
  warningText: {
    fontSize: 14,
    color: colors.warning,
    textAlign: 'center',
  },
  introButtons: {
    marginTop: 16,
    paddingBottom: 20,
  },
  boostButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 15,
    marginBottom: 12,
  },
  boostButtonText: {
    fontSize: 18,
    // fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  skipIntroButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 25,
  },
  skipIntroButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Legacy text style
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

export default EventSelections;
