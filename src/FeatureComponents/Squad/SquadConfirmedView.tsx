import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Share,
} from 'react-native';
import {GlobalColors} from '../../styles/GlobalColors';
import {NavigateIcon, ShareIcon, CheckmarkIcon} from '../../UIComponents/Icons';
import type {ConfirmedVenue, SquadMember} from '../../../features/squad/SquadApi';

const colors = GlobalColors.SquadMode;

interface SquadConfirmedViewProps {
  venue: ConfirmedVenue;
  members: SquadMember[];
  venueAlert: string | null;
}

const SquadConfirmedView: React.FC<SquadConfirmedViewProps> = ({
  venue,
  members,
  venueAlert,
}) => {
  // ── Open Maps Navigation ────────────────────────────────────────────
  const handleNavigate = useCallback(() => {
    if (venue.lat == null || venue.lng == null) return;

    const encodedName = encodeURIComponent(venue.venue_name);
    const url = Platform.select({
      ios: `maps://app?daddr=${venue.lat},${venue.lng}&q=${encodedName}`,
      android: `google.navigation:q=${venue.lat},${venue.lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}&destination_place_id=${encodedName}`,
    });

    Linking.canOpenURL(url!).then(supported => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        // Fallback to Google Maps web
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`,
        );
      }
    });
  }, [venue]);

  // ── Share Venue ─────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      const mapsUrl =
        venue.lat && venue.lng
          ? `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`
          : '';

      await Share.share({
        message: `Squad confirmed: ${venue.venue_name}! ${mapsUrl}`,
        title: venue.venue_name,
      });
    } catch {
      // User cancelled
    }
  }, [venue]);

  const confirmedTime = venue.confirmed_at
    ? new Date(venue.confirmed_at).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Success header */}
      <View style={styles.successHeader}>
        <View style={styles.heroIconWrapper}>
          <View style={styles.heroIconInner}>
            <CheckmarkIcon size={32} color={colors.confirmHeroLabel} />
          </View>
        </View>
        <Text style={styles.headerLabel}>SQUAD CONFIRMED</Text>
        <Text style={styles.title}>You're all set</Text>
        <Text style={styles.subtitle}>Your squad is heading to</Text>
      </View>

      {/* Venue Card */}
      <View style={styles.venueCard}>
        <View style={styles.venueHeaderRow}>
          <Text style={styles.venueName} numberOfLines={1}>
            {venue.venue_name}
          </Text>
          <View style={styles.confirmBadge}>
            <CheckmarkIcon size={12} color={colors.confirmBadgeIcon} />
            <Text style={styles.confirmBadgeText}>Confirmed</Text>
          </View>
        </View>

        {confirmedTime && (
          <Text style={styles.confirmedAt}>
            Confirmed · {confirmedTime}
          </Text>
        )}

        {/* Venue alert (VibeShift status change) */}
        {venueAlert && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>{venueAlert}</Text>
          </View>
        )}
        <View style={styles.devider} />

        {/* Navigation Button */}
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={handleNavigate}
          activeOpacity={0.8}>
          <NavigateIcon size={20} color={colors.confirmPrimaryButtonText} />
          <Text style={styles.navigateButtonText}>Get Directions</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.8}>
          <ShareIcon size={18} color={colors.confirmSecondaryButtonText} />
          <Text style={styles.shareButtonText}>Share with Others</Text>
        </TouchableOpacity>
      </View>

      {/* Squad Members Going */}
      <View style={styles.membersSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Who's going</Text>
          <View style={styles.sectionCountBadge}>
            <Text style={styles.sectionCountText}>{members.length}</Text>
          </View>
        </View>
        <View style={styles.memberAvatarRow}>
          {members.map(member => (
            <View key={member.member_id} style={styles.memberChip}>
              <View
                style={[
                  styles.memberAvatar,
                  {
                    backgroundColor: member.has_app
                      ? colors.memberBadge
                      : colors.memberBadgeGuest,
                  },
                ]}>
                <Text style={styles.memberAvatarText}>
                  {member.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.memberName} numberOfLines={1}>
                {member.display_name}
              </Text>
            </View>
          ))}
          <View style={styles.memberChip}>
            <View style={[styles.memberAvatar, styles.inviteAvatar]}>
              <Text style={styles.inviteAvatarText}>+</Text>
            </View>
            <Text style={styles.memberName}>Invite</Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Tips for tonight</Text>
        <TipItem
          index={1}
          text="Screenshot the venue name — signal can be spotty underground"
        />
        <TipItem
          index={2}
          text="Let one person be the point of contact for the group"
        />
        <TipItem
          index={3}
          text="Check back here for live venue updates"
        />
      </View>
    </ScrollView>
  );
};

// ── Tip Item ────────────────────────────────────────────────────────────────

const TipItem: React.FC<{text: string; index: number}> = ({text, index}) => (
  <View style={styles.tipRow}>
    <View style={styles.tipNumber}>
      <Text style={styles.tipNumberText}>{index}</Text>
    </View>
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

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
  // Success header
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIconWrapper: {
    width: 82,
    height: 82,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.confirmHeroIconBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.confirmHeroIconBg,
    marginBottom: 14,
  },
  heroIconInner: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.confirmHeroIconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    color: colors.confirmHeroLabel,
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  // Venue Card
  venueCard: {
    backgroundColor: colors.confirmCardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.confirmCardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 16,
    elevation: 8,
  },
  venueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  venueName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    marginBottom: 4,
  },
  confirmedAt: {
    fontSize: 13,
    color: colors.confirmMetaText,
    marginBottom: 18,
  },
  confirmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.confirmBadgeBackground,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  confirmBadgeText: {
    color: colors.confirmBadgeText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  alertBanner: {
    backgroundColor: colors.accentMuted,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: colors.vibeIndicator,
  },
  alertText: {
    fontSize: 13,
    color: colors.vibeIndicator,
    fontWeight: '500',
  },
  devider: {
    borderWidth: 1,
    borderColor: colors.confirmationDevider,
    marginBottom: 14,
    opacity: 0.4
  },
  navigateButton: {
    backgroundColor: colors.confirmPrimaryButtonBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    marginBottom: 10,
  },
  navigateButtonText: {
    color: colors.confirmPrimaryButtonText,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.confirmSecondaryButtonBorder,
    backgroundColor: colors.confirmSecondaryButtonBg,
    width: '100%',
  },
  shareButtonText: {
    color: colors.confirmSecondaryButtonText,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Members
  membersSection: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  sectionCountBadge: {
    backgroundColor: colors.confirmMemberCountBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  sectionCountText: {
    color: colors.confirmMemberCountText,
    fontWeight: '700',
  },
  memberAvatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  memberChip: {
    alignItems: 'center',
    width: 72,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  memberName: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inviteAvatar: {
    backgroundColor: colors.outlineButtonBorder,
  },
  inviteAvatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.outlineButtonText,
  },
  // Tips
  tipsSection: {
    backgroundColor: colors.confirmTipCardBackground,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.confirmTipCardBorder,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 14,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  tipNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.confirmTipNumberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipNumberText: {
    color: colors.confirmTipNumberText,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
});

export default SquadConfirmedView;
