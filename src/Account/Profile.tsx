import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useAnalytics } from '../Hooks/useAnalytics';
import { GlobalColors } from '../styles/GlobalColors';
import { useGetAccountProfileQuery } from '../../features/settings/SettingsSliceApi';
import { useSingOutMutation } from '../../features/registrations/LoginSliceApi';
import { setCurrentUser } from '../../features/registrations/CurrentUser';
import { setLocalData } from '../Utils/LocalStorageHelper';

const colors = GlobalColors.Account;

// ---------- Minutes Gauge Component (View-based) ----------
const MinutesGauge = ({ minutes, size = 72 }: { minutes: number; size?: number }) => {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 4,
      borderColor: colors.gaugeActive,
      backgroundColor: colors.gaugeTrack,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={[styles.gaugeNumber, { fontSize: size * 0.3 }]}>{minutes}</Text>
      <Text style={[styles.gaugeLabel, { fontSize: size * 0.12 }]}>MINS</Text>
    </View>
  );
};

// ---------- Section Header ----------
const SectionHeader = ({ label }: { label: string }) => (
  <Text style={styles.sectionLabel}>{label}</Text>
);

// ---------- Menu Row ----------
interface MenuRowProps {
  icon: string;
  iconFamily?: 'ionicons' | 'material' | 'feather';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
  showChevron?: boolean;
  isDestructive?: boolean;
  iconBgColor?: string;
  iconColor?: string;
}

const MenuRow = ({
  icon,
  iconFamily = 'ionicons',
  title,
  subtitle,
  badge,
  badgeColor,
  onPress,
  showChevron = true,
  isDestructive = false,
  iconBgColor,
  iconColor,
}: MenuRowProps) => {
  const IconComponent = iconFamily === 'material' ? MaterialCommunityIcons :
    iconFamily === 'feather' ? Feather : Ionicons;

  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.menuIconBox, iconBgColor ? { backgroundColor: iconBgColor } : null]}>
        <IconComponent
          name={icon}
          size={20}
          color={isDestructive ? colors.destructiveText : (iconColor || colors.textSecondary)}
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, isDestructive && { color: colors.destructiveText }]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={[styles.badge, badgeColor ? { backgroundColor: badgeColor + '20', borderColor: badgeColor + '40' } : null]}>
          <Text style={[styles.badgeText, badgeColor ? { color: badgeColor } : null]}>{badge}</Text>
        </View>
      )}
      {showChevron && !isDestructive && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
};

