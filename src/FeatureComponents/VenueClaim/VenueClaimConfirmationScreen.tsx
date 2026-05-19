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
import useTranslation from '../../Hooks/useTranslation';

const C = GlobalColors.VenueClaim;

export default function VenueClaimConfirmationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const venue: VenueSearchResult = route.params?.venue;
  const claimStatus: ClaimStatus = route.params?.claimStatus || 'pending_verification';
  const path: VerificationPath = route.params?.path;
  const socialVerificationCode: string | undefined = route.params?.socialVerificationCode;

  const STATUS_CONFIG: Record<string, {icon: string; titleKey: string; messageKey: string}> = {
    pending_verification: {
      icon: t('common.pendingIcon'),
      titleKey: 'venueClaim.verificationInProgress',
      messageKey: 'venueClaim.verificationInProgressMsg',
    },
    manual_review: {
      icon: t('common.reviewIcon'),
      titleKey: 'venueClaim.underManualReview',
      messageKey: 'venueClaim.underManualReviewMsg',
    },
    approved: {
      icon: t('common.approvedIcon'),
      titleKey: 'venueClaim.claimApproved',
      messageKey: 'venueClaim.claimApprovedMsg',
    },
  };

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

        <Text style={styles.title}>{t(config.titleKey)}</Text>
        <Text style={styles.message}>{t(config.messageKey)}</Text>

        {claimStatus === 'pending_verification' && path === 'social_media' && socialVerificationCode && (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>{t('venueClaim.dontForget')}</Text>
            <Text style={styles.reminderText}>
              {t('venueClaim.makeSureCodeInBio')}
            </Text>
            <Text style={styles.codeText}>{socialVerificationCode}</Text>
            <Text style={styles.reminderText}>
              {t('venueClaim.wellCheckBioAutomatically')}
            </Text>
          </View>
        )}

        <View style={styles.venueCard}>
          <Text style={styles.venueLabel}>{t('common.venue')}</Text>
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
          <Text style={styles.nextStepsTitle}>{t('venueClaim.whatHappensNext')}</Text>
          <View style={styles.stepItem}>
            <Text style={styles.stepBullet}>{t('common.stepNumber', {step: 1})}</Text>
            <Text style={styles.stepText}>
              {claimStatus === 'pending_verification'
                ? t('venueClaim.weVerifyEvidence')
                : t('venueClaim.adminTeamReviews')}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepBullet}>{t('common.stepNumber', {step: 2})}</Text>
            <Text style={styles.stepText}>
              {t('venueClaim.youllReceiveNotification')}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepBullet}>{t('common.stepNumber', {step: 3})}</Text>
            <Text style={styles.stepText}>
              {t('venueClaim.trialBeginsAutomatically')}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleGoHome} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>{t('venueClaim.backToHome')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleViewStatus} activeOpacity={0.7}>
          <Text style={styles.secondaryBtnText}>{t('venueClaim.checkClaimStatus')}</Text>
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
