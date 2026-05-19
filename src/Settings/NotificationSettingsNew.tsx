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
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GlobalColors } from '../styles/GlobalColors';
import { useAnalytics } from '../Hooks/useAnalytics';
import useTranslation from '../Hooks/useTranslation';
import {
  useGetUserSettingsQuery,
  useUpdateNotificationSettingsMutation,
} from '../../features/settings/SettingsSliceApi';

const colors = GlobalColors.Account;

const NotificationSettingsNew = () => {
  const navigation = useNavigation<any>();
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  const userId = currentUser?._id;

  const { data: settingsData } = useGetUserSettingsQuery(userId, { skip: !userId });
  const [updateNotifications] = useUpdateNotificationSettingsMutation();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    if (settingsData?.data) {
      const notifSettings = settingsData.data.notificationSettings;
      setPushEnabled(notifSettings?.pushNotifications ?? true);
      setEmailEnabled(notifSettings?.emailNotifications ?? false);
    }
  }, [settingsData]);

  useEffect(() => {
    trackEvent('app_opened', {
      screen_name: 'NotificationSettingsNew',
      user_id: userId,
    });
  }, []);

  const handleToggle = async (type: 'push' | 'email', value: boolean) => {
    if (type === 'push') setPushEnabled(value);
    else setEmailEnabled(value);

    try {
      await updateNotifications({
        userId,
        settings: {
          pushNotifications: type === 'push' ? value : pushEnabled,
          emailNotifications: type === 'email' ? value : emailEnabled,
          // include existing fallback defaults since backend expects full object
          liveStreamAlerts: true,
          followNotifications: true,
          commentNotifications: true,
        }
      }).unwrap();
    } catch (e) {
      // Revert on error
      if (type === 'push') setPushEnabled(!value);
      else setEmailEnabled(!value);
      Alert.alert(t('common.error'), t('notifications.updateFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerLabel}>{t('settingsScreen.alerts')}</Text>
            <Text style={styles.headerTitle}>{t('settingsScreen.notifications')}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Notification Channels */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settingsScreen.notificationChannels')}</Text>
          <View style={styles.menuCard}>
            {/* Push Notifications */}
            <View style={styles.menuRow}>
              <View style={styles.menuIconBox}>
                <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{t('settingsScreen.pushNotifications')}</Text>
                <Text style={styles.menuSubtitle}>{t('settingsScreen.pushNotificationsDesc')}</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={(v) => handleToggle('push', v)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
              />
            </View>

            <View style={styles.menuDivider} />

            {/* Email Notifications */}
            <View style={styles.menuRow}>
              <View style={styles.menuIconBox}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{t('settingsScreen.emailNotifications')}</Text>
                <Text style={styles.menuSubtitle}>{t('settingsScreen.emailNotificationsDesc')}</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={(v) => handleToggle('email', v)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettingsNew;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
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
  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
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
  menuDivider: {
    height: 1,
    backgroundColor: colors.separator,
    marginLeft: 64,
  },
});
