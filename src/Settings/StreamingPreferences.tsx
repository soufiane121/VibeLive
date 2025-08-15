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
import { ChevronBackIcon, ChevronForwardIcon, VideocamIcon, SettingsIcon, RecordingIcon, BulbIcon } from '../UIComponents/Icons';

// Helper function to map icon names to centralized icon components
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'videocam':
      return VideocamIcon;
    case 'settings':
      return SettingsIcon;
    case 'recording':
      return RecordingIcon;
    default:
      return SettingsIcon; // fallback
  }
};
import { useAnalytics } from '../Hooks/useAnalytics';
import {
  useGetUserSettingsQuery,
  useUpdateStreamingPreferencesMutation,
  StreamingPreferences as StreamingPreferencesType,
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
  onSelect: () => void;
  icon: string;
}

const StreamingPreferences = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  
  const [settings, setSettings] = useState<StreamingPreferencesType>({
    defaultCategory: 'other',
    autoRecord: false,
    chatModeration: 'open',
    qualityPreference: 'auto',
  });
  
  const {data: userSettings, isLoading: settingsLoading} = useGetUserSettingsQuery();
  const [updateStreamingPreferences, {isLoading: updateLoading}] = useUpdateStreamingPreferencesMutation();

  useEffect(() => {
    trackEvent('streaming_preferences_opened', {
      screen_name: 'StreamingPreferences',
      user_id: currentUser?._id,
    });
  }, []);

  const categories = [
    { label: 'Music', value: 'music', icon: 'musical-notes' },
    { label: 'Gaming', value: 'gaming', icon: 'game-controller' },
    { label: 'Talk Show', value: 'talk', icon: 'chatbubbles' },
    { label: 'Sports', value: 'sports', icon: 'football' },
    { label: 'Art', value: 'art', icon: 'brush' },
    { label: 'Food', value: 'food', icon: 'restaurant' },
    { label: 'Travel', value: 'travel', icon: 'airplane' },
    { label: 'Other', value: 'other', icon: 'ellipsis-horizontal' },
  ];

  const qualityOptions = [
    { label: 'Auto (Recommended)', value: 'auto', description: 'Automatically adjust based on connection' },
    { label: 'High Quality', value: 'high', description: '1080p - Best quality, uses more data' },
    { label: 'Medium Quality', value: 'medium', description: '720p - Good balance of quality and data' },
    { label: 'Low Quality', value: 'low', description: '480p - Uses less data' },
  ];

  const moderationOptions = [
    { label: 'Open Chat', value: 'open', description: 'Anyone can comment' },
    { label: 'Followers Only', value: 'followers', description: 'Only followers can comment' },
    { label: 'Disabled', value: 'disabled', description: 'No comments allowed' },
  ];

  useEffect(() => {
    if (userSettings?.streamingPreferences) {
      setSettings({
        defaultCategory: userSettings.streamingPreferences.defaultCategory,
        autoRecord: userSettings.streamingPreferences.autoRecord,
        chatModeration: userSettings.streamingPreferences.chatModeration,
        qualityPreference: userSettings.streamingPreferences.qualityPreference,
      });
    } else if (currentUser?.streamingPreferences) {
      setSettings({
        defaultCategory: currentUser.streamingPreferences.defaultCategory,
        autoRecord: currentUser.streamingPreferences.autoRecord,
        chatModeration: currentUser.streamingPreferences.chatModeration,
        qualityPreference: currentUser.streamingPreferences.qualityPreference,
      });
    }
  }, [userSettings, currentUser]);

  const handleUpdate = async (key: keyof StreamingPreferencesType, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const handleSave = async () => {
    trackEvent('streaming_preferences_save', {
      user_id: currentUser?._id,
      settings: settings,
    });

    try {
      const response = await updateStreamingPreferences(settings).unwrap();
      
      if (response.success) {
        // Update Redux store
        const updatedUser = {
          ...currentUser,
          streamingPreferences: settings,
        };
        dispatch(setCurrentUser(updatedUser));
        
        Alert.alert('Success', 'Streaming preferences updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating streaming preferences:', error);
      Alert.alert('Error', 'Failed to update streaming preferences');
    }
  };

  const showCategoryOptions = () => {
    Alert.alert(
      'Default Category',
      'Choose your default streaming category',
      [
        ...categories.map(category => ({
          text: category.label,
          onPress: () => handleUpdate('defaultCategory', category.value),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const showQualityOptions = () => {
    Alert.alert(
      'Video Quality',
      'Choose your preferred streaming quality',
      [
        ...qualityOptions.map(option => ({
          text: `${option.label} - ${option.description}`,
          onPress: () => handleUpdate('qualityPreference', option.value),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const showModerationOptions = () => {
    Alert.alert(
      'Chat Moderation',
      'Choose who can comment on your streams',
      [
        ...moderationOptions.map(option => ({
          text: `${option.label} - ${option.description}`,
          onPress: () => handleUpdate('chatModeration', option.value),
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

  const getCategoryLabel = (value: string) => {
    const category = categories.find(cat => cat.value === value);
    return category ? category.label : 'Other';
  };

  const getQualityLabel = (value: string) => {
    const quality = qualityOptions.find(opt => opt.value === value);
    return quality ? quality.label : 'Auto';
  };

  const getModerationLabel = (value: string) => {
    const moderation = moderationOptions.find(opt => opt.value === value);
    return moderation ? moderation.label : 'Open Chat';
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
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stream Settings</Text>
          <Text style={styles.sectionDescription}>
            Configure your default streaming preferences
          </Text>
        </View>

        <SettingPicker
          icon="grid"
          title="Default Category"
          subtitle="Your preferred streaming category"
          value={getCategoryLabel(settings.defaultCategory)}
          onSelect={showCategoryOptions}
        />

        <SettingPicker
          icon="videocam"
          title="Video Quality"
          subtitle="Streaming quality preference"
          value={getQualityLabel(settings.qualityPreference)}
          onSelect={showQualityOptions}
        />

        <SettingToggle
          icon="recording"
          title="Auto Record"
          subtitle="Automatically save your streams"
          value={settings.autoRecord}
          onToggle={(value) => handleUpdate('autoRecord', value)}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chat & Interaction</Text>
          <Text style={styles.sectionDescription}>
            Manage how viewers can interact with your streams
          </Text>
        </View>

        <SettingPicker
          icon="chatbubbles"
          title="Chat Moderation"
          subtitle="Who can comment on your streams"
          value={getModerationLabel(settings.chatModeration)}
          onSelect={showModerationOptions}
        />

        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <BulbIcon size={24} color="#8b5cf6" />
            <Text style={styles.tipsTitle}>Streaming Tips</Text>
          </View>
          <Text style={styles.tipsText}>
            • Choose 'Auto' quality for the best viewer experience{'\n'}
            • Enable auto-record to save your best moments{'\n'}
            • Use follower-only chat to reduce spam{'\n'}
            • Pick a category that matches your content for better discovery
          </Text>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Your Streaming Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Streams</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Hours Streamed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Peak Viewers</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StreamingPreferences;

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
  tipsSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  tipsText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
  statsSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
