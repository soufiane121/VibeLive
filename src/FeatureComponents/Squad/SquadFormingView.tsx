import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {GlobalColors} from '../../styles/GlobalColors';
import {ShareIcon, CloseIcon, PersonIcon} from '../../UIComponents/Icons';
import {useTriggerRecommendationMutation, useCancelSquadMutation} from '../../../features/squad/SquadApi';
import type {SquadMember, SquadState} from '../../../features/squad/SquadApi';
import { baseUrl } from '../../../baseUrl';

const colors = GlobalColors.SquadMode;

interface SquadFormingViewProps {
  squadCode: string;
  squadData: SquadState | undefined;
  members: SquadMember[];
  isConnected: boolean;
  isCreator: boolean;
  webJoinUrl: string | null;
  onReset: () => void;
}

const SquadFormingView: React.FC<SquadFormingViewProps> = ({
  squadCode,
  squadData,
  members,
  isConnected,
  isCreator,
  webJoinUrl: webJoinUrlProp,
  onReset,
}) => {
  const [triggerRecommendation, {isLoading: isGenerating}] =
    useTriggerRecommendationMutation();
  const [cancelSquad, {isLoading: isCancelling}] = useCancelSquadMutation();

  // Prefer server-provided URL, fallback to baseUrl-derived
  const webJoinUrl = webJoinUrlProp || `${baseUrl}/squad/${squadCode}`;

  // ── Share Invite ────────────────────────────────────────────────────
  const handleShareInvite = useCallback(async () => {
    try {
      const creatorName =
        squadData?.creator_display_name || 'Your friend';
      await Share.share({
        message: `${creatorName} is planning tonight — join the squad!\n\n${webJoinUrl}\n\nNo app needed. Just pick your vibe.`,
        title: 'Join my Squad',
      });
    } catch (err) {
      // User cancelled share — no action needed
    }
  }, [squadCode, squadData, webJoinUrl]);

  // ── Find Our Spot ───────────────────────────────────────────────────
  const handleFindSpot = useCallback(async () => {
    if (members.length < 1) {
      Alert.alert(
        'Need preferences',
        'At least one member should have picked their vibe before generating a recommendation.',
      );
      return;
    }

    try {
      await triggerRecommendation(squadCode).unwrap();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.data?.error || 'Failed to generate recommendation',
      );
    }
  }, [squadCode, members, triggerRecommendation]);

  // ── Cancel ──────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    Alert.alert('Cancel Squad', 'Are you sure? This will end the squad for everyone.', [
      {text: 'Keep Going', style: 'cancel'},
      {
        text: 'Cancel Squad',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSquad(squadCode).unwrap();
            onReset();
          } catch (err: any) {
            Alert.alert('Error', err?.data?.error || 'Failed to cancel');
          }
        },
      },
    ]);
  }, [squadCode, cancelSquad, onReset]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Your Squad</Text>
          {isCreator && (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isCancelling}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <CloseIcon size={22} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Connection indicator */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {backgroundColor: isConnected ? colors.confirmButton : colors.cancelButton},
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Live' : 'Connecting...'}
          </Text>
        </View>
      </View>

      {/* Squad Code Card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>SQUAD CODE</Text>
        <Text style={styles.codeText}>{squadCode}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareInvite}>
          <ShareIcon size={18} color={colors.background} />
          <Text style={styles.shareButtonText}>Share Invite</Text>
        </TouchableOpacity>
        <Text style={styles.codeHint}>
          Friends don't need the app — just share the link
        </Text>
      </View>

      {/* Members List */}
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>
          {members.length === 2 ? 'Duo' : 'Squad'} ({members.length} {members.length === 1 ? 'member' : 'members'})
        </Text>
        {members.map((member, index) => (
          <MemberRow key={member.member_id} member={member} isCreator={index === 0} />
        ))}

        {members.length < 2 && (
          <View style={styles.waitingRow}>
            <View style={styles.waitingAvatar}>
              <PersonIcon size={20} color={colors.textMuted} />
            </View>
            <Text style={styles.waitingText}>
              Waiting for your +1 to join...
            </Text>
          </View>
        )}
      </View>

      {/* Find Our Spot Button (Creator only) */}
      {isCreator && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.findButton,
              isGenerating && styles.findButtonDisabled,
            ]}
            onPress={handleFindSpot}
            disabled={isGenerating}
            activeOpacity={0.8}>
            {isGenerating ? (
              <View style={styles.generatingRow}>
                <ActivityIndicator color={colors.background} size="small" />
                <Text style={styles.findButtonText}>
                  {' '}
                  Finding your spot...
                </Text>
              </View>
            ) : (
              <Text style={styles.findButtonText}>Find Our Spot</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.findHint}>
            {members.length === 1
              ? 'You can start now or wait for someone to join'
              : members.length === 2
                ? 'Perfect duo — find a spot you both love'
                : `Based on ${members.length} people's preferences`}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// ── Member Row ──────────────────────────────────────────────────────────────

const MemberRow: React.FC<{member: SquadMember; isCreator: boolean}> = ({
  member,
  isCreator,
}) => (
  <View style={styles.memberRow}>
    <View
      style={[
        styles.memberAvatar,
        {
          backgroundColor: member.has_app
            ? colors.primaryMuted
            : colors.surfaceElevated,
        },
      ]}>
      <Text style={styles.memberAvatarText}>
        {member.display_name.charAt(0).toUpperCase()}
      </Text>
    </View>
    <View style={styles.memberInfo}>
      <View style={styles.memberNameRow}>
        <Text style={styles.memberName}>{member.display_name}</Text>
        {isCreator && (
          <View style={styles.creatorBadge}>
            <Text style={styles.creatorBadgeText}>Creator</Text>
          </View>
        )}
        {!member.has_app && (
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeText}>Guest</Text>
          </View>
        )}
        {member.is_default_profile && (
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeText}>Auto</Text>
          </View>
        )}
      </View>
      {member.venue_type_tags.length > 0 && (
        <Text style={styles.memberTags} numberOfLines={1}>
          {member.venue_type_tags
            .map(t => t.replace(/_/g, ' '))
            .join(', ')}
        </Text>
      )}
    </View>
  </View>
);

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
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  // Code Card
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 6,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: colors.inviteButton,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  shareButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  codeHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Members
  membersSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginRight: 6,
  },
  creatorBadge: {
    backgroundColor: colors.goldMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  creatorBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.gold,
  },
  guestBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  memberTags: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    opacity: 0.5,
  },
  waitingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  waitingText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  // Action
  actionSection: {
    alignItems: 'center',
  },
  findButton: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  findButtonDisabled: {
    opacity: 0.7,
  },
  findButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  findHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default SquadFormingView;
