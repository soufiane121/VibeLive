import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {GlobalColors} from '../styles/GlobalColors';
import {useBoostStreamMutation} from '../../features/registrations/LoginSliceApi';
import useGetLocation from '../CustomHooks/useGetLocation';
import {useLazyGetNearbyVenuesQuery, NearbyVenue} from '../../features/LiveStream/LiveStream';
import {IAPAdapter, TIER_TO_PRODUCT_ID} from '../Payment/adapters/IAPAdapter';
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
  CommonMaterialCommunityIcons,
} from '../UIComponents/Icons';

const colors = GlobalColors.BoostFOMOFlow;

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
  ];

// ─────────────────────────────────────────────────────────────────
// Minute package definitions (replaces old BoostTier)
// ─────────────────────────────────────────────────────────────────
interface MinutesPackage {
  id: 'basic' | 'premium' | 'ultimate';
  name: string;
  minutes: number;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const MINUTES_PACKAGES: MinutesPackage[] = [
  {
    id: 'basic',
    name: 'Tonight',
    minutes: 30,
    description: 'One more night out. Stream freely without watching the clock.',
    badge: 'Tonight only',
    badgeColor: colors.tonightOnlyBadge,
  },
  {
    id: 'premium',
    name: 'This Month',
    minutes: 120,
    description: 'Four nights covered. Go live whenever inspiration strikes.',
    badge: 'MOST POPULAR',
    badgeColor: colors.accent,
  },
  {
    id: 'ultimate',
    name: 'All Season',
    minutes: 300,
    description: 'Go live whenever you want, all season long.',
    badge: 'BEST VALUE',
    badgeColor: colors.success,
  },
];

// Currency symbol lookup from ISO code
const getCurrencySymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    USD: '$', GBP: '£', EUR: '€', CAD: 'C$', AUD: 'A$',
    JPY: '¥', CNY: '¥', INR: '₹', KRW: '₩',
  };
  return symbols[code] || code;
};

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

