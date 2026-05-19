import React, {useEffect} from 'react';
import {View, Text, Linking, StyleSheet, SafeAreaView, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import GlobalColors from '../../styles/GlobalColors';
import useTranslation from '../../Hooks/useTranslation';

const C = GlobalColors.VenueClaim;

// Base URL for the web venue claim flow — set via environment or config
const VENUE_CLAIM_WEB_URL = 'https://citizen.app/venue';

/**
 * Redirect screen that opens the web-based venue claim flow.
 * Replaces the in-app claim screens — the full claim journey now lives on web.
 */
export default function VenueClaimWebRedirect() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  useEffect(() => {
    Linking.openURL(`${VENUE_CLAIM_WEB_URL}?from=app`).catch(() => {});
  }, []);

  const handleOpenWeb = () => {
    Linking.openURL(`${VENUE_CLAIM_WEB_URL}?from=app`).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{t('common.globeIcon', {defaultValue: '🌐'})}</Text>
        <Text style={styles.title}>{t('venueClaim.claimOnWeb')}</Text>
        <Text style={styles.subtitle}>
          {t('venueClaim.webRedirectMessage')}
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenWeb} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>{t('venueClaim.openInBrowser')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>{t('venueClaim.goBack')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.background},
  content: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32},
  icon: {fontSize: 48, marginBottom: 20},
  title: {fontSize: 22, fontWeight: '700', color: C.white, textAlign: 'center', marginBottom: 12},
  subtitle: {fontSize: 15, color: C.mutedGray, textAlign: 'center', lineHeight: 22, marginBottom: 32, maxWidth: 320},
  primaryBtn: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 16,
    backgroundColor: C.primary,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {fontSize: 16, fontWeight: '700', color: C.black},
  secondaryBtn: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
  },
  secondaryBtnText: {fontSize: 14, fontWeight: '600', color: C.mutedGray},
});
