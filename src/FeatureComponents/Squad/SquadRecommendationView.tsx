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
import {
  VetoIcon,
  CheckmarkIcon,
  ChevronForwardIcon,
  ClockIcon,
  CloseIcon,
} from '../../UIComponents/Icons';
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
      Alert.alert('Veto this spot?', getVetoMessage(reason), [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Veto',
          style: 'destructive',
          onPress: async () => {
            try {
              await castVeto({squad_code: squadCode, reason}).unwrap();
            } catch (err: any) {
              Alert.alert('Error', err?.data?.error || 'Failed to cast veto');
            }
          },
        },
      ]);
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
        <View style={styles.headerRow}>
          <Text style={styles.eyebrow}>Squad pick</Text>
          <View style={styles.roundPill}>
            <Text style={styles.roundPillText}>
              Round {recommendation.round} of 2
            </Text>
          </View>
        </View>
        <Text style={styles.title}>Your spot tonight</Text>
        <Text style={styles.subtitle}>
          {recommendation.round === 1
            ? "Veto once if it's not right for everyone"
            : 'Creator decides if this is vetoed'}
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
        <View style={styles.devider} />
        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Confirm (Creator only) */}
          {isCreator && (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                isConfirming && styles.buttonDisabled,
              ]}
              // onPress={() => handleConfirm()}
              disabled={isConfirming}
              activeOpacity={0.8}>
              {isConfirming ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <>
                  <CheckmarkIcon size={22} color={colors.text} />
                  <Text style={styles.confirmButtonText}>Let's go here</Text>
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
          <View style={styles.alternativesHeader}>
            <Text style={styles.alternativesTitle}>Alternatives</Text>
            <TouchableOpacity
              style={styles.alternativesButton}
              onPress={() => setShowAlternatives(prev => !prev)}
              activeOpacity={0.8}>
              <Text style={styles.alternativesButtonText}>
                {showAlternatives ? 'Hide' : 'Open'}
              </Text>
              <ChevronForwardIcon
                size={14}
                color={colors.recommendationRoundPillText}
                style={showAlternatives ? {transform: [{rotate: '90deg'}]} : {}}
              />
            </TouchableOpacity>
          </View>

          {showAlternatives &&
            alternatives.map((alt, i) => (
              <View key={alt.venue_id} style={styles.altCard}>
                <View style={styles.altOrderBadge}>
                  <Text style={styles.altOrderText}>{i + 2}</Text>
                </View>
                <View style={styles.altContent}>
                  <VenueCardContent
                    venue={alt}
                    compact
                    handleConfirm={handleConfirm}
                  />
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Member count */}
      <Text style={styles.memberInfo}>
        {members.length === 2
          ? 'Matched to both your vibes'
          : `Based on ${members.length} ${
              members.length === 1 ? 'person' : 'people'
            }'s preferences`}
      </Text>
    </ScrollView>
  );
};

// ── Venue Card Content ──────────────────────────────────────────────────────

const VenueCardContent: React.FC<{
  venue: VenueRecommendation;
  compact?: boolean;
  handleConfirm?: (arg: string) => void;
}> = ({venue, compact, handleConfirm}) => {
  const matchPct = Math.round(venue.match_score * 100);
  const capacityPct = Math.round(venue.estimated_capacity_pct * 100);

  const capacityColor =
    capacityPct > 70
      ? colors.capacityWarning
      : capacityPct > 85
      ? colors.capacityFull
      : colors.capacityGood;

  return (
    <TouchableOpacity
      style={compact ? styles.venueCompact : styles.venueContent}
      onPress={() => handleConfirm(venue.venue_id)}>
      {/* Venue Name + Score */}
      <View style={styles.venueHeader}>
        <View style={{gap: 10}}>
          <Text
            style={[styles.venueName, compact && styles.venueNameCompact]}
            numberOfLines={1}>
            {venue.venue_name}
          </Text>
          <View style={{flexDirection: 'column'}}>
            {/* Status Row */}
            {!compact && (
              <View style={styles.statusRow}>
                {venue.current_status?.vibeshift_state && (
                  <StatusChip
                    label={formatVibeState(
                      venue.current_status?.vibeshift_state,
                    )}
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
          {/* Match Reasons */}
          {venue.match_reasons.length > 0 && (
            <View style={styles.reasonsRow}>
              {venue.match_reasons.map((reason, i) => (
                <View key={i} style={styles.reasonChip}>
                  <ClockIcon
                    size={14}
                    color={colors.recommendationRoundPillText}
                  />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      <View style={!compact ? styles.matchBadge : styles.compactMatchBadge}>
        <Text style={!compact ? styles.matchText : styles.compactMatchText}>
          {matchPct}%
        </Text>
        {!compact && <Text style={styles.matchTextSub}>MATCH</Text>}
      </View>
    </TouchableOpacity>
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
    <CloseIcon size={16} color={colors.recommendationVetoText} />
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
    marginTop: 6,
    backgroundColor: colors.recommendationBackground,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  // Header
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    color: colors.recommendationLabel,
    textTransform: 'uppercase',
    fontWeight: '600',
    opacity: 0.7,
  },
  roundPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.recommendationRoundPillBg,
  },
  roundPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.recommendationRoundPillText,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.recommendationLabel,
    fontWeight: '600',
    opacity: 0.8,
  },
  // Warning banner
  warningBanner: {
    backgroundColor: colors.recommendationWarningBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.recommendationWarningBorder,
  },
  warningText: {
    fontSize: 13,
    color: colors.recommendationWarningText,
    fontWeight: '600',
  },
  // Primary card
  primaryCard: {
    backgroundColor: colors.recommendationCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.recommendationBorder,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  venueContent: {
    padding: 24,
    flexDirection: 'row',
    marginBottom: -10,
  },
  venueCompact: {
    padding: 14,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: '77%',
  },
  venueName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    marginRight: 10,
  },
  venueNameCompact: {
    fontSize: 17,
  },
  devider: {
    borderBottomColor: colors.border,
    borderWidth: 1,
    width: '86%',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  matchBadge: {
    backgroundColor: colors.recommendationMatchBadgeBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderColor: colors.recommendationMatchBadgeText,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: '33%',
  },
  compactMatchBadge: {
    backgroundColor: colors.recommendationMatchBadgeBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderColor: colors.recommendationMatchBadgeText,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: '43%',
  },
  matchText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.recommendationMatchBadgeText,
  },
  compactMatchText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.recommendationMatchBadgeText,
  },
  matchTextSub: {
    fontWeight: '600',
    fontSize: 10,
    color: colors.recommendationMatchBadgeText,
  },
  // Reasons
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,

    borderRadius: 4,
  },
  reasonChip: {
    backgroundColor: colors.recommendationReasonChipBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    borderColor: colors.border,
    borderWidth: 1,
    maxWidth: '99%',
    paddingRight: 22,
    // flexWrap: 'wrap',
  },
  reasonText: {
    fontSize: 12,
    color: colors.recommendationReasonChipText,
    fontWeight: '600',
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderColor: colors.recommendationStatusChipBorder,
  },
  statusChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    // opacity: 0.7
  },
  // Actions
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.recommendationDivider,
  },
  confirmButton: {
    backgroundColor: colors.recommendationPrimaryActionBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: colors.border,
    borderWidth: 2,
    // opacity: 0.5
  },
  confirmButtonText: {
    color: colors.recommendationPrimaryActionText,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
    // opacity: 16
  },
  vetoLabel: {
    fontSize: 12,
    color: colors.recommendationLabel,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.5,
    fontWeight: '700',
  },
  vetoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    maxWidth: '90%',
    marginLeft: 12,
    // flexWrap: 'wrap',
  },
  vetoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.recommendationVetoBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.recommendationVetoBorder,
    // flexWrap: 'wrap'
    maxWidth: '40%',
    minHeight: 50,
  },
  vetoButtonText: {
    fontSize: 12,
    color: colors.recommendationVetoText,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Alternatives
  alternativesSection: {
    marginBottom: 24,
    borderTopColor: colors.border,
    borderTopWidth: 2,
    paddingTop: 16,
  },
  alternativesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alternativesTitle: {
    fontSize: 13,
    letterSpacing: 2,
    color: colors.recommendationLabel,
    textTransform: 'uppercase',
  },
  alternativesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  alternativesButtonText: {
    color: colors.recommendationRoundPillText,
    fontWeight: '700',
    fontSize: 13,
  },
  altCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.recommendationAltCardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.recommendationBorder,
    marginBottom: 12,
    overflow: 'hidden',
  },
  altOrderBadge: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    // borderRightWidth: 1,
    // borderRightColor: colors.recommendationDivider,
  },
  altOrderText: {
    color: colors.recommendationLabel,
    fontWeight: '700',
    fontSize: 16,
    opacity: 0.4,
  },
  altContent: {
    flex: 1,
  },
  // Final say
  finalSayCard: {
    backgroundColor: colors.recommendationCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.recommendationBorder,
    marginBottom: 12,
    overflow: 'hidden',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.recommendationPrimaryActionBg,
    paddingVertical: 12,
  },
  selectButtonText: {
    color: colors.recommendationPrimaryActionText,
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
    color: colors.recommendationLabel,
    fontStyle: 'italic',
  },
  // Footer
  memberInfo: {
    fontSize: 12,
    color: colors.recommendationLabel,
    textAlign: 'center',
  },
});

export default SquadRecommendationView;
