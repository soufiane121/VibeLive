import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {VenueSearchResult, VerificationPath, SubscriptionTier} from '../../../features/venueClaim/VenueClaimApi';
import GlobalColors from '../../styles/GlobalColors';

const C = GlobalColors.VenueClaim;

type TierOption = {
  key: SubscriptionTier;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const TIERS: TierOption[] = [
  {
    key: 'analytics',
    name: 'Analytics',
    price: 'Free Trial',
    description: 'See how your venue performs on VibeLive.',
    features: [
      'View count & engagement metrics',
      'Busyness & vibe score tracking',
      'Weekly email reports',
    ],
  },
  {
    key: 'notifications',
    name: 'Notifications',
    price: '$9.99/mo',
    description: 'Engage your audience in real time.',
    features: [
      'Everything in Analytics',
      'Push notifications to nearby users',
      'Event promotion tools',
      'Custom notification scheduling',
    ],
    highlighted: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '$29.99/mo',
    description: 'Full venue management suite.',
    features: [
      'Everything in Notifications',
      'Featured placement on map',
      'Priority support',
      'Advanced analytics & insights',
      'Multi-operator access',
    ],
  },
];

export default function VenueClaimTierSelectionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const venue: VenueSearchResult = route.params?.venue;
  const path: VerificationPath = route.params?.path;
  const verificationData = route.params?.verificationData;
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('analytics');

  const handleContinue = () => {
    navigation.navigate('VenueClaimReview', {
      venue,
      path,
      verificationData,
      subscriptionTier: selectedTier,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          All plans start with a <Text style={styles.goldText}>30-day free trial</Text>.
          You can upgrade or cancel anytime.
        </Text>

        {TIERS.map(tier => (
          <TouchableOpacity
            key={tier.key}
            style={[
              styles.tierCard,
              selectedTier === tier.key && styles.tierCardSelected,
              tier.highlighted && styles.tierCardHighlighted,
            ]}
            onPress={() => setSelectedTier(tier.key)}
            activeOpacity={0.7}>
            {tier.highlighted && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierPrice}>{tier.price}</Text>
            </View>
            <Text style={styles.tierDesc}>{tier.description}</Text>
            {tier.features.map((feat, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
            <View style={styles.radioRow}>
              <View style={styles.radioOuter}>
                {selectedTier === tier.key && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>
                {selectedTier === tier.key ? 'Selected' : 'Select'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleContinue}
          activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Review & Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {padding: 8, marginRight: 8},
  backText: {color: C.text, fontSize: 22},
  title: {color: C.text, fontSize: 20, fontWeight: '700'},
  scroll: {paddingHorizontal: 20, paddingBottom: 40},
  subtitle: {
    color: C.lightTextGray,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  goldText: {
    color: C.primary,
    fontWeight: '700',
  },
  tierCard: {
    backgroundColor: C.cardBackground,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: C.borderLight,
  },
  tierCardSelected: {
    borderColor: C.primary,
  },
  tierCardHighlighted: {
    borderColor: 'rgba(212,175,55,0.3)',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  popularText: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tierName: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
  },
  tierPrice: {
    color: C.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  tierDesc: {
    color: C.textGray,
    fontSize: 13,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  featureCheck: {
    color: C.success,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
    marginTop: 1,
  },
  featureText: {
    color: C.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },
  radioLabel: {
    color: C.lightTextGray,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: '#0A0A0C',
    fontSize: 16,
    fontWeight: '700',
  },
});
