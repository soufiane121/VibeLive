import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { ChevronBackIcon, ChevronForwardIcon } from '../UIComponents/Icons';
import { useAnalytics } from '../Hooks/useAnalytics';
import { GlobalColors } from '../styles/GlobalColors';
import useTranslation from '../Hooks/useTranslation';

interface SettingsItemProps {
  icon: string;
  iconType?: 'ionicons' | 'material';
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  isHighlighted?: boolean;
}

const Settings = () => {
  const navigation = useNavigation();
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();
  const { currentUser } = useSelector((state: any) => state?.currentUser);

  React.useEffect(() => {
    trackEvent('app_opened', {
      screen_name: 'Settings',
      user_id: currentUser?._id,
    });
  }, []);

  const handleBoostSettings = () => {
    trackEvent('settings_boost_pressed', {
      user_id: currentUser?._id,
    });
    Alert.alert(t('settings.sections.boost.title'), t('common.comingSoon'));
  };

  const handleProfileAccount = () => {
    trackEvent('settings_profile_pressed', {
      user_id: currentUser?._id,
    });
    navigation.navigate('Profile' as never);
  };

  const handleNotifications = () => {
    trackEvent('settings_notifications_pressed', {
      user_id: currentUser?._id,
    });
    navigation.navigate('NotificationSettings' as never);
  };

  const handleEmail = () => {
    trackEvent('settings_email_pressed', {
      user_id: currentUser?._id,
    });
    navigation.navigate('EmailSettings' as never);
  };

  const handlePassword = () => {
    trackEvent('settings_password_pressed', {
      user_id: currentUser?._id,
    });
    navigation.navigate('PasswordSettings' as never);
  };

  const handleStreamingPreferences = () => {
    trackEvent('settings_streaming_pressed', {
      user_id: currentUser?._id,
    });
    navigation.navigate('StreamingPreferences' as never);
  };

  const handleVotingPreferences = () => {
    trackEvent('settings_voting_preferences_pressed', {
      user_id: currentUser?._id,
    });
    navigation.navigate('VotingPreferences' as never);
  };

  const handlePrivacySecurity = () => {
    trackEvent('settings_privacy_pressed', {
      user_id: currentUser?._id,
    });
    navigation.navigate('PrivacySettings' as never);
  };

  const handleBlockList = () => {
    trackEvent('settings_block_list_pressed', {
      user_id: currentUser?._id,
    });
    navigation.navigate('BlockedUsers' as never);
  };

  const handleCommenting = () => {
    trackEvent('settings_commenting_pressed', {
      user_id: currentUser?._id,
    });
    Alert.alert(t('settings.sections.commenting.title'), t('common.comingSoon'));
  };

  const handleDownloadData = () => {
    trackEvent('settings_download_data_pressed', {
      user_id: currentUser?._id,
    });
    Alert.alert(t('settings.sections.downloadData.title'), t('common.comingSoon'));
  };

  const SettingsItem: React.FC<SettingsItemProps> = ({
    icon,
    iconType = 'ionicons',
    title,
    subtitle,
    onPress,
    showChevron = true,
    isHighlighted = false,
  }) => (
    <TouchableOpacity
      style={[styles.settingsItem, isHighlighted && styles.highlightedItem]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, isHighlighted && styles.highlightedIconContainer]}>
          {iconType === 'material' ? (
            <ChevronForwardIcon size={20} color={isHighlighted ? '#8b5cf6' : '#fff'} />
          ) : (
            <ChevronForwardIcon size={20} color={isHighlighted ? '#8b5cf6' : '#fff'} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.settingsTitle, isHighlighted && styles.highlightedTitle]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingsSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showChevron && (
        <ChevronForwardIcon size={20} color="#6b7280" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronBackIcon size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Boost Settings - Highlighted */}
        <SettingsItem
          icon="trending-up"
          title={t('settings.sections.boost.title')}
          subtitle={t('settings.sections.boost.subtitle')}
          onPress={handleBoostSettings}
          isHighlighted={true}
        />

        {/* Account Section */}
        <SettingsItem
          icon="person-outline"
          title={t('settings.sections.profile.title')}
          onPress={handleProfileAccount}
        />

        <SettingsItem
          icon="notifications-outline"
          title={t('settings.sections.notifications.title')}
          onPress={handleNotifications}
        />

        <SettingsItem
          icon="mail-outline"
          title={t('settings.sections.email.title')}
          onPress={handleEmail}
        />

        <SettingsItem
          icon="lock-closed-outline"
          title={t('settings.sections.password.title')}
          onPress={handlePassword}
        />

        {/* Streaming Section */}
        <SettingsItem
          icon="videocam-outline"
          title={t('settings.sections.streaming.title')}
          onPress={handleStreamingPreferences}
        />

        {/* Voting Section */}
        <SettingsItem
          icon="flame-outline"
          title={t('settings.sections.voting.title')}
          subtitle={
            currentUser?.votingPreferences?.permanentOptOut
              ? t('settings.sections.voting.optedOut')
              : currentUser?.votingPreferences?.enabled === false
              ? t('settings.sections.voting.disabled')
              : t('settings.sections.voting.enabled')
          }
          onPress={handleVotingPreferences}
        />

        {/* Privacy Section */}
        <SettingsItem
          icon="shield-checkmark-outline"
          title={t('settings.sections.privacy.title')}
          onPress={handlePrivacySecurity}
        />

        <SettingsItem
          icon="ban-outline"
          title={t('settings.sections.blockedUsers.title')}
          onPress={handleBlockList}
        />

        <SettingsItem
          icon="chatbubble-outline"
          title={t('settings.sections.commenting.title')}
          onPress={handleCommenting}
        />

        {/* Data Section */}
        <SettingsItem
          icon="download-outline"
          title={t('settings.sections.downloadData.title')}
          onPress={handleDownloadData}
        />

        {/* Testing Section (Dev Only) */}
        {__DEV__ && (
          <SettingsItem
            icon="location-outline"
            title="Location Simulator Test"
            subtitle="Test background location tracking"
            onPress={() => (navigation as any).navigate('LocationSimulatorTest')}
          />
        )}

        {/* User Info Display */}
        {currentUser?._id && (
          <View style={styles.userInfoSection}>
            <Text style={styles.userInfoTitle}>{t('settings.accountInfo.title')}</Text>
            <Text style={styles.userInfoText}>
              {t('settings.accountInfo.name')}: {currentUser.firstName} {currentUser.lastName}
            </Text>
            <Text style={styles.userInfoText}>
              {t('settings.accountInfo.username')}: @{currentUser.userName}
            </Text>
            <Text style={styles.userInfoText}>
              {t('settings.accountInfo.email')}: {currentUser.email} {currentUser.accountSettings?.emailVerified ? t('common.verifiedCheck') : t('common.notVerifiedWarning')}
            </Text>
            <Text style={styles.userInfoText}>
              {t('settings.accountInfo.memberSince')}: {new Date(currentUser.createdAt).toLocaleDateString()}
            </Text>
            {currentUser.followers && (
              <Text style={styles.userInfoText}>
                {t('settings.accountInfo.followers')}: {currentUser.followers.length} | {t('settings.accountInfo.following')}: {currentUser.following?.length || 0}
              </Text>
            )}
            {currentUser.bio && (
              <Text style={styles.userInfoText}>
                {t('settings.accountInfo.bio')}: {currentUser.bio}
              </Text>
            )}
            <Text style={styles.userInfoText}>
              {t('settings.accountInfo.profile')}: {currentUser.privacySettings?.profileVisibility || t('common.public')}
            </Text>
            <Text style={styles.userInfoText}>
              {t('settings.accountInfo.twoFA')}: {currentUser.accountSettings?.twoFactorEnabled ? t('common.enabled') + ' ' + t('common.verifiedCheck') : t('common.disabled') + ' ' + t('common.notVerifiedWarning')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;

const colors = GlobalColors.Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 34, // Same width as back button for centering
  },
  scrollView: {
    flex: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  highlightedItem: {
    backgroundColor: colors.sectionBackground,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.itemBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  highlightedIconContainer: {
    backgroundColor: colors.boostHighlight,
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  highlightedTitle: {
    color: colors.boostHighlight,
    fontWeight: '600',
  },
  settingsSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  userInfoSection: {
    margin: 20,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  userInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
});