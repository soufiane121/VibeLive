import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {GlobalColors} from '../../styles/GlobalColors';
import {VetoIcon, CheckmarkIcon, ChevronForwardIcon} from '../../UIComponents/Icons';
import {
  useCastVetoMutation,
  useConfirmVenueMutation,
} from '../../../features/squad/SquadApi';
import type {
  SquadRecommendation,
  SquadMember,
  VenueRecommendation,
} from '../../../features/squad/SquadApi';

const colors = GlobalColors.SquadMode;

interface SquadRecommendationViewProps {
  squadCode: string;
  recommendation: SquadRecommendation;
  members: SquadMember[];
  isCreator: boolean;
  autoConfirmWarning: string | null;
  creatorFinalSayOptions: VenueRecommendation[] | null;
}

const SquadRecommendationView: React.FC<SquadRecommendationViewProps> = ({
  squadCode,
  recommendation,
  members,
  isCreator,
  autoConfirmWarning,
  creatorFinalSayOptions,
}) => {
  const [castVeto, {isLoading: isVetoing}] = useCastVetoMutation();
  const [confirmVenue, {isLoading: isConfirming}] = useConfirmVenueMutation();
  const [showAlternatives, setShowAlternatives] = useState(false);

  const primary = recommendation.primary;
  const alternatives = recommendation.alternatives || [];

  // ── Veto ────────────────────────────────────────────────────────────
  const handleVeto = useCallback(
    (reason: string) => {
      Alert.alert(
        'Veto this spot?',
        getVetoMessage(reason),
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Veto',
            style: 'destructive',
            onPress: async () => {
              try {
                await castVeto({squad_code: squadCode, reason}).unwrap();
              } catch (err: any) {
                Alert.alert(
                  'Error',
                  err?.data?.error || 'Failed to cast veto',
                );
              }
            },
          },
        ],
      );
    },
    [squadCode, castVeto],
  );

  // ── Confirm ─────────────────────────────────────────────────────────
  const handleConfirm = useCallback(
    async (venueId?: string) => {
      try {
        await confirmVenue({
          squad_code: squadCode,
          venue_id: venueId,
        }).unwrap();
      } catch (err: any) {
        Alert.alert('Error', err?.data?.error || 'Failed to confirm venue');
      }
    },
    [squadCode, confirmVenue],
  );

  // ── Creator Final Say (after 2 vetoes) ──────────────────────────────
  if (creatorFinalSayOptions && isCreator) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Call</Text>
          <Text style={styles.subtitle}>
            Two vetos in — you decide where the squad goes
          </Text>
        </View>

        {creatorFinalSayOptions.map((option, index) => (
          <TouchableOpacity
            key={option.venue_id}
            style={styles.finalSayCard}
            onPress={() => handleConfirm(option.venue_id)}
            activeOpacity={0.8}>
            <VenueCardContent venue={option} compact />
            <View style={styles.selectButton}>
              <Text style={styles.selectButtonText}>Pick this spot</Text>
              <ChevronForwardIcon size={16} color={colors.background} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Spot Tonight</Text>
        <Text style={styles.subtitle}>
          Round {recommendation.round} of 2
          {recommendation.round === 1
            ? ' — veto once if it\'s not right'
            : ' — final round'}
        </Text>
      </View>

      {/* Auto-confirm warning */}
      {autoConfirmWarning && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{autoConfirmWarning}</Text>
        </View>
      )}

      {/* Primary Recommendation Card */}
      <View style={styles.primaryCard}>
        <VenueCardContent venue={primary} />

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Confirm (Creator only) */}
          {isCreator && (
            <TouchableOpacity
              style={[styles.confirmButton, isConfirming && styles.buttonDisabled]}
              onPress={() => handleConfirm()}
              disabled={isConfirming}
              activeOpacity={0.8}>
              {isConfirming ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <>
                  <CheckmarkIcon size={18} color={colors.background} />
                  <Text style={styles.confirmButtonText}>Let's Go Here</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Veto Reasons */}
          <Text style={styles.vetoLabel}>Not feeling it?</Text>
          <View style={styles.vetoRow}>
            <VetoButton
              label="Too Far"
              reason="too_far"
              onPress={handleVeto}
              isLoading={isVetoing}
            />
            <VetoButton
              label="Not My Vibe"
              reason="not_my_vibe"
              onPress={handleVeto}
              isLoading={isVetoing}
            />
            <VetoButton
              label="Been Recently"
              reason="been_recently"
              onPress={handleVeto}
              isLoading={isVetoing}
            />
          </View>
        </View>
      </View>

      {/* Alternatives Toggle */}
      {alternatives.length > 0 && (
        <View style={styles.alternativesSection}>
          <TouchableOpacity
            style={styles.alternativesToggle}
            onPress={() => setShowAlternatives(!showAlternatives)}>
            <Text style={styles.alternativesToggleText}>
              {showAlternatives
                ? 'Hide alternatives'
                : `${alternatives.length} alternative${alternatives.length > 1 ? 's' : ''} available`}
            </Text>
            <ChevronForwardIcon
              size={14}
              color={colors.textMuted}
              style={showAlternatives ? {transform: [{rotate: '90deg'}]} : {}}
            />
          </TouchableOpacity>

          {showAlternatives &&
            alternatives.map((alt, i) => (
              <View key={alt.venue_id} style={styles.altCard}>
                <VenueCardContent venue={alt} compact />
              </View>
            ))}
        </View>
      )}

      {/* Member count */}
      <Text style={styles.memberInfo}>
        {members.length === 2
          ? 'Matched to both your vibes'
          : `Based on ${members.length} ${members.length === 1 ? 'person' : 'people'}'s preferences`}
      </Text>
    </ScrollView>
  );
};

// ── Venue Card Content ──────────────────────────────────────────────────────

const VenueCardContent: React.FC<{
  venue: VenueRecommendation;
  compact?: boolean;
}> = ({venue, compact}) => {
  const matchPct = Math.round(venue.match_score * 100);
  const capacityPct = Math.round(venue.estimated_capacity_pct * 100);

  const capacityColor =
    capacityPct > 70
      ? colors.capacityWarning
      : capacityPct > 85
        ? colors.capacityFull
        : colors.capacityGood;

  return (
    <View style={compact ? styles.venueCompact : styles.venueContent}>
      {/* Venue Name + Score */}
      <View style={styles.venueHeader}>
        <Text
          style={[styles.venueName, compact && styles.venueNameCompact]}
          numberOfLines={1}>
          {venue.venue_name}
        </Text>
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{matchPct}%</Text>
        </View>
      </View>

      {/* Match Reasons */}
      {venue.match_reasons.length > 0 && (
        <View style={styles.reasonsRow}>
          {venue.match_reasons.map((reason, i) => (
            <View key={i} style={styles.reasonChip}>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Status Row */}
      {!compact && (
        <View style={styles.statusRow}>
          {venue.current_status?.vibeshift_state && (
            <StatusChip
              label={formatVibeState(venue.current_status?.vibeshift_state)}
              color={colors.vibeIndicator}
            />
          )}
          <StatusChip
            label={`${capacityPct}% full`}
            color={capacityColor}
          />
          {venue.distance_from_center != null && (
            <StatusChip
              label={formatDistance(venue.distance_from_center)}
              color={colors.textMuted}
            />
          )}
          {venue.attraction_window_min != null && (
            <StatusChip
              label={`Peak in ~${venue.attraction_window_min}min`}
              color={colors.gold}
            />
          )}
        </View>
      )}

      {/* V2: Data quality indicator */}
      {!compact && venue.data_quality_label && (
        <View style={styles.qualityRow}>
          <View
            style={[
              styles.qualityDot,
              {
                backgroundColor:
                  venue.data_quality_label === 'strong'
                    ? colors.capacityGood
                    : venue.data_quality_label === 'limited'
                      ? colors.gold
                      : colors.textMuted,
              },
            ]}
          />
          <Text style={styles.qualityText}>
            {venue.data_quality_message || venue.data_quality_label}
          </Text>
        </View>
      )}
    </View>
  );
};

// ── Veto Button ─────────────────────────────────────────────────────────────

const VetoButton: React.FC<{
  label: string;
  reason: string;
  onPress: (reason: string) => void;
  isLoading: boolean;
}> = ({label, reason, onPress, isLoading}) => (
  <TouchableOpacity
    style={styles.vetoButton}
    onPress={() => onPress(reason)}
    disabled={isLoading}
    activeOpacity={0.7}>
    <VetoIcon size={14} color={colors.vetoButton} />
    <Text style={styles.vetoButtonText}>{label}</Text>
  </TouchableOpacity>
);

// ── Status Chip ─────────────────────────────────────────────────────────────

const StatusChip: React.FC<{label: string; color: string}> = ({
  label,
  color,
}) => (
  <View style={[styles.statusChip, {borderColor: color}]}>
    <View style={[styles.statusChipDot, {backgroundColor: color}]} />
    <Text style={[styles.statusChipText, {color}]}>{label}</Text>
  </View>
);

// ── Helpers ─────────────────────────────────────────────────────────────────

function getVetoMessage(reason: string): string {
  switch (reason) {
    case 'too_far':
      return "We'll look for something closer.";
    case 'not_my_vibe':
      return "We'll try a different kind of venue.";
    case 'been_recently':
      return "We'll find somewhere fresh.";
    default:
      return "We'll find a new spot.";
  }
}

function formatVibeState(state: string): string {
  const map: Record<string, string> = {
    surge: 'Buzzing',
    crowd_moving: 'Crowd moving in',
    attracting: 'Attracting crowd',
    heating_up: 'Heating up',
    stable: 'Steady',
    cooling_down: 'Cooling down',
    contradicting: 'Mixed signals',
    suppressed: 'Quiet',
  };
  return map[state] || state;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  // Header
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  // Warning banner
  warningBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.countdownWarning,
  },
  warningText: {
    fontSize: 13,
    color: colors.countdownWarning,
    fontWeight: '500',
  },
  // Primary card
  primaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  venueContent: {
    padding: 20,
  },
  venueCompact: {
    padding: 14,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  venueName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 10,
  },
  venueNameCompact: {
    fontSize: 17,
  },
  matchBadge: {
    backgroundColor: colors.goldMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.matchScore,
  },
  // Reasons
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  reasonChip: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  // Status
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Actions
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.confirmButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  vetoLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
    textAlign: 'center',
  },
  vetoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  vetoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 20, 147, 0.25)',
  },
  vetoButtonText: {
    fontSize: 12,
    color: colors.vetoButton,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Alternatives
  alternativesSection: {
    marginBottom: 20,
  },
  alternativesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  alternativesToggleText: {
    fontSize: 13,
    color: colors.textMuted,
    marginRight: 4,
  },
  altCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  // Final say
  finalSayCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.confirmButton,
    paddingVertical: 12,
  },
  selectButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  // V2: Data quality
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  qualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  qualityText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  // Footer
  memberInfo: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default SquadRecommendationView;