const EventSelections = ({onCompleteSelection}: EventSelectionsProps) => {
  const [title, setTitle] = useState('');
  const [currentStep, setCurrentStep] = useState<FlowStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    [],
  );
  const [selectedPackage, setSelectedPackage] = useState<MinutesPackage | null>(null);
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

  // IAP product data for displaying real prices
  const [iapProducts, setIapProducts] = useState<any[]>([]);
  const [iapLoading, setIapLoading] = useState(false);

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

            // Set the flow step to boost_tiers (package selection)
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
        console.log({result});
        
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

  // Load IAP products when entering package selection
  useEffect(() => {
    if (currentStep === 'boost_tiers') {
      const loadIapProducts = async () => {
        setIapLoading(true);
        try {
          if (!iapAdapterRef.current) {
            iapAdapterRef.current = new IAPAdapter();
          }
          await iapAdapterRef.current.initialize();
          const products = iapAdapterRef.current.getLoadedProducts();
          setIapProducts(products);
          console.log('IAP products loaded:', products.length);
        } catch (error) {
          console.log('Failed to load IAP products, using fallback prices:', error);
        } finally {
          setIapLoading(false);
        }
      };
      loadIapProducts();
    }
  }, [currentStep]);

  const handleTitleChange = (text: string) => {
    if (text.length <= 60) {
      setTitle(text);
    }
  };

  // Analytics tracking (mock implementation)
  const trackEvent = (eventName: string, properties: any) => {
    console.log(`Analytics: ${eventName}`, properties);
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
      // Go directly to minutes trigger screen
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
    console.log('User chose Maybe Later — proceeding without purchase');
    trackEvent(AnalyticsEventType.BOOST_SKIPPED, {
      category: selectedCategory,
      parentCategory: selectedEvent?.label,
      subcategories: selectedSubcategories,
      title: title.trim(),
      step: currentStep,
      timestamp: new Date().toISOString(),
    });

    onCompleteSelection({
      value: selectedCategory,
      title: title.trim(),
      subcategories: selectedSubcategories,
      parentCategory: selectedEvent?.label,
      venueTag: getSelectedVenueTag(),
    });
  };

  const handlePackageSelection = (pkg: MinutesPackage) => {
    setSelectedPackage(pkg);
    trackEvent(AnalyticsEventType.BOOST_TIER_SELECTED, {
      tier: pkg.id,
      minutes: pkg.minutes,
      category: selectedCategory,
      timestamp: new Date().toISOString(),
    });
  };

  // Get IAP product info for a given package
  const getProductForPackage = (pkg: MinutesPackage) => {
    const productId = TIER_TO_PRODUCT_ID[pkg.id];
    return iapProducts.find((p: any) => p.productId === productId);
  };

  // Get display price for a package (from IAP or fallback)
  const getDisplayPrice = (pkg: MinutesPackage): string => {
    const product = getProductForPackage(pkg);
    if (product?.localizedPrice) return product.localizedPrice;
    // Fallback prices when IAP data isn't available
    const fallbacks: Record<string, string> = {basic: '$2.99', premium: '$7.99', ultimate: '$14.99'};
    return fallbacks[pkg.id] || '—';
  };

  // Get numeric price for calculations
  const getNumericPrice = (pkg: MinutesPackage): number => {
    const product = getProductForPackage(pkg);
    if (product?.price) return parseFloat(product.price);
    const fallbacks: Record<string, number> = {basic: 2.99, premium: 7.99, ultimate: 14.99};
    return fallbacks[pkg.id] || 0;
  };

  // Get per-minute rate string with custom footer tags
  const getPerMinuteRate = (pkg: MinutesPackage): string | null => {
    const price = getNumericPrice(pkg);
    const rate = price / pkg.minutes;
    const product = getProductForPackage(pkg);
    const symbol = product?.currency ? getCurrencySymbol(product.currency) : '$';
    
    if (pkg.id === 'basic') return `${symbol}${rate.toFixed(2)} / min`;
    if (pkg.id === 'premium') return `${symbol}${rate.toFixed(2)} / min · Save 30%`;
    if (pkg.id === 'ultimate') return `${symbol}${rate.toFixed(2)} / min · Save 50%`;
    return null;
  };

  const handleBoostPurchase = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      const price = getNumericPrice(selectedPackage);

      console.log('Starting minutes purchase:', {
        tier: selectedPackage.id,
        minutes: selectedPackage.minutes,
        price,
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

        console.log('Requesting App Store purchase...');
        const iapResult = await iapAdapterRef.current.purchaseBoost(
          {
            id: selectedPackage.id,
            price,
            duration: selectedPackage.minutes,
            features: [`${selectedPackage.minutes} streaming minutes`],
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

        console.log('App Store purchase successful:', iapResult.transactionId);
        transactionId = iapResult.transactionId;
        receipt = iapResult.receipt;
      } else {
        // Fallback mock for web/development
        console.log('Using mock payment (non-mobile platform)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        transactionId = `minutes_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        receipt = `mock_receipt_${transactionId}`;
      }

      // Call backend boost activation endpoint using RTK Query
      console.log('Calling backend activation API...');
      const boostResult = await boostStream({
        transactionId,
        tier: selectedPackage.id,
        duration: selectedPackage.minutes,
        price,
        category: selectedCategory,
        title: title.trim(),
        receipt: `receipt_${transactionId}`,
      }).unwrap();

      console.log('Backend activation successful:', boostResult);

      const purchaseData: BoostPurchaseData = {
        tier: selectedPackage.id,
        duration: selectedPackage.minutes,
        price,
        features: [`${selectedPackage.minutes} streaming minutes`],
        transactionId,
        purchaseTime: new Date(),
      };

      setBoostData(purchaseData);
      setCurrentStep('confirmation');

      console.log('Minutes purchase completed:', purchaseData);

      trackEvent(AnalyticsEventType.BOOST_PURCHASED, {
        tier: selectedPackage.id,
        price,
        minutes: selectedPackage.minutes,
        category: selectedCategory,
        title: title.trim(),
        transactionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Minutes purchase failed:', error);
      Alert.alert(
        'Purchase Failed',
        `Unable to complete your purchase: ${
          error?.data?.error || error?.message || 'Unknown error'
        }`,
        [
          {text: 'Try Again', onPress: () => setCurrentStep('boost_tiers')},
          {text: 'Maybe Later', onPress: handleSkipBoost},
        ],
      );

      trackEvent(AnalyticsEventType.PAYMENT_FAILED, {
        tier: selectedPackage.id,
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
    console.log('Purchase confirmed — proceeding to stream');
    onCompleteSelection({
      value: selectedCategory,
      boostData: boostData!,
      subcategories: selectedSubcategories,
      parentCategory: selectedEvent?.label,
      title: title.trim(),
      venueTag: getSelectedVenueTag(),
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // Processing Screen
  // ─────────────────────────────────────────────────────────────────
  if (currentStep === 'processing') {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.processingText}>Processing your purchase…</Text>
        <Text style={styles.processingSubtext}>This only takes a moment</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Confirmation Screen (post-purchase success)
  // ─────────────────────────────────────────────────────────────────
  if (currentStep === 'confirmation' && boostData) {
    return (
      <View style={styles.confirmationContainer}>
        <View style={styles.successIconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        <Text style={styles.confirmationTitle}>
          {boostData.duration} minutes added
        </Text>
        <Text style={styles.confirmationSubtitle}>
          Minutes never expire. Go live whenever you're ready.
        </Text>

        <View style={styles.purchaseSummaryCard}>
          <View style={styles.purchaseSummaryRow}>
            <Text style={styles.purchaseSummaryLabel}>Package</Text>
            <Text style={styles.purchaseSummaryValue}>
              {selectedPackage?.name}
            </Text>
          </View>
          <View style={styles.purchaseSummaryRow}>
            <Text style={styles.purchaseSummaryLabel}>Minutes</Text>
            <Text style={styles.purchaseSummaryValue}>
              {boostData.duration} min
            </Text>
          </View>
          <View style={styles.purchaseSummaryRow}>
            <Text style={styles.purchaseSummaryLabel}>Transaction</Text>
            <Text style={styles.purchaseSummaryValue}>
              {boostData.transactionId.slice(-8)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startStreamButton}
          onPress={handleBoostConfirmation}>
          <Text style={styles.startStreamButtonText}>Start Streaming</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Screen 2 — Package Selection (boost_tiers)
  // ─────────────────────────────────────────────────────────────────
  if (currentStep === 'boost_tiers') {
    return (
      <View style={styles.packageScreenContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.packageScrollContent}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.headerSmallText}>STREAM MINUTES</Text>
            <Text style={styles.headerTitle}>Choose your minutes</Text>
            <Text style={styles.headerSubtitle}>
              Minutes never expire — use them across any night out
            </Text>
          </View>

          <View style={styles.topInfoBanner}>
            <CommonMaterialCommunityIcons name="clock-outline" size={18} color={colors.accent} style={{marginRight: 10}} />
            <Text style={styles.topInfoBannerText}>
              You have 2 free streams per week — minutes extend beyond that
            </Text>
          </View>

          {iapLoading ? (
            <View style={styles.loadingPlaceholder}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Loading prices…</Text>
            </View>
          ) : (
            MINUTES_PACKAGES.map(pkg => {
              const isSelected = selectedPackage?.id === pkg.id;
              const perMinute = getPerMinuteRate(pkg);

              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    isSelected ? styles.packageCardSelected : null,
                  ]}
                  onPress={() => handlePackageSelection(pkg)}
                  activeOpacity={0.8}>
                  
                  {/* Absolute Top-Right Badge */}
                  {pkg.badge && pkg.name !== 'Tonight' && (
                    <View
                      style={[
                        styles.packageBadgeTopRight,
                        {backgroundColor: pkg.badgeColor || colors.accent},
                      ]}>
                      <Text style={styles.packageBadgeTextTopRight}>{pkg.badge}</Text>
                    </View>
                  )}

                  {/* Top Row: Title + Check Circle */}
                  <View style={styles.packageTopRow}>
                    <View style={styles.packageTitleGroup}>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      {pkg.badge && pkg.name === 'Tonight' && (
                        <View style={styles.packageBadgeInline}>
                          <Text style={styles.packageBadgeTextInline}>• {pkg.badge}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.packageCheckCircle, isSelected && styles.packageCheckCircleSelected]}>
                      {isSelected && <Text style={styles.packageCheckmarkText}>✓</Text>}
                    </View>
                  </View>

                  {/* Row 2: Minutes + Price */}
                  <View style={styles.packageRowTwo}>
                    <Text style={styles.packageMinutes}>{pkg.minutes} minutes</Text>
                    <Text style={[styles.packagePrice, isSelected && { color: colors.accent }]}>
                      {getDisplayPrice(pkg)}
                    </Text>
                  </View>

                  <Text style={styles.packageDescription}>
                    {pkg.description}
                  </Text>

                  <View style={styles.cardSeparator} />

                  {/* Footer Badge pill */}
                  {perMinute && (
                    <View style={styles.footerBadgeWrapper}>
                      <View style={[styles.footerBadge, isSelected ? styles.footerBadgeSelected : null]}>
                        <CommonMaterialCommunityIcons 
                           name="clock-outline" 
                           size={14} 
                           color={isSelected ? colors.accent : colors.iconColor} 
                        />
                        <Text style={[styles.footerBadgeText, isSelected ? styles.footerBadgeTextSelected : null]}>
                          {perMinute}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {/* Free minutes reminder card */}
          <View style={styles.freeMinutesCard}>
            <CommonMaterialCommunityIcons name="heart-outline" size={20} color={colors.success} style={{marginTop: 2, marginRight: 12}} />
            <Text style={styles.freeMinutesText}>
              Your <Text style={{color: colors.success, fontWeight: '700'}}>2 free streams per week</Text> continue regardless of purchase — minutes only activate after your free streams are used.
            </Text>
          </View>
        </ScrollView>

        {/* Sticky bottom CTA */}
        <View style={styles.stickyBottomContainer}>
          {selectedPackage && (
             <Text style={styles.stickySummaryText}>
               {selectedPackage.name} · {selectedPackage.minutes} min · <Text style={{fontWeight: '700'}}>{getDisplayPrice(selectedPackage)}</Text>
             </Text>
          )}
          <TouchableOpacity
            style={[
              styles.continueToPaymentButton,
              !selectedPackage && styles.continueToPaymentDisabled,
            ]}
            onPress={handleBoostPurchase}
            disabled={!selectedPackage}>
            <CommonMaterialCommunityIcons name="credit-card-outline" size={20} color={!selectedPackage ? colors.textMuted : colors.text} style={{marginRight: 10}} />
            <Text
              style={[
                styles.continueToPaymentText,
                !selectedPackage && styles.continueToPaymentTextDisabled,
              ]}>
              Continue to payment
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Screen 1 — Trigger Screen (boost_intro)
  // ─────────────────────────────────────────────────────────────────
  if (currentStep === 'boost_intro') {
    return (
      <View style={styles.triggerContainer}>
        <View style={styles.triggerContent}>
          <Text style={styles.triggerHeadline}>
            Want to stream longer tonight?
          </Text>
          <Text style={styles.triggerSubheadline}>
            Free minutes run out fast. Add more to keep your stream going without interruptions.
          </Text>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.getMoreMinutesButton}
            onPress={() => setCurrentStep('boost_tiers')}>
            <Text style={styles.getMoreMinutesText}>Get More Minutes</Text>
          </TouchableOpacity>

          {/* Dismissal */}
          <TouchableOpacity
            style={styles.maybeLaterButton}
            onPress={handleSkipBoost}>
            <Text style={styles.maybeLaterText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Category Selection Screen (Default)
  // ─────────────────────────────────────────────────────────────────
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
            <Text style={styles.boostActionText}>
              Get More Minutes
            </Text>
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
  // ── Base container ──
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: '10%'
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // ── Header ──
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

  // ── Category selection ──
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
  },
  categoryTag: {
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
    backgroundColor: colors.tierBasicBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 7
  },

  // ── Action section ──
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
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
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
    marginBottom: 10,
  },
  boostActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  // ── Processing screen ──
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  processingText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Confirmation screen ──
  confirmationContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  purchaseSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  purchaseSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  purchaseSummaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  purchaseSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  startStreamButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  startStreamButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.background,
    textAlign: 'center',
  },

  // ── Screen 1: Trigger screen (boost_intro) ──
  triggerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  triggerContent: {
    width: '100%',
    alignItems: 'center',
  },
  triggerHeadline: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  triggerSubheadline: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  getMoreMinutesButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  getMoreMinutesText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.background,
    textAlign: 'center',
  },
  maybeLaterButton: {
    paddingVertical: 12,
  },
  maybeLaterText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // ── Screen 2: Package selection (boost_tiers) ──
  packageScreenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  topInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  topInfoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
    lineHeight: 18,
  },
  packageScrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  loadingPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  packageBadgeTopRight: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  packageBadgeTextTopRight: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  packageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  packageTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginRight: 8,
  },
  packageBadgeInline: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.tonightOnlyBadgeBG,
    borderColor: colors.tonightOnlyBadgeBorder,
    borderWidth: 1,
    
  },
  packageBadgeTextInline: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.tonightOnlyBadge,
  },
  packageCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  packageCheckCircleSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  packageCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  packageRowTwo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageMinutes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.accent,
  },
  packageDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '600',
    paddingRight: 20,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
    opacity: 0.5,
  },
  footerBadgeWrapper: {
    flexDirection: 'row',
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  footerBadgeSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  footerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  footerBadgeTextSelected: {
    color: colors.accent,
  },
  freeMinutesCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  freeMinutesText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '600',
  },
  stickyBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stickySummaryText: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    fontWeight: '600',
  },
  continueToPaymentButton: {
    backgroundColor: colors.continueBtnBG,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cntBtnBorder,
  },
  continueToPaymentDisabled: {
    // backgroundColor: colors.cardBackground,
    opacity: 0.5,
  },
  continueToPaymentText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  continueToPaymentTextDisabled: {
    color: colors.textMuted,
  },

  // ── Legacy text style ──
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

export default EventSelections;
