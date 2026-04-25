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
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { GlobalColors } from '../styles/GlobalColors';
import { useAnalytics } from '../Hooks/useAnalytics';
import useTranslation from '../Hooks/useTranslation';
import { useSingOutMutation } from '../../features/registrations/LoginSliceApi';
import { setCurrentUser } from '../../features/registrations/CurrentUser';
import { setLocalData, getLocalData } from '../Utils/LocalStorageHelper';

const colors = GlobalColors.Account;

// ---------- Section Header ----------
const SectionLabel = ({ label }: { label: string }) => (
  <Text style={styles.sectionLabel}>{label}</Text>
);

// ---------- Menu Row ----------
interface MenuRowProps {
  icon: string;
  iconFamily?: 'ionicons' | 'feather';
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isDestructive?: boolean;
  rightComponent?: React.ReactNode;
  iconColor?: string;
}

const MenuRow = ({
  icon,
  iconFamily = 'ionicons',
  title,
  subtitle,
  onPress,
  showChevron = true,
  isDestructive = false,
  rightComponent,
  iconColor,
}: MenuRowProps) => {
  const IconComponent = iconFamily === 'feather' ? Feather : Ionicons;

  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress && !rightComponent}
    >
      <View style={[styles.menuIconBox, isDestructive && styles.menuIconBoxDestructive]}>
        <IconComponent
          name={icon}
          size={18}
          color={isDestructive ? colors.destructiveText : (iconColor || colors.textSecondary)}
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, isDestructive && { color: colors.destructiveText }]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent}
      {showChevron && !rightComponent && !isDestructive && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
};

// ---------- Settings Screen ----------
const Settings = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const { currentUser } = useSelector((state: any) => state?.currentUser);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [signOut] = useSingOutMutation();

  useEffect(() => {
    trackEvent('app_opened', {
      screen_name: 'SettingsNew',
      user_id: currentUser?._id,
    });
    // Check dark mode state
    (async () => {
      const mode = await getLocalData({ key: 'isDarkMode' });
      setIsDarkMode(mode === 'true' || mode === null);
    })();
  }, []);

  const handleDarkModeToggle = async (value: boolean) => {
    setIsDarkMode(value);
    await setLocalData({ key: 'isDarkMode', value: value ? 'true' : 'false' });
    // In practice, the user needs to restart the app for the theme to apply
  };

  const handleLanguagePress = () => {
    Alert.alert(
      t('settingsScreen.languageTitle'),
      t('settingsScreen.languageDesc'),
      [
        {
          text: 'English',
          onPress: () => changeLanguage('en'),
          style: currentLanguage === 'en' ? 'cancel' : 'default',
        },
        {
          text: 'Español',
          onPress: () => changeLanguage('es'),
          style: currentLanguage === 'es' ? 'cancel' : 'default',
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      t('settingsScreen.signOut'),
      t('settingsScreen.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settingsScreen.signOut'),
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
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settingsScreen.deleteAccount'),
      t('settingsScreen.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('settingsScreen.deleteAccount'), t('settingsScreen.deleteAccountComingSoon'));
          },
        },
      ],
    );
  };

  const languageLabel = currentLanguage === 'es' ? 'Español' : 'English (US)';

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
            <Text style={styles.headerLabel}>{t('settingsScreen.preferences')}</Text>
            <Text style={styles.headerTitle}>{t('settingsScreen.title')}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <SectionLabel label={t('settingsScreen.appearance')} />
          <View style={styles.menuCard}>
            <MenuRow
              icon="moon-outline"
              title={t('settingsScreen.darkMode')}
              subtitle={isDarkMode ? t('settingsScreen.currentlyDark') : t('settingsScreen.currentlyLight')}
              showChevron={false}
              rightComponent={
                <Switch
                  value={isDarkMode}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor="#fff"
                  ios_backgroundColor={colors.border}
                />
              }
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="globe-outline"
              title={t('settingsScreen.language')}
              subtitle={languageLabel}
              onPress={handleLanguagePress}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <SectionLabel label={t('settingsScreen.account')} />
          <View style={styles.menuCard}>
            <MenuRow
              icon="notifications-outline"
              title={t('settingsScreen.notifications')}
              subtitle={t('settingsScreen.notificationsDesc')}
              onPress={() => navigation.navigate('NotificationSettingsNew')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="shield-outline"
              title={t('settingsScreen.security')}
              subtitle={t('settingsScreen.securityDesc')}
              onPress={() => navigation.navigate('PasswordSettings')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="lock-closed-outline"
              title={t('settingsScreen.privacy')}
              subtitle={t('settingsScreen.privacyDesc')}
              onPress={() => navigation.navigate('PrivacySettingsNew')}
            />
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <SectionLabel label={t('settingsScreen.dangerZone')} />
          <View style={styles.menuCard}>
            <MenuRow
              icon="log-out-outline"
              title={t('settingsScreen.signOut')}
              onPress={handleSignOut}
              showChevron
              isDestructive
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="trash-outline"
              title={t('settingsScreen.deleteAccount')}
              subtitle={t('settingsScreen.deleteAccountDesc')}
              onPress={handleDeleteAccount}
              showChevron
              isDestructive
            />
          </View>
        </View>

        {/* Dev tools */}
        {__DEV__ && (
          <View style={styles.section}>
            <SectionLabel label="DEV TOOLS" />
            <View style={styles.menuCard}>
              <MenuRow
                icon="location-outline"
                title="Location Simulator Test"
                subtitle="Test background location tracking"
                onPress={() => navigation.navigate('LocationSimulatorTest')}
              />
            </View>
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
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    marginTop: 24,
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
  menuIconBoxDestructive: {
    backgroundColor: colors.hotSurface,
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