import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {
  VenueSearchResult,
  VerificationPath,
  SubscriptionTier,
  useSubmitClaimMutation,
} from '../../../features/venueClaim/VenueClaimApi';
import GlobalColors from '../../styles/GlobalColors';

const C = GlobalColors.VenueClaim;

const PATH_LABELS: Record<VerificationPath, string> = {
  google_business: 'Google Business Profile',
  social_media: 'Social Media Bio',
  business_license: 'Business License Upload',
};

const TIER_LABELS: Record<SubscriptionTier, string> = {
  none: 'None',
  analytics: 'Analytics',
  notifications: 'Notifications',
  premium: 'Premium',
};

export default function VenueClaimReviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const currentUser = useSelector((state: any) => state.currentUser.value);

  const venue: VenueSearchResult = route.params?.venue;
  const path: VerificationPath = route.params?.path;
  const verificationData = route.params?.verificationData || {};
  const subscriptionTier: SubscriptionTier = route.params?.subscriptionTier || 'analytics';

  const [claimantName, setClaimantName] = useState(
    currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : '',
  );
  const [claimantRole, setClaimantRole] = useState('');
  const [claimantEmail, setClaimantEmail] = useState(currentUser?.email || '');
  const [claimantPhone, setClaimantPhone] = useState(currentUser?.phoneNumber || '');

  const [submitClaim, {isLoading}] = useSubmitClaimMutation();

  const canSubmit =
    claimantName.trim() &&
    claimantRole.trim() &&
    claimantEmail.trim() &&
    claimantPhone.trim();

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    try {
      const body: any = {
        claimantName: claimantName.trim(),
        claimantRole: claimantRole.trim(),
        claimantEmail: claimantEmail.trim(),
        claimantPhone: claimantPhone.trim(),
        path,
        subscriptionTierSelected: subscriptionTier,
        ...verificationData,
      };

      const result = await submitClaim({venueId: venue._id, body}).unwrap();
      navigation.navigate('VenueClaimConfirmation', {
        venue,
        path,
        claimStatus: result.venue.claim.status,
        socialVerificationCode: result.venue.claim.socialVerificationCode,
      });
    } catch (err: any) {
      Alert.alert(
        'Submission Failed',
        err?.data?.error || 'Something went wrong. Please try again.',
      );
    }
  };

  const address = [venue?.address?.street, venue?.address?.city, venue?.address?.state]
    .filter(Boolean)
    .join(', ');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review & Submit</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Venue Summary */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewHeading}>Venue</Text>
          <Text style={styles.reviewValue}>{venue?.name}</Text>
          {address ? <Text style={styles.reviewSubvalue}>{address}</Text> : null}
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewHeading}>Verification Method</Text>
          <Text style={styles.reviewValue}>{PATH_LABELS[path]}</Text>
          {path === 'google_business' && verificationData.googleBusinessUrl && (
            <Text style={styles.reviewSubvalue} numberOfLines={1}>
              {verificationData.googleBusinessUrl}
            </Text>
          )}
          {path === 'social_media' && verificationData.handle && (
            <Text style={styles.reviewSubvalue}>
              @{verificationData.handle} ({verificationData.platform})
            </Text>
          )}
          {path === 'business_license' && verificationData.docType && (
            <Text style={styles.reviewSubvalue}>
              {verificationData.docType.replace(/_/g, ' ')}
            </Text>
          )}
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewHeading}>Selected Plan</Text>
          <Text style={styles.reviewValue}>{TIER_LABELS[subscriptionTier]}</Text>
          <Text style={styles.reviewSubvalue}>30-day free trial included</Text>
        </View>

        {/* Claimant Info Form */}
        <Text style={styles.sectionTitle}>Your Information</Text>

        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={claimantName}
          onChangeText={setClaimantName}
          placeholder="John Smith"
          placeholderTextColor={C.mutedGray}
        />

        <Text style={styles.inputLabel}>Role at Venue *</Text>
        <TextInput
          style={styles.input}
          value={claimantRole}
          onChangeText={setClaimantRole}
          placeholder="Owner, Manager, Marketing Director..."
          placeholderTextColor={C.mutedGray}
        />

        <Text style={styles.inputLabel}>Email *</Text>
        <TextInput
          style={styles.input}
          value={claimantEmail}
          onChangeText={setClaimantEmail}
          placeholder="you@venue.com"
          placeholderTextColor={C.mutedGray}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Phone *</Text>
        <TextInput
          style={styles.input}
          value={claimantPhone}
          onChangeText={setClaimantPhone}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor={C.mutedGray}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || isLoading) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color={C.black} />
          ) : (
            <Text style={styles.submitBtnText}>Submit Claim</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By submitting, you confirm that you are authorized to represent this venue
          and that the information provided is accurate.
        </Text>
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
  reviewCard: {
    backgroundColor: C.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  reviewHeading: {
    color: C.lightTextGray,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  reviewValue: {
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewSubvalue: {
    color: C.textGray,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  inputLabel: {
    color: C.lightTextGray,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: C.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#0A0A0C',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    color: C.textGray,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
});
