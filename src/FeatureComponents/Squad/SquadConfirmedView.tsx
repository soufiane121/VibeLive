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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Success header */}
      <View style={styles.successHeader}>
        <View style={styles.checkCircle}>
          <CheckmarkIcon size={36} color={colors.confirmButton} />
        </View>
        <Text style={styles.title}>You're All Set</Text>
        <Text style={styles.subtitle}>
          Your squad is heading to
        </Text>
      </View>

      {/* Venue Card */}
      <View style={styles.venueCard}>
        <Text style={styles.venueName}>{venue.venue_name}</Text>

        {venue.confirmed_at && (
          <Text style={styles.confirmedAt}>
            Confirmed at{' '}
            {new Date(venue.confirmed_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}

        {/* Venue alert (VibeShift status change) */}
        {venueAlert && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>{venueAlert}</Text>
          </View>
        )}

        {/* Navigation Button */}
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={handleNavigate}
          activeOpacity={0.8}>
          <NavigateIcon size={20} color={colors.background} />
          <Text style={styles.navigateButtonText}>Get Directions</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.8}>
          <ShareIcon size={18} color={colors.primary} />
          <Text style={styles.shareButtonText}>Share with Others</Text>
        </TouchableOpacity>
      </View>

      {/* Squad Members Going */}
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>
          Who's going ({members.length})
        </Text>
        <View style={styles.memberAvatarRow}>
          {members.map(member => (
            <View key={member.member_id} style={styles.memberChip}>
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
              <Text style={styles.memberName} numberOfLines={1}>
                {member.display_name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Tips for tonight</Text>
        <TipItem text="Screenshot the venue name — signal can be spotty underground" />
        <TipItem text="Let one person be the point of contact for the group" />
        <TipItem text="Check back here for live venue updates" />
      </View>
    </ScrollView>
  );
};

// ── Tip Item ────────────────────────────────────────────────────────────────

const TipItem: React.FC<{text: string}> = ({text}) => (
  <View style={styles.tipRow}>
    <View style={styles.tipDot} />
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
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  // Success header
  successHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.confirmButton,
  },
  venueName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmedAt: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
  },
  alertBanner: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
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
  navigateButton: {
    backgroundColor: colors.confirmButton,
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
    color: colors.background,
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
    borderColor: colors.primary,
    width: '100%',
  },
  shareButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  memberAvatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberChip: {
    alignItems: 'center',
    width: 64,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
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
  // Tips
  tipsSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.textMuted,
    marginTop: 6,
    marginRight: 8,
  },
  tipText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    flex: 1,
  },
});

export default SquadConfirmedView;
