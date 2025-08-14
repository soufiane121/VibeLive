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
    // Navigate to boost settings or show boost flow
    Alert.alert('Boost Settings', 'Configure your stream boost preferences');
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
    Alert.alert('Commenting', 'Configure comment settings');
  };

  const handleDownloadData = () => {
    trackEvent('settings_download_data_pressed', {
      user_id: currentUser?._id,
    });
    Alert.alert('Download Data', 'Request your data download');
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Boost Settings - Highlighted */}
        <SettingsItem
          icon="trending-up"
          title="Boost Your Reach"
          subtitle="with Recommended Settings"
          onPress={handleBoostSettings}
          isHighlighted={true}
        />

        {/* Account Section */}
        <SettingsItem
          icon="person-outline"
          title="Profile & Account"
          onPress={handleProfileAccount}
        />

        <SettingsItem
          icon="notifications-outline"
          title="Notifications"
          onPress={handleNotifications}
        />

        <SettingsItem
          icon="mail-outline"
          title="Email"
          onPress={handleEmail}
        />

        <SettingsItem
          icon="lock-closed-outline"
          title="Password"
          onPress={handlePassword}
        />

        {/* Streaming Section */}
        <SettingsItem
          icon="videocam-outline"
          title="Streaming Preferences"
          onPress={handleStreamingPreferences}
        />

        {/* Privacy Section */}
        <SettingsItem
          icon="shield-checkmark-outline"
          title="Privacy & Security"
          onPress={handlePrivacySecurity}
        />

        <SettingsItem
          icon="ban-outline"
          title="Block List"
          onPress={handleBlockList}
        />

        <SettingsItem
          icon="chatbubble-outline"
          title="Commenting"
          onPress={handleCommenting}
        />

        {/* Data Section */}
        <SettingsItem
          icon="download-outline"
          title="Download Data"
          onPress={handleDownloadData}
        />

        {/* User Info Display */}
        {currentUser?._id && (
          <View style={styles.userInfoSection}>
            <Text style={styles.userInfoTitle}>Account Information</Text>
            <Text style={styles.userInfoText}>
              Name: {currentUser.firstName} {currentUser.lastName}
            </Text>
            <Text style={styles.userInfoText}>
              Username: @{currentUser.userName}
            </Text>
            <Text style={styles.userInfoText}>
              Email: {currentUser.email} {currentUser.accountSettings?.emailVerified ? '✓' : '⚠️'}
            </Text>
            <Text style={styles.userInfoText}>
              Member since: {new Date(currentUser.createdAt).toLocaleDateString()}
            </Text>
            {currentUser.followers && (
              <Text style={styles.userInfoText}>
                Followers: {currentUser.followers.length} | Following: {currentUser.following?.length || 0}
              </Text>
            )}
            {currentUser.bio && (
              <Text style={styles.userInfoText}>
                Bio: {currentUser.bio}
              </Text>
            )}
            <Text style={styles.userInfoText}>
              Profile: {currentUser.privacySettings?.profileVisibility || 'Public'}
            </Text>
            <Text style={styles.userInfoText}>
              2FA: {currentUser.accountSettings?.twoFactorEnabled ? 'Enabled ✓' : 'Disabled ⚠️'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    borderBottomColor: '#1f2937',
  },
  highlightedItem: {
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  highlightedIconContainer: {
    backgroundColor: '#8b5cf6',
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  highlightedTitle: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  userInfoSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  userInfoText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
});