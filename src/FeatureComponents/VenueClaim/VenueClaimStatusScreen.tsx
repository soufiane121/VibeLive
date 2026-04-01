import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useGetClaimStatusQuery, ClaimStatus} from '../../../features/venueClaim/VenueClaimApi';
import GlobalColors from '../../styles/GlobalColors';

const C = GlobalColors.VenueClaim;

const STATUS_DISPLAY: Record<ClaimStatus, {icon: string; label: string; color: string; description: string}> = {
  unclaimed: {
    icon: '📍',
    label: 'Unclaimed',
    color: '#8a827a',
    description: 'This venue has not been claimed yet.',
  },
  pending_verification: {
    icon: '⏳',
    label: 'Pending Verification',
    color: '#f59e0b',
    description: 'Your evidence is being verified. This usually takes a few minutes.',
  },
  manual_review: {
    icon: '📋',
    label: 'Under Review',
    color: '#3b82f6',
    description: 'Your claim is being reviewed by our admin team. This typically takes 1-2 business days.',
  },
  approved: {
    icon: '✅',
    label: 'Approved',
    color: '#2ecc71',
    description: 'Your claim has been approved! Your venue is now onboarded.',
  },
  rejected: {
    icon: '❌',
    label: 'Rejected',
    color: '#e74c3c',
    description: 'Your claim was not approved. You may be able to resubmit with updated information.',
  },
  suspended: {
    icon: '⚠️',
    label: 'Suspended',
    color: '#e74c3c',
    description: 'This venue has been suspended. Contact support for more information.',
  },
};

const REJECTION_REASONS: Record<string, string> = {
  evidence_does_not_match_venue: 'The evidence provided does not match this venue.',
  claimant_not_verifiable: 'We were unable to verify your identity as a venue representative.',
  venue_does_not_meet_criteria: 'This venue does not meet our onboarding criteria.',
  duplicate_claim_in_review: 'Another claim for this venue is already being reviewed.',
  fraudulent_submission: 'The submission was flagged as potentially fraudulent.',
};

export default function VenueClaimStatusScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const venueId: string = route.params?.venueId;

  const {data, isLoading, error, refetch} = useGetClaimStatusQuery(venueId, {
    pollingInterval: 30000,
  });

  const venue = data?.venue;
  const claim = venue?.claim;
  const statusInfo = claim ? STATUS_DISPLAY[claim.status] : null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={styles.loadingText}>Loading claim status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !venue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Claim Status</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load claim status.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canResubmit = claim?.status === 'rejected' && (claim?.resubmissionCount || 0) < 3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claim Status</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Card */}
        <View style={[styles.statusCard, {borderColor: statusInfo?.color + '44'}]}>
          <Text style={styles.statusIcon}>{statusInfo?.icon}</Text>
          <Text style={[styles.statusLabel, {color: statusInfo?.color}]}>{statusInfo?.label}</Text>
          <Text style={styles.statusDesc}>{statusInfo?.description}</Text>
        </View>

        {/* Venue Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoHeading}>Venue</Text>
          <Text style={styles.infoValue}>{venue.name}</Text>
          {venue.address && (
            <Text style={styles.infoSubvalue}>
              {[venue.address.street, venue.address.city, venue.address.state].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>

        {/* Claim Details */}
        {claim && (
          <View style={styles.infoCard}>
            <Text style={styles.infoHeading}>Claim Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Verification Path</Text>
              <Text style={styles.detailValue}>
                {claim.path?.replace(/_/g, ' ') || '—'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted</Text>
              <Text style={styles.detailValue}>
                {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : '—'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Resubmissions</Text>
              <Text style={styles.detailValue}>{claim.resubmissionCount}/3</Text>
            </View>
            {claim.subscriptionTierSelected && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan Selected</Text>
                <Text style={styles.detailValue}>
                  {claim.subscriptionTierSelected.charAt(0).toUpperCase() + claim.subscriptionTierSelected.slice(1)}
                </Text>
              </View>
            )}
            {claim.trialStartedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trial Ends</Text>
                <Text style={styles.detailValue}>
                  {claim.trialEndsAt ? new Date(claim.trialEndsAt).toLocaleDateString() : '—'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Rejection Reason */}
        {claim?.status === 'rejected' && claim.rejectionReason && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            <Text style={styles.rejectionText}>
              {REJECTION_REASONS[claim.rejectionReason] || claim.rejectionReason}
            </Text>
          </View>
        )}

        {/* Resubmit */}
        {canResubmit && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('VenueClaimDetails', {venue})}
            activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Resubmit Claim</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.secondaryBtnText}>Go Back</Text>
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
  headerTitle: {color: C.text, fontSize: 20, fontWeight: '700'},
  scroll: {paddingHorizontal: 20, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {color: C.lightTextGray, fontSize: 14, marginTop: 12},
  errorText: {color: C.error, fontSize: 16, marginBottom: 16},
  retryBtn: {
    backgroundColor: C.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  retryBtnText: {color: C.text, fontSize: 14, fontWeight: '600'},
  statusCard: {
    alignItems: 'center',
    backgroundColor: C.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  statusIcon: {fontSize: 40, marginBottom: 12},
  statusLabel: {fontSize: 18, fontWeight: '700', marginBottom: 8},
  statusDesc: {
    color: C.lightTextGray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: C.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  infoHeading: {
    color: C.lightTextGray,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoValue: {color: C.text, fontSize: 16, fontWeight: '600'},
  infoSubvalue: {color: C.textGray, fontSize: 13, marginTop: 2},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  detailLabel: {color: C.textGray, fontSize: 13},
  detailValue: {color: C.text, fontSize: 13, fontWeight: '600'},
  rejectionCard: {
    backgroundColor: 'rgba(231,76,60,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  rejectionTitle: {
    color: C.error,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  rejectionText: {color: C.lightTextGray, fontSize: 13, lineHeight: 18},
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  primaryBtnText: {color: '#0A0A0C', fontSize: 16, fontWeight: '700'},
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  secondaryBtnText: {color: C.lightTextGray, fontSize: 15, fontWeight: '600'},
});
