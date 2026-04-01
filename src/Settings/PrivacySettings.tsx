import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { ChevronBackIcon, ChevronForwardIcon, ShieldCheckmarkIcon, BanIcon } from '../UIComponents/Icons';

// Helper function to map icon names to centralized icon components
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'shield-checkmark':
      return ShieldCheckmarkIcon;
    case 'ban':
      return BanIcon;
    default:
      return ShieldCheckmarkIcon; // fallback
  }
};
import { useAnalytics } from '../Hooks/useAnalytics';
import {
  useGetUserSettingsQuery,
  useUpdatePrivacySettingsMutation,
  PrivacySettings as PrivacySettingsType,
} from '../../features/settings/SettingsSliceApi';
import { setCurrentUser } from '../../features/registrations/CurrentUser';

interface SettingToggleProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  icon: string;
}

interface SettingPickerProps {
  title: string;
  subtitle?: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  icon: string;
}

const PrivacySettings = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  
  const [settings, setSettings] = useState<PrivacySettingsType>({
    profileVisibility: 'public',
    locationSharing: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
  });
  
  const {data: userSettings, isLoading: settingsLoading} = useGetUserSettingsQuery();
  const [updatePrivacySettings, {isLoading: updateLoading}] = useUpdatePrivacySettingsMutation();

  useEffect(() => {
    trackEvent('app_opened', {
      screen_name: 'PrivacySettings',
      user_id: currentUser?._id,
    });

    if (userSettings?.privacySettings) {
      setSettings({
        profileVisibility: userSettings.privacySettings.profileVisibility,
        locationSharing: userSettings.privacySettings.locationSharing,
        showOnlineStatus: userSettings.privacySettings.showOnlineStatus,
        allowDirectMessages: userSettings.privacySettings.allowDirectMessages,
      });
    } else if (currentUser?.privacySettings) {
      setSettings({
        profileVisibility: currentUser.privacySettings.profileVisibility,
        locationSharing: currentUser.privacySettings.locationSharing,
        showOnlineStatus: currentUser.privacySettings.showOnlineStatus,
        allowDirectMessages: currentUser.privacySettings.allowDirectMessages,
      });
    }
  }, [userSettings, currentUser]);

  const handleToggle = async (key: keyof PrivacySettingsType, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    trackEvent('privacy_setting_changed', {
      setting: key,
      value,
      user_id: currentUser?._id,
    });
  };

  const handleSave = async () => {
    trackEvent('privacy_settings_save', {
      user_id: currentUser?._id,
      settings: settings,
    });

    try {
      const response = await updatePrivacySettings(settings).unwrap();
      
      if (response.success) {
        // Update Redux store
        const updatedUser = {
          ...currentUser,
          privacySettings: settings,
        };
        dispatch(setCurrentUser(updatedUser));
        
        Alert.alert('Success', 'Privacy settings updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  };

  const showVisibilityOptions = () => {
    const options = [
      { label: 'Public', value: 'public', description: 'Anyone can see your profile' },
      { label: 'Friends Only', value: 'friends', description: 'Only people you follow can see your profile' },
      { label: 'Private', value: 'private', description: 'Only you can see your profile' },
    ];

    Alert.alert(
      'Profile Visibility',
      'Choose who can see your profile',
      [
        ...options.map(option => ({
          text: `${option.label} - ${option.description}`,
          onPress: () => handleToggle('profileVisibility', option.value),
          style: settings.profileVisibility === option.value ? 'default' : 'default',
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const SettingToggle: React.FC<SettingToggleProps> = ({
    title,
    subtitle,
    value,
    onToggle,
    icon,
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          {React.createElement(getIconComponent(icon), { size: 20, color: "#fff" })}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#374151', true: '#8b5cf6' }}
        thumbColor={value ? '#fff' : '#9ca3af'}
        disabled={updateLoading || settingsLoading}
      />
    </View>
  );

  const SettingPicker: React.FC<SettingPickerProps> = ({
    title,
    subtitle,
    value,
    onSelect,
    icon,
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onSelect}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          {React.createElement(getIconComponent(icon), { size: 20, color: "#fff" })}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
        <ChevronForwardIcon size={20} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );

  const getVisibilityLabel = (value: string) => {
    switch (value) {
      case 'public': return 'Public';
      case 'friends': return 'Friends Only';
      case 'private': return 'Private';
      default: return 'Public';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.saveButton, (updateLoading || settingsLoading) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={updateLoading || settingsLoading}
        >
          {(updateLoading || settingsLoading) ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Privacy</Text>
          <Text style={styles.sectionDescription}>
            Control who can see your profile and content
          </Text>
        </View>

        <SettingPicker
          icon="eye"
          title="Profile Visibility"
          subtitle="Who can see your profile"
          value={getVisibilityLabel(settings.profileVisibility)}
          options={[]}
          onSelect={showVisibilityOptions}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Activity</Text>
          <Text style={styles.sectionDescription}>
            Manage your location and online status visibility
          </Text>
        </View>

        <SettingToggle
          icon="location"
          title="Location Sharing"
          subtitle="Share your location with other users"
          value={settings.locationSharing}
          onToggle={(value) => handleToggle('locationSharing', value)}
        />

        <SettingToggle
          icon="radio-button-on"
          title="Show Online Status"
          subtitle="Let others see when you're online"
          value={settings.showOnlineStatus}
          onToggle={(value) => handleToggle('showOnlineStatus', value)}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication</Text>
          <Text style={styles.sectionDescription}>
            Control how others can interact with you
          </Text>
        </View>

        <SettingToggle
          icon="chatbubble"
          title="Direct Messages"
          subtitle="Allow others to send you direct messages"
          value={settings.allowDirectMessages}
          onToggle={(value) => handleToggle('allowDirectMessages', value)}
        />

        <View style={styles.securitySection}>
          <View style={styles.securityHeader}>
            <ShieldCheckmarkIcon size={24} color="#8b5cf6" />
            <Text style={styles.securityTitle}>Security Tips</Text>
          </View>
          <Text style={styles.securityText}>
            • Keep your profile private if you want more control over who sees your content{'\n'}
            • Turn off location sharing if you don't want others to know where you are{'\n'}
            • Disable direct messages if you're receiving unwanted messages{'\n'}
            • Review your blocked users list regularly
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.blockedUsersButton}
          onPress={() => navigation.navigate('BlockedUsers' as never)}
        >
          <View style={styles.buttonLeft}>
            <View style={styles.iconContainer}>
              <BanIcon size={20} color="#fff" />
            </View>
            <Text style={styles.buttonText}>Manage Blocked Users</Text>
          </View>
          <ChevronForwardIcon size={20} color="#6b7280" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacySettings;

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
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  settingLeft: {
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
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    color: '#8b5cf6',
    marginRight: 8,
    fontWeight: '500',
  },
  securitySection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  securityText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
  blockedUsersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  buttonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
