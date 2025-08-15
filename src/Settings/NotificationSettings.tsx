import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { setCurrentUser } from '../../features/registrations/CurrentUser';
import { ChevronBackIcon, NotificationsIcon, MailIcon, RadioIcon, PersonAddIcon, ChatbubbleIcon, InformationCircleIcon } from '../UIComponents/Icons';
// import Ionicons from 'react-native-vector-icons/Ionicons';
import useAnalytics from '../Hooks/useAnalytics';
import {
  useGetUserSettingsQuery,
  useUpdateNotificationSettingsMutation,
  NotificationSettings as NotificationSettingsType,
} from '../../features/settings/SettingsSliceApi';

// Helper function to get centralized icon component
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    'notifications': NotificationsIcon,
    'radio': RadioIcon,
    'person-add': PersonAddIcon,
    'chatbubble': ChatbubbleIcon,
    'mail': MailIcon,
  };
  
  return iconMap[iconName] || NotificationsIcon; // fallback to NotificationsIcon
};

interface SettingToggleProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  icon: string;
  loading?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({ 
  icon, 
  title, 
  subtitle, 
  value, 
  onToggle, 
  loading = false 
}) => (
  <View style={styles.settingItem}>
    <View style={styles.settingLeft}>
      <View style={styles.iconContainer}>
        {React.createElement(getIconComponent(icon), { 
          name: ['notifications', 'mail'].includes(icon) ? undefined : icon, 
          size: 20, 
          color: "#fff" 
        })}
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
      disabled={loading}
    />
  </View>
);

const NotificationSettings = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { currentUser } = useSelector((state: RootState) => state.currentUser);

  const { data: userSettings, isLoading: settingsLoading } = useGetUserSettingsQuery();
  const [updateNotificationSettings, { isLoading: updateLoading }] = useUpdateNotificationSettingsMutation();

  const [settings, setSettings] = useState({
    pushNotifications: currentUser?.notificationSettings?.pushNotifications ?? true,
    emailNotifications: currentUser?.notificationSettings?.emailNotifications ?? true,
    liveStreamAlerts: currentUser?.notificationSettings?.liveStreamAlerts ?? true,
    followNotifications: currentUser?.notificationSettings?.followNotifications ?? true,
    commentNotifications: currentUser?.notificationSettings?.commentNotifications ?? true,
  });

  useEffect(() => {
    trackEvent('notification_settings_opened', {
      screen_name: 'NotificationSettings',
      user_id: currentUser?._id,
    });

    if (userSettings?.notificationSettings) {
      setSettings({
        pushNotifications: userSettings.notificationSettings.pushNotifications,
        emailNotifications: userSettings.notificationSettings.emailNotifications,
        liveStreamAlerts: userSettings.notificationSettings.liveStreamAlerts,
        followNotifications: userSettings.notificationSettings.followNotifications,
        commentNotifications: userSettings.notificationSettings.commentNotifications,
      });
    } else if (currentUser?.notificationSettings) {
      setSettings({
        pushNotifications: currentUser.notificationSettings.pushNotifications,
        emailNotifications: currentUser.notificationSettings.emailNotifications,
        liveStreamAlerts: currentUser.notificationSettings.liveStreamAlerts,
        followNotifications: currentUser.notificationSettings.followNotifications,
        commentNotifications: currentUser.notificationSettings.commentNotifications,
      });
    }
  }, [userSettings, currentUser]);

  const handleToggle = async (key: keyof NotificationSettingsType, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    trackEvent('notification_setting_changed', {
      setting: key,
      value,
      user_id: currentUser?._id,
    });
  };

  const handleSave = async () => {
    trackEvent('notification_settings_save', {
      user_id: currentUser?._id,
      settings: settings,
    });

    try {
      const response = await updateNotificationSettings(settings).unwrap();

      if (response.success) {
        // Update Redux store
        const updatedUser = {
          ...currentUser,
          notificationSettings: settings,
        };
        dispatch(setCurrentUser(updatedUser));

        Alert.alert('Success', 'Notification settings updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ChevronBackIcon size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (updateLoading || settingsLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={updateLoading || settingsLoading}>
          {updateLoading || settingsLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <Text style={styles.sectionDescription}>
            Manage how you receive notifications on your device
          </Text>
        </View>

        <SettingToggle
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Receive notifications on your device"
          value={settings.pushNotifications}
          onToggle={value => handleToggle('pushNotifications', value)}
          loading={updateLoading || settingsLoading}
        />

        <SettingToggle
          icon="radio-outline"
          title="Live Stream Alerts"
          subtitle="Get notified when streamers you follow go live"
          value={settings.liveStreamAlerts}
          onToggle={value => handleToggle('liveStreamAlerts', value)}
          loading={updateLoading || settingsLoading}
        />

        <SettingToggle
          icon="person-add-outline"
          title="Follow Notifications"
          subtitle="Get notified when someone follows you"
          value={settings.followNotifications}
          onToggle={value => handleToggle('followNotifications', value)}
          loading={updateLoading || settingsLoading}
        />

        <SettingToggle
          icon="chatbubble-outline"
          title="Comment Notifications"
          subtitle="Get notified about comments on your streams"
          value={settings.commentNotifications}
          onToggle={value => handleToggle('commentNotifications', value)}
          loading={updateLoading || settingsLoading}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>
          <Text style={styles.sectionDescription}>
            Receive important updates via email
          </Text>
        </View>

        <SettingToggle
          icon="mail-outline"
          title="Email Notifications"
          subtitle="Receive notifications via email"
          value={settings.emailNotifications}
          onToggle={value => handleToggle('emailNotifications', value)}
          loading={updateLoading || settingsLoading}
        />

        <View style={styles.infoSection}>
          <InformationCircleIcon size={20} color="#8b5cf6" />
          <Text style={styles.infoText}>
            You can always change these settings later. Some notifications may
            still be sent for security and account-related updates.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettings;

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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#374151',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 15,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});
