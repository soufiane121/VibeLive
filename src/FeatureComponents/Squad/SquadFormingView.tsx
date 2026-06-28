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
import {
  useTriggerRecommendationMutation,
  useCancelSquadMutation,
} from '../../../features/squad/SquadApi';
import type {SquadMember, SquadState} from '../../../features/squad/SquadApi';
import {baseUrl} from '../../../baseUrl';
import useTranslation from '../../Hooks/useTranslation';
import {useAnalytics} from '../../Hooks/useAnalytics';
import {AnalyticsEventType} from '../../types/AnalyticsEnums';

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
  const { t } = useTranslation();
  const {trackEvent} = useAnalytics({screenName: 'SquadForming'});
  const [triggerRecommendation, {isLoading: isGenerating}] =
    useTriggerRecommendationMutation();
  const [cancelSquad, {isLoading: isCancelling}] = useCancelSquadMutation();

  // Prefer server-provided URL, fallback to baseUrl-derived
  const webJoinUrl = webJoinUrlProp || `${baseUrl}/squad/${squadCode}`;

  // ── Share Invite ────────────────────────────────────────────────────
  const handleShareInvite = useCallback(async () => {
    try {
      const creatorName = squadData?.creator_display_name || t('onboarding.squad.yourFriend');
      await Share.share({
        message: t('onboarding.squad.shareMessage', { creatorName, webJoinUrl }),
        title: t('onboarding.squad.shareTitle'),
      });
      trackEvent(AnalyticsEventType.SQUAD_INVITE_SHARED, {
        squad_code: squadCode,
        member_count: members.length,
      });
    } catch (err) {
      // User cancelled share — no action needed
    }
  }, [squadCode, squadData, webJoinUrl, members, trackEvent]);

  // ── Find Our Spot ───────────────────────────────────────────────────
  const handleFindSpot = useCallback(async () => {
    if (members.length < 1) {
      Alert.alert(
        t('onboarding.squad.needPreferences'),
        t('onboarding.squad.needPreferencesDesc'),
      );
      return;
    }

    try {
      await triggerRecommendation(squadCode).unwrap();
      trackEvent(AnalyticsEventType.SQUAD_FIND_SPOT_TRIGGERED, {
        squad_code: squadCode,
        member_count: members.length,
      });
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        err?.data?.error || t('onboarding.squad.failedRecommendation'),
      );
    }
  }, [squadCode, members, triggerRecommendation, trackEvent]);

  // ── Cancel ──────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    Alert.alert(
      t('onboarding.squad.cancelSquad'),
      t('onboarding.squad.cancelSquadDesc'),
      [
        {text: t('onboarding.squad.keepGoing'), style: 'cancel'},
        {
          text: t('onboarding.squad.cancelSquad'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSquad(squadCode).unwrap();
              trackEvent(AnalyticsEventType.SQUAD_CANCELLED, {
                squad_code: squadCode,
                member_count: members.length,
              });
              onReset();
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.data?.error || t('onboarding.squad.failedCancel'));
            }
          },
        },
      ],
    );
  }, [squadCode, cancelSquad, onReset, trackEvent, members]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/** Header */}
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t('onboarding.squad.yourSquad')}</Text>
          {isCreator && (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isCancelling}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              style={{
                backgroundColor: colors.secondaryBackground,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 22,
                height: 35,
                width: 35,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <CloseIcon size={22} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Connection indicator */}
        <View style={styles.statusRow}>
          <View style={styles.statusLiveRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isConnected
                    ? colors.formingStatusDot
                    : colors.connecting,
                },
              ]}
            />
            <Text
              style={
                isConnected ? styles.statusLiveText : {color: colors.connecting, fontWeight: '700'}
              }>
              {isConnected ? t('onboarding.squad.live') : t('onboarding.squad.connecting')}
            </Text>
          </View>
          <Text style={styles.statusSubText}>
            {isConnected ? t('onboarding.squad.waitingForFriends') : t('onboarding.squad.hangTight')}
          </Text>
        </View>
      </View>

      {/* Squad Code Card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>{t('onboarding.squad.squadCode')}</Text>
        <Text style={styles.codeText}>{squadCode}</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareInvite}
          activeOpacity={0.85}>
          <ShareIcon size={18} color={colors.formingShareButtonText} />
          <Text style={styles.shareButtonText}>{t('onboarding.squad.shareInvite')}</Text>
        </TouchableOpacity>
        <Text style={styles.codeHint}>
          {t('onboarding.squad.shareHint')}
        </Text>
      </View>

      {/* Members List */}
      <View style={styles.membersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('onboarding.squad.squad')}</Text>
          <View style={styles.sectionCountPill}>
            <Text style={styles.sectionCountPillText}>
              {members.length === 1 ? t('onboarding.squad.oneMember') : t('onboarding.squad.membersCount', { count: members.length })}
            </Text>
          </View>
        </View>
        {members.map((member, index) => (
          <MemberRow
            key={member.member_id}
            member={member}
            isCreator={index === 0}
          />
        ))}

        {members.length < 2 && (
          <View style={styles.waitingRow}>
            <View style={styles.waitingAvatar}>
              <PersonIcon size={22} color={colors.textMuted} />
            </View>
            <Text style={styles.waitingText}>
              {t('onboarding.squad.waitingForPlusOne')}
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
                <Text style={styles.findButtonText}>{t('onboarding.squad.findingYourSpot')}</Text>
              </View>
            ) : (
              <View style={styles.findButtonContent}>
                <Text style={styles.findButtonText}>{t('onboarding.squad.findOurSpot')}</Text>
                <Text style={styles.findButtonArrow}>→</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.findHint}>
            {members.length === 1
              ? t('onboarding.squad.startNowOrWait')
              : members.length === 2
              ? t('onboarding.squad.perfectDuo')
              : t('onboarding.squad.basedOnPreferences', { count: members.length })}
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
}) => {
  const {t} = useTranslation();
  const statusLabel = member.has_app ? t('onboarding.squad.ready') : t('onboarding.squad.invitePending');
  const isReady = member.has_app;

  return (
    <View style={styles.memberRow}>
      <View
        style={[
          styles.memberAvatar,
          // {
          //   backgroundColor: member.has_app
          //     ? colors.memberBadge
          //     : colors.memberBadgeGuest,
          // },
        ]}>
        <Text style={styles.memberAvatarText}>
          {member.display_name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <View style={{width: 'auto', maxWidth: '50%'}}>
            <Text style={styles.memberName}>{member.display_name}</Text>
            {member.venue_type_tags.length > 0 && (
              <Text style={styles.memberTags} numberOfLines={1}>
                {member.venue_type_tags
                  .map(t => t.replace(/_/g, ' '))
                  .join(', ')}
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: 5,
            }}>
            <View style={styles.memberStatusRow}>
              <View
                style={[
                  styles.memberStatusDot,
                  isReady
                    ? styles.memberStatusDotReady
                    : styles.memberStatusDotPending,
                ]}
              />
              <Text
                style={
                  isReady
                    ? styles.memberStatusReady
                    : styles.memberStatusPending
                }>
                {statusLabel}
              </Text>
            </View>
            {isCreator && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorBadgeText}>{t('onboarding.squad.creator')}</Text>
              </View>
            )}
          </View>
          {!member.has_app && (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>{t('onboarding.squad.guest')}</Text>
            </View>
          )}
          {member.is_default_profile && (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>{t('onboarding.squad.auto')}</Text>
            </View>
          )}
        </View>
        {/* {member.venue_type_tags.length > 0 && (
          <Text style={styles.memberTags} numberOfLines={1}>
            {member.venue_type_tags.map(t => t.replace(/_/g, ' ')).join(', ')}
          </Text>
        )} */}
      </View>
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.formingHeaderTitle,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.formingStatusLive,
  },
  statusSubText: {
    fontSize: 13,
    color: colors.formingStatusWaiting,
  },
  // Code Card
  codeCard: {
    backgroundColor: colors.formingCardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.formingCardBorder,
    shadowColor: colors.formingCardShadow,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.formingCodeLabel,
    letterSpacing: 1.8,
    marginBottom: 8,
    opacity: 0.5,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.formingCodeText,
    letterSpacing: 6,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: colors.formingShareButtonBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.formingShareButtonBorder,
    marginBottom: 12,
    width: '100%',
  },
  shareButtonText: {
    color: colors.formingShareButtonText,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  codeHint: {
    fontSize: 12,
    color: colors.formingCodeHint,
    textAlign: 'left',
  },
  // Members
  membersSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    marginBottom: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '600',
    color: colors.sectionLabel,
    textTransform: 'uppercase',
    opacity: 0.3,
  },
  sectionCountPill: {
    borderWidth: 1,
    borderColor: colors.formingCardBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.formingShareButtonBg,
  },
  sectionCountPillText: {
    color: colors.formingCodeText,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.7,
  },
  memberRow: {
    flexDirection: 'row',
    // alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.formingMemberCardBg,
    borderWidth: 1,
    borderColor: colors.formingMemberCardBorder,
    marginBottom: 12,
  },
  memberAvatar: {
    width: 45,
    height: 45,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    // borderStyle: 'dashed',
    borderWidth: 0.6,
    borderColor: colors.memberBadge,
    backgroundColor: colors.formingCardBackground,
    // backgroundColor: 'white'
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
    // opacity: 0.3
  },
  memberNameRow: {
    flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.formingMemberName,
    marginRight: 6,
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  creatorBadge: {
    backgroundColor: colors.formingMemberBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    // marginRight: 4,
    borderColor: colors.border,
    borderWidth: 1,
    height: 23,
  },
  creatorBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.formingMemberBadgeText,
  },
  guestBadge: {
    backgroundColor: colors.formingMemberBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderColor: colors.border,
    borderWidth: 1,
    height: 23,
  },
  guestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.formingMemberBadgeText,
  },
  memberTags: {
    fontSize: 12,
    color: colors.formingMemberMeta,
    marginTop: 2,
    opacity: 0.4,
    fontWeight: '700',
  },
  memberStatusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    // alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  memberStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  memberStatusDotReady: {
    backgroundColor: colors.formingMemberStatusReady,
  },
  memberStatusDotPending: {
    backgroundColor: colors.formingMemberStatusPending,
  },
  memberStatusReady: {
    fontSize: 12,
    color: colors.formingMemberStatusReady,
    fontWeight: '700',
  },
  memberStatusPending: {
    fontSize: 12,
    color: colors.formingMemberStatusPending,
    fontWeight: '700',
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.formingWaitingCardBorder,
    backgroundColor: colors.formingWaitingCardBg,
    marginTop: 12,
  },
  waitingAvatar: {
    width: 45,
    height: 45,
    borderRadius: 9,
    backgroundColor: colors.formingWaitingCardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.formingWaitingCardBorder,
    borderStyle: 'dashed',
  },
  waitingText: {
    fontSize: 14,
    color: colors.formingWaitingText,
    fontStyle: 'italic',
    fontWeight: '700',
    opacity: 0.3,
  },
  // Action
  actionSection: {
    alignItems: 'center',
  },
  findButton: {
    backgroundColor: colors.formingActionButtonBg,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.formingActionButtonBorder,
  },
  findButtonDisabled: {
    opacity: 0.7,
  },
  findButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  findButtonText: {
    color: colors.formingActionButtonText,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  findButtonArrow: {
    color: colors.formingActionButtonText,
    fontSize: 20,
    fontWeight: '700',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  findHint: {
    fontSize: 12,
    color: colors.formingActionSubtext,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 4,
    opacity: 0.4,
    fontWeight: '600',
  },
});

export default SquadFormingView;
