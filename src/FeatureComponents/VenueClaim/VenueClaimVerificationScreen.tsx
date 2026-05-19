import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  VenueSearchResult,
  VerificationPath,
  useVerifyGoogleMutation,
  useVerifySocialMutation,
  useUploadDocumentMutation,
} from '../../../features/venueClaim/VenueClaimApi';
import GlobalColors from '../../styles/GlobalColors';
import useTranslation from '../../Hooks/useTranslation';

const C = GlobalColors.VenueClaim;

export default function VenueClaimVerificationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const venue: VenueSearchResult = route.params?.venue;
  const path: VerificationPath = route.params?.path;

  // Google Business state
  const [googleUrl, setGoogleUrl] = useState('');
  const [verifyGoogle, {isLoading: googleLoading}] = useVerifyGoogleMutation();

  // Social Media state
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [verificationCode] = useState(() => `VL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const [verifySocial, {isLoading: socialLoading}] = useVerifySocialMutation();
  const [socialCodeCopied, setSocialCodeCopied] = useState(false);

  // Business License state
  const [docType, setDocType] = useState('business_license');
  const [storageRef, setStorageRef] = useState('');
  const [uploadDoc, {isLoading: docLoading}] = useUploadDocumentMutation();

  const isLoading = googleLoading || socialLoading || docLoading;

  const handleGoogleVerify = async () => {
    if (!googleUrl.trim()) {
      Alert.alert(t('venueClaim.missingUrl'), t('venueClaim.enterGoogleUrl'));
      return;
    }
    try {
      const result = await verifyGoogle({venueId: venue._id, googleBusinessUrl: googleUrl.trim()}).unwrap();
      if (result.matched) {
        navigation.navigate('VenueClaimTierSelection', {venue, path, verificationData: {googleBusinessUrl: googleUrl.trim()}});
      } else {
        Alert.alert(
          t('venueClaim.noMatchFound'),
          t('venueClaim.urlNotMatched'),
        );
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.data?.error || t('venueClaim.verificationFailed'));
    }
  };

  const handleSocialCopyCode = () => {
    Clipboard.setString(verificationCode);
    setSocialCodeCopied(true);
    setTimeout(() => setSocialCodeCopied(false), 3000);
  };

  const handleSocialContinue = () => {
    if (!handle.trim()) {
      Alert.alert(t('venueClaim.missingHandle'), t('venueClaim.enterSocialHandle'));
      return;
    }
    navigation.navigate('VenueClaimTierSelection', {
      venue,
      path,
      verificationData: {handle: handle.trim(), platform, verificationCode},
    });
  };

  const handleDocumentContinue = () => {
    if (!storageRef.trim()) {
      Alert.alert(t('venueClaim.missingDocument'), t('venueClaim.provideDocumentRef'));
      return;
    }
    navigation.navigate('VenueClaimTierSelection', {
      venue,
      path,
      verificationData: {storageRef: storageRef.trim(), docType},
    });
  };

  // ── Google Business Path ───────────────────────────────────────────
  const renderGooglePath = () => (
    <View style={styles.pathSection}>
      <Text style={styles.pathHeading}>{t('venueClaim.googleBusinessVerification')}</Text>
      <Text style={styles.pathDescription}>
        {t('venueClaim.pasteGoogleUrl')}{' '}
        <Text style={styles.goldText}>{venue?.name}</Text>.
      </Text>

      <Text style={styles.inputLabel}>{t('venueClaim.googleBusinessProfileUrl')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('venueClaim.googleUrlPlaceholder')}
        placeholderTextColor={C.mutedGray}
        value={googleUrl}
        onChangeText={setGoogleUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>{t('venueClaim.howToFindUrl')}</Text>
        <Text style={styles.tipText}>
          {t('venueClaim.howToFindUrlSteps')}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, !googleUrl.trim() && styles.btnDisabled]}
        onPress={handleGoogleVerify}
        disabled={isLoading || !googleUrl.trim()}
        activeOpacity={0.8}>
        {googleLoading ? (
          <ActivityIndicator color={C.black} />
        ) : (
          <Text style={styles.primaryBtnText}>{t('venueClaim.verifyUrl')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ── Social Media Path ──────────────────────────────────────────────
  const renderSocialPath = () => (
    <View style={styles.pathSection}>
      <Text style={styles.pathHeading}>{t('venueClaim.socialMediaVerification')}</Text>
      <Text style={styles.pathDescription}>
        {t('venueClaim.addCodeToBio')}
      </Text>

      <Text style={styles.inputLabel}>{t('venueClaim.yourVerificationCode')}</Text>
      <View style={styles.codeRow}>
        <Text style={styles.codeText}>{verificationCode}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={handleSocialCopyCode}>
          <Text style={styles.copyBtnText}>{socialCodeCopied ? t('common.copied') : t('common.copy')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>{t('common.platform')}</Text>
      <View style={styles.platformRow}>
        <TouchableOpacity
          style={[styles.platformBtn, platform === 'instagram' && styles.platformBtnActive]}
          onPress={() => setPlatform('instagram')}>
          <Text style={[styles.platformBtnText, platform === 'instagram' && styles.platformBtnTextActive]}>
            Instagram
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.platformBtn, platform === 'tiktok' && styles.platformBtnActive]}
          onPress={() => setPlatform('tiktok')}>
          <Text style={[styles.platformBtnText, platform === 'tiktok' && styles.platformBtnTextActive]}>
            TikTok
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>{t('venueClaim.yourHandle')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('venueClaim.handlePlaceholder')}
        placeholderTextColor={C.mutedGray}
        value={handle}
        onChangeText={setHandle}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>{t('common.instructions')}</Text>
        <Text style={styles.tipText}>
          {t('venueClaim.socialInstructions', { platform: platform === 'instagram' ? 'Instagram' : 'TikTok' })}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, !handle.trim() && styles.btnDisabled]}
        onPress={handleSocialContinue}
        disabled={isLoading || !handle.trim()}
        activeOpacity={0.8}>
        <Text style={styles.primaryBtnText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Business License Path ──────────────────────────────────────────
  const renderLicensePath = () => (
    <View style={styles.pathSection}>
      <Text style={styles.pathHeading}>{t('venueClaim.businessLicenseUpload')}</Text>
      <Text style={styles.pathDescription}>
        {t('venueClaim.provideBusinessLicense')}
      </Text>

      <Text style={styles.inputLabel}>{t('venueClaim.documentType')}</Text>
      <View style={styles.platformRow}>
        {['business_license', 'liquor_license', 'food_service_permit'].map(dt => (
          <TouchableOpacity
            key={dt}
            style={[styles.platformBtn, docType === dt && styles.platformBtnActive]}
            onPress={() => setDocType(dt)}>
            <Text style={[styles.platformBtnText, docType === dt && styles.platformBtnTextActive]}>
              {dt.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>{t('venueClaim.documentReference')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('venueClaim.documentPlaceholder')}
        placeholderTextColor={C.mutedGray}
        value={storageRef}
        onChangeText={setStorageRef}
      />

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>{t('venueClaim.acceptedDocuments')}</Text>
        <Text style={styles.tipText}>
          {t('venueClaim.acceptedDocumentsList')}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, !storageRef.trim() && styles.btnDisabled]}
        onPress={handleDocumentContinue}
        disabled={isLoading || !storageRef.trim()}
        activeOpacity={0.8}>
        <Text style={styles.primaryBtnText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.backArrow')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('venueClaim.verifyOwnership')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {path === 'google_business' && renderGooglePath()}
        {path === 'social_media' && renderSocialPath()}
        {path === 'business_license' && renderLicensePath()}
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
  backText: {color: C.text, fontSize: 22},
  title: {color: C.text, fontSize: 20, fontWeight: '700'},
  scroll: {paddingHorizontal: 20, paddingBottom: 40},
  pathSection: {marginTop: 8},
  pathHeading: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  pathDescription: {
    color: C.lightTextGray,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  goldText: {
    color: C.primary,
    fontWeight: '700',
  },
  inputLabel: {
    color: C.lightTextGray,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: C.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  tipBox: {
    backgroundColor: C.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  tipTitle: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  tipText: {
    color: C.textGray,
    fontSize: 13,
    lineHeight: 20,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  codeText: {
    flex: 1,
    color: C.primary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  copyBtn: {
    backgroundColor: C.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  platformRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  platformBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.cardBackground,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  platformBtnActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryMuted,
  },
  platformBtnText: {
    color: C.textGray,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  platformBtnTextActive: {
    color: C.primary,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: '#0A0A0C',
    fontSize: 16,
    fontWeight: '700',
  },
});
