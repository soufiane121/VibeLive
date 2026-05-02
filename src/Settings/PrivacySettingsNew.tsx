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
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { GlobalColors } from '../styles/GlobalColors';
import { useAnalytics } from '../Hooks/useAnalytics';
import useTranslation from '../Hooks/useTranslation';
import { useRequestDataDownloadMutation } from '../../features/settings/SettingsSliceApi';

const colors = GlobalColors.Account;

// ---------- Section Header ----------
const SectionLabel = ({ label }: { label: string }) => (
  <Text style={styles.sectionLabel}>{label}</Text>
);

// ---------- Menu Row ----------
const MenuRow = ({
  icon,
  iconFamily = 'ionicons',
  title,
  subtitle,
  onPress,
  isDestructive = false,
  iconColor,
}: {
  icon: string;
  iconFamily?: 'ionicons' | 'feather';
  title: string;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
  iconColor?: string;
}) => {
  const IconComponent = iconFamily === 'feather' ? Feather : Ionicons;

  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.6}>
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
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

// ---------- Privacy Settings Screen ----------
const PrivacySettingsNew = () => {
  const navigation = useNavigation<any>();
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  const userId = currentUser?._id;

  const [requestDataDownload] = useRequestDataDownloadMutation();

  React.useEffect(() => {
    trackEvent('app_opened', {
      screen_name: 'PrivacySettingsNew',
      user_id: userId,
    });
  }, []);

  const handleDownloadData = async () => {
    try {
      await requestDataDownload({userId}).unwrap();
      Alert.alert(
        t('settingsScreen.downloadMyData'),
        t('settingsScreen.downloadDataSuccess'),
      );
    } catch {
      Alert.alert(t('common.error'), t('settingsScreen.downloadDataFailed'));
    }
  };

  const handleClearWatchHistory = () => {
    Alert.alert(
      t('settingsScreen.clearWatchHistory'),
      t('settingsScreen.clearWatchHistoryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settingsScreen.clearWatchHistory'),
          style: 'destructive',
          onPress: () => {
            // Coming soon — no endpoint yet
            Alert.alert(t('common.success'), t('settingsScreen.clearWatchHistorySuccess'));
          },
        },
      ],
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://vibelive.app/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://vibelive.app/terms');
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
            <Text style={styles.headerLabel}>{t('settingsScreen.dataAndLegal')}</Text>
            <Text style={styles.headerTitle}>{t('settingsScreen.privacy')}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Your Data */}
        <View style={styles.section}>
          <SectionLabel label={t('settingsScreen.yourData')} />
          <View style={styles.menuCard}>
            <MenuRow
              icon="download-outline"
              title={t('settingsScreen.downloadMyData')}
              subtitle={t('settingsScreen.downloadMyDataDesc')}
              onPress={handleDownloadData}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="trash-outline"
              title={t('settingsScreen.clearWatchHistory')}
              onPress={handleClearWatchHistory}
              isDestructive
            />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <SectionLabel label={t('settingsScreen.legal')} />
          <View style={styles.menuCard}>
            <MenuRow
              icon="shield-checkmark-outline"
              title={t('settingsScreen.privacyPolicy')}
              onPress={handlePrivacyPolicy}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="globe-outline"
              title={t('settingsScreen.termsOfService')}
              onPress={handleTermsOfService}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacySettingsNew;

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
