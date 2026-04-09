import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {VenueSearchResult, VerificationPath} from '../../../features/venueClaim/VenueClaimApi';
import GlobalColors from '../../styles/GlobalColors';
import useTranslation from '../../Hooks/useTranslation';

const C = GlobalColors.VenueClaim;

type PathOption = {
  key: VerificationPath;
  title: string;
  description: string;
  icon: string;
  recommended?: boolean;
};

export default function VenueClaimPathSelectionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const venue: VenueSearchResult = route.params?.venue;
  const [selectedPath, setSelectedPath] = useState<VerificationPath | null>(null);

  const PATH_OPTIONS: PathOption[] = [
    {
      key: 'google_business',
      title: t('venueClaim.googleBusinessProfile'),
      description: t('venueClaim.googleBusinessDesc'),
      icon: t('common.searchIcon', {defaultValue: '🔍'}),
      recommended: true,
    },
    {
      key: 'social_media',
      title: t('venueClaim.socialMediaVerification'),
      description: t('venueClaim.socialMediaDesc'),
      icon: t('common.phoneIcon', {defaultValue: '📱'}),
    },
    {
      key: 'business_license',
      title: t('venueClaim.businessLicenseUpload'),
      description: t('venueClaim.businessLicenseDesc'),
      icon: t('common.documentIcon', {defaultValue: '📄'}),
    },
  ];

  const handleContinue = () => {
    if (!selectedPath) return;
    navigation.navigate('VenueClaimVerification', {venue, path: selectedPath});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.backArrow')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('venueClaim.verificationMethod')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          {t('venueClaim.howWouldYouLikeToProve')}{' '}
          <Text style={styles.venueName}>{venue?.name}</Text>?
        </Text>

        {PATH_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.pathCard,
              selectedPath === opt.key && styles.pathCardSelected,
            ]}
            onPress={() => setSelectedPath(opt.key)}
            activeOpacity={0.7}>
            <View style={styles.pathRow}>
              <Text style={styles.pathIcon}>{opt.icon}</Text>
              <View style={styles.pathContent}>
                <View style={styles.pathTitleRow}>
                  <Text style={styles.pathTitle}>{opt.title}</Text>
                  {opt.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>{t('venueClaim.recommended')}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.pathDesc}>{opt.description}</Text>
              </View>
            </View>
            <View style={styles.radioOuter}>
              {selectedPath === opt.key && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.continueBtn, !selectedPath && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selectedPath}
          activeOpacity={0.8}>
          <Text style={styles.continueBtnText}>{t('common.continue')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {padding: 8, marginRight: 8},
  backText: {
    color: C.text,
    fontSize: 22,
  },
  title: {
    color: C.text,
    fontSize: 20,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subtitle: {
    color: C.lightTextGray,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  venueName: {
    color: C.primary,
    fontWeight: '700',
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pathCardSelected: {
    borderColor: C.primary,
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  pathRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pathIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  pathContent: {flex: 1},
  pathTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  pathTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(46,204,113,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    color: '#2ecc71',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pathDesc: {
    color: C.textGray,
    fontSize: 13,
    lineHeight: 18,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.primary,
  },
  continueBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueBtnText: {
    color: '#0A0A0C',
    fontSize: 16,
    fontWeight: '700',
  },
});