// ---------- Main Account Hub ----------
const Profile = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  const userId = currentUser?._id;

  const { data: profileData, isLoading } = useGetAccountProfileQuery(userId, {
    skip: !userId,
  });
  const [signOut] = useSingOutMutation();

  const profile = profileData?.data;

  // Derived data
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'User';
  const username = profile?.userName || currentUser?.userName || 'user';
  const initials = (displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()).slice(0, 2);
  const joinDate = profile?.createdAt || currentUser?.createdAt;
  const joinLabel = joinDate
    ? `Joined ${new Date(joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : '';
  const minutes = profile?.streamingMinutes?.balance || 0;
  const interests = profile?.interests || [];

  // Stats
  const streamsCount = profile?.freeStreamingLimits?.weeklyStreamsUsed || 0;
  const hoursCount = Math.round((profile?.streamingMinutes?.totalUsed || 0) / 60);
  const referredCount = 0; // No referral system yet

  React.useEffect(() => {
    trackEvent('app_opened', {
      screen_name: 'AccountHub',
      user_id: userId,
    });
  }, []);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut({}).unwrap();
          } catch {}
          await setLocalData({ key: 'isAuthenticated', value: 'false' });
          await setLocalData({ key: 'token', value: '' });
          dispatch(setCurrentUser({
            _id: '', firstName: '', lastName: '', email: '', userName: '', password: '', createdAt: '',
            location: { type: 'Point', coordinates: [] },
          } as any));
        },
      },
    ]);
  };

  const handleHelpCenter = () => {
    Alert.alert(
      'Help Center',
      'Coming soon! For now, reach us by email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => Linking.openURL('mailto:support@vibelive.app'),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>MY ACCOUNT</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardRow}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>

            {/* User Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileUsername}>@{username}</Text>
              <Text style={styles.profileJoined}>{joinLabel}</Text>
            </View>

            {/* Minutes Gauge */}
            <MinutesGauge minutes={minutes} />
          </View>

          {/* Top Up Button */}
          <TouchableOpacity
            style={styles.topUpBtn}
            onPress={() => navigation.navigate('BuyMinutes')}
          >
            <Text style={styles.topUpText}>+ Top Up</Text>
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Feather name="tv" size={14} color={colors.textSecondary} style={{ marginBottom: 4 }} />
              <Text style={styles.statNumber}>{streamsCount}</Text>
              <Text style={styles.statLabel}>Streams</Text>
            </View>
            <View style={styles.statBox}>
              <Feather name="clock" size={14} color={colors.textSecondary} style={{ marginBottom: 4 }} />
              <Text style={styles.statNumber}>{hoursCount}</Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>
            <View style={styles.statBox}>
              <Feather name="users" size={14} color={colors.textSecondary} style={{ marginBottom: 4 }} />
              <Text style={styles.statNumber}>{referredCount}</Text>
              <Text style={styles.statLabel}>Referred</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Feather name="edit-2" size={16} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* My Interests */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <SectionHeader label="MY INTERESTS" />
            <TouchableOpacity onPress={() => navigation.navigate('MyInterests')}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.editLink}>Edit</Text>
                <Feather name="external-link" size={12} color={colors.accent} style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.chipRow}>
            {interests.length > 0 ? (
              interests.slice(0, 5).map((interest: string) => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>{interest}</Text>
                </View>
              ))
            ) : (
              <TouchableOpacity
                style={styles.addChip}
                onPress={() => navigation.navigate('MyInterests')}
              >
                <Text style={styles.addChipText}>+ Add</Text>
              </TouchableOpacity>
            )}
            {interests.length > 0 && (
              <TouchableOpacity
                style={styles.addChip}
                onPress={() => navigation.navigate('MyInterests')}
              >
                <Text style={styles.addChipText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Minutes & Billing Section */}
        <View style={styles.section}>
          <SectionHeader label="MINUTES & BILLING" />
          <View style={styles.menuCard}>
            <MenuRow
              icon="time-outline"
              title="Buy Minutes"
              subtitle={`${minutes} minutes remaining`}
              badge="Top Up"
              badgeColor={colors.gaugeActive}
              onPress={() => navigation.navigate('BuyMinutes')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="receipt-outline"
              title="Transaction History"
              subtitle="Purchases and stream usage"
              onPress={() => navigation.navigate('TransactionHistory')}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <SectionHeader label="ACCOUNT" />
          <View style={styles.menuCard}>
            <MenuRow
              icon="notifications-outline"
              title="Notifications"
              subtitle="Push and email alerts"
              onPress={() => navigation.navigate('NotificationSettings')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="gift-outline"
              title="Refer a Friend"
              subtitle="Earn 10 free minutes per invite"
              badge="+10 min"
              badgeColor={colors.success}
              onPress={() => Alert.alert('Refer a Friend', 'Coming soon!')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <SectionHeader label="SUPPORT" />
          <View style={styles.menuCard}>
            <MenuRow
              icon="help-circle-outline"
              title="Help Center"
              subtitle="FAQs and email support"
              onPress={handleHelpCenter}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="log-out-outline"
              title="Sign Out"
              onPress={handleSignOut}
              showChevron={false}
              isDestructive
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.sectionLabel,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scrollView: {
    flex: 1,
  },

  // Profile Card
  profileCard: {
    marginHorizontal: 16,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  profileCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.onlineGreen,
    borderWidth: 2.5,
    borderColor: colors.secondaryBackground,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  profileUsername: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  profileJoined: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  topUpBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: -20,
    marginBottom: 16,
  },
  topUpText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },

  // Gauge
  gaugeNumber: {
    fontWeight: '800',
    color: colors.gaugeActive,
  },
  gaugeLabel: {
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: -2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },

  // Edit Profile
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSubtle,
  },
  editProfileText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },

  // Sections
  section: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },

  // Interest Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.chipUnselectedBorder,
    backgroundColor: colors.chipUnselected,
  },
  interestChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.chipUnselectedText,
  },
  addChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Menu Card
  menuCard: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.badgeBackground,
    borderWidth: 1,
    borderColor: colors.badgeBorder,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.badgeText,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.separator,
    marginLeft: 64,
  },
});