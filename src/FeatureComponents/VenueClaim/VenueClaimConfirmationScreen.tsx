import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {VenueSearchResult, ClaimStatus, VerificationPath} from '../../../features/venueClaim/VenueClaimApi';
import GlobalColors from '../../styles/GlobalColors';

const C = GlobalColors.VenueClaim;

const STATUS_CONFIG: Record<string, {icon: string; title: string; message: string}> = {
  pending_verification: {
    icon: '⏳',
    title: 'Verification In Progress',
    message: 'We\'re verifying your claim. This usually takes a few minutes for Google Business and social media verification. You\'ll receive a notification once it\'s reviewed.',
  },
  manual_review: {
    icon: '📋',
    title: 'Under Manual Review',
    message: 'Your claim has been submitted for manual review by our team. This typically takes 1-2 business days. We\'ll notify you as soon as a decision is made.',
  },
  approved: {
    icon: '🎉',
    title: 'Claim Approved!',
    message: 'Congratulations! Your venue claim has been approved. Your 30-day free trial has started. You can now access your venue dashboard.',
  },
};

export default function VenueClaimConfirmationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const venue: VenueSearchResult = route.params?.venue;
  const claimStatus: ClaimStatus = route.params?.claimStatus || 'pending_verification';
  const path: VerificationPath = route.params?.path;
  const socialVerificationCode: string | undefined = route.params?.socialVerificationCode;

  const config = STATUS_CONFIG[claimStatus] || STATUS_CONFIG.pending_verification;

  const handleGoHome = () => {
    navigation.popToTop();
    navigation.navigate('Bottom');
  };

  const handleViewStatus = () => {
    navigation.popToTop();
    navigation.navigate('VenueClaimStatus', {venueId: venue?._id});
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.message}>{config.message}</Text>

        {claimStatus === 'pending_verification' && path === 'social_media' && socialVerificationCode && (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>Don't forget!</Text>
            <Text style={styles.reminderText}>
              Make sure the verification code is in your bio:
            </Text>
            <Text style={styles.codeText}>{socialVerificationCode}</Text>
            <Text style={styles.reminderText}>
              We'll check your bio automatically. You have up to 5 verification attempts.
            </Text>
          </View>
        )}

        <View style={styles.venueCard}>
          <Text style={styles.venueLabel}>Venue</Text>
          <Text style={styles.venueName}>{venue?.name}</Text>
          {venue?.address && (
            <Text style={styles.venueAddr}>
              {[venue.address.street, venue.address.city, venue.address.state]
                .filter(Boolean)
                .join(', ')}
            </Text>
          )}
        </View>

        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>What happens next?</Text>
          <View style={styles.stepItem}>
            <Text style={styles.stepBullet}>1</Text>
            <Text style={styles.stepText}>
              {claimStatus === 'pending_verification'
                ? 'We verify your submitted evidence'
                : 'Our admin team reviews your submission'}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepBullet}>2</Text>
            <Text style={styles.stepText}>
              You'll receive a push notification with the result
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepBullet}>3</Text>
            <Text style={styles.stepText}>
              Once approved, your 30-day free trial begins automatically
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleGoHome} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleViewStatus} activeOpacity={0.7}>
          <Text style={styles.secondaryBtnText}>Check Claim Status</Text>
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
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    color: C.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: C.lightTextGray,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  reminderCard: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  reminderTitle: {
    color: C.warning,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  reminderText: {
    color: C.lightTextGray,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  codeText: {
    color: C.primary,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginVertical: 8,
  },
  venueCard: {
    backgroundColor: C.cardBackground,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.borderGold,
    alignItems: 'center',
  },
  venueLabel: {
    color: C.lightTextGray,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  venueName: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
  },
  venueAddr: {
    color: C.textGray,
    fontSize: 13,
    marginTop: 2,
  },
  nextStepsCard: {
    backgroundColor: C.cardBackground,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  nextStepsTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepBullet: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '700',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.primaryMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginRight: 10,
  },
  stepText: {
    color: C.lightTextGray,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#0A0A0C',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  secondaryBtnText: {
    color: C.lightTextGray,
    fontSize: 15,
    fontWeight: '600',
  },
});
