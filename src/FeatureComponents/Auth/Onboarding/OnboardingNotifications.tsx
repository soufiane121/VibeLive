import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {GlobalColors} from '../../../styles/GlobalColors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Button from '../../UIComponents/Button';
import {useSignUpMutation} from '../../../../features/registrations/LoginSliceApi';
import {useDispatch} from 'react-redux';
import {setCurrentUser} from '../../../../features/registrations/CurrentUser';
import useTranslation from '../../../Hooks/useTranslation';

interface OnboardingNotificationsProps {
  navigation: any;
  route: any;
}

const OnboardingNotifications: React.FC<OnboardingNotificationsProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [postSignUp, {isLoading: isSignUpLoading}] = useSignUpMutation();
  const dispatch = useDispatch();

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: t('onboarding.notificationPermissionTitle'),
            message: t('onboarding.notificationPermissionMessage'),
            buttonNeutral: t('onboarding.askMeLater'),
            buttonNegative: t('common.cancel'),
            buttonPositive: t('common.ok'),
          },
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasNotificationPermission(isGranted);
        
        if (!isGranted) {
          Alert.alert(
            t('onboarding.notificationsBlocked'),
            t('onboarding.notificationsBlockedDesc'),
            [
              {text: t('common.cancel'), style: 'cancel'},
              {text: t('onboarding.openSettings'), onPress: () => Linking.openSettings()},
            ]
          );
        }
      } else {
        // iOS - notifications are handled through system prompts
        setHasNotificationPermission(true);
      }
    } catch (error) {
      console.log('Notification permission request error:', error);
      Alert.alert(t('common.error'), t('onboarding.notificationPermissionFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const validateAndCompleteSignUp = async () => {
    const signupData = route.params?.signupData || {};
    
    // Validation: Check if all required data is present
    if (!signupData.firstName || !signupData.lastName || !signupData.age || !signupData.gender) {
      Alert.alert(
        t('onboarding.missingInfo'),
        t('onboarding.missingInfoDesc'),
        [
          {text: t('onboarding.goBack'), onPress: () => navigation.goBack()},
        ]
      );
      return;
    }

    if (!signupData.userName || !signupData.email || !signupData.password) {
      Alert.alert(
        t('onboarding.accountInfoMissing'),
        t('onboarding.accountInfoMissingDesc'),
        [
          {text: t('common.ok'), onPress: () => navigation.navigate('SignUp')},
        ]
      );
      return;
    }

    completeSignUp();
  };

  const completeSignUp = async () => {
    setIsSigningUp(true);
    try {
      const signupData = route.params?.signupData || {};
      const userData = {
        userName: signupData.userName || '',
        email: signupData.email || '',
        password: signupData.password || '',
        phoneNumber: signupData.phoneNumber || '',
        coordinates: signupData.coordinates || [0, 0],
        firstName: signupData.firstName || '',
        lastName: signupData.lastName || '',
        age: signupData.age || 18,
        gender: signupData.gender || '',
        interests: signupData.interests || [],
        interestCategories: signupData.interestCategories || [],
        locationPermission: signupData.locationPermission || false,
        notificationPermission: hasNotificationPermission,
      };

      const res = await postSignUp(userData).unwrap();
      dispatch(setCurrentUser(res.data));
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{name: 'Bottom'}],
      });
    } catch (error) {
      console.log('Signup error:', error?.data);
      Alert.alert(t('onboarding.signupError'), t('onboarding.signupFailed'));
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      t('onboarding.skipNotifications'),
      t('onboarding.skipNotificationsDesc'),
      [
        {text: t('onboarding.goBack'), style: 'cancel'},
        {text: t('onboarding.skipAnyway'), onPress: completeSignUp, style: 'destructive'},
      ]
    );
  };

  const isNotificationGranted = hasNotificationPermission;

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}>
        <Icon name="arrow-left" size={20} color={GlobalColors.Onboarding.textSecondary} />
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarsRow}>
          <View style={[styles.progressBar, styles.progressBarFilled]} />
          <View style={[styles.progressBar, styles.progressBarFilled]} />
          <View style={[styles.progressBar, styles.progressBarFilled]} />
          <View style={[styles.progressBar, styles.progressBarActive]} />
        </View>
        <Text style={styles.progressText}>{t('onboarding.step4Of4')}</Text>
      </View>

      {/* Bell Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <Icon
            name="bell"
            size={28}
            color={GlobalColors.Onboarding.accent}
          />
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{t('onboarding.neverMissAction')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.neverMissActionDesc')}
        </Text>
      </View>

      {/* Preview Cards */}
      <View style={styles.previewCardsContainer}>
        <View style={styles.previewCard}>
          <View style={styles.previewIconBox}>
            <Icon name="flash" size={18} color={GlobalColors.Onboarding.accent} />
          </View>
          <Text style={styles.previewCardText}>
            <Text style={styles.previewHighlight}>{t('onboarding.fomoBreaking')}</Text>
            {' '}{t('onboarding.fomoHotEvent')}
          </Text>
        </View>
        <View style={styles.previewCard}>
          <View style={styles.previewIconBox}>
            <Icon name="account" size={18} color={GlobalColors.Onboarding.accent} />
          </View>
          <Text style={styles.previewCardText}>
            <Text style={styles.previewHighlight}>{t('onboarding.fomoLiveNow')}</Text>
            {' '}{t('onboarding.fomoLiveEvent')}
          </Text>
        </View>
      </View>

      {/* Benefits Section */}
      <Text style={styles.sectionLabel}>{t('onboarding.benefitsTitle')}</Text>
      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Icon name="check" size={16} color={GlobalColors.Onboarding.accent} />
          <Text style={styles.benefitText}>{t('onboarding.benefitBreaking')}</Text>
        </View>
        <View style={styles.benefitItem}>
          <Icon name="check" size={16} color={GlobalColors.Onboarding.accent} />
          <Text style={styles.benefitText}>{t('onboarding.benefitFriends')}</Text>
        </View>
        <View style={styles.benefitItem}>
          <Icon name="check" size={16} color={GlobalColors.Onboarding.accent} />
          <Text style={styles.benefitText}>{t('onboarding.benefitExclusive')}</Text>
        </View>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {!isNotificationGranted ? (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={requestNotificationPermission}
              disabled={isLoading}
              activeOpacity={0.9}>
              <Icon name="bell" size={18} color={GlobalColors.Onboarding.background} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>
                {isLoading ? t('onboarding.requestingPermission') : t('onboarding.enableNotifications')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.8}>
              <Text style={styles.skipButtonText}>{t('onboarding.skipFinish')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, isSigningUp && styles.primaryButtonDisabled]}
            onPress={validateAndCompleteSignUp}
            disabled={isSigningUp || isSignUpLoading}
            activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>
              {isSigningUp ? t('onboarding.creatingAccount') : t('onboarding.completeSetup')}
            </Text>
            <Icon name="arrow-right" size={18} color={GlobalColors.Onboarding.background} style={styles.buttonArrow} />
          </TouchableOpacity>
        )}
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyContainer}>
        <Icon name="information-outline" size={14} color={GlobalColors.Onboarding.textMuted} />
        <Text style={styles.privacyText}>
          {t('onboarding.customizePrefs')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Onboarding.background,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  progressBarsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: GlobalColors.Onboarding.surfaceSecondary,
    borderRadius: 2,
  },
  progressBarFilled: {
    backgroundColor: GlobalColors.Onboarding.accent,
    opacity: 0.5,
  },
  progressBarActive: {
    backgroundColor: GlobalColors.Onboarding.accent,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: GlobalColors.Onboarding.accent,
    letterSpacing: 0.5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBackground: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: GlobalColors.Onboarding.text,
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: GlobalColors.Onboarding.textSecondary,
    lineHeight: 20,
  },
  previewCardsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    borderRadius: 14,
    padding: 14,
  },
  previewIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GlobalColors.Onboarding.accentSurface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewCardText: {
    flex: 1,
    fontSize: 13,
    color: GlobalColors.Onboarding.text,
    lineHeight: 18,
  },
  previewHighlight: {
    fontWeight: '700',
    color: GlobalColors.Onboarding.accent,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: GlobalColors.Onboarding.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 10,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    color: GlobalColors.Onboarding.textSecondary,
    lineHeight: 18,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: GlobalColors.Onboarding.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.background,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonArrow: {
    marginLeft: 6,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: GlobalColors.Onboarding.textMuted,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  privacyText: {
    fontSize: 11,
    color: GlobalColors.Onboarding.textMuted,
    lineHeight: 16,
  },
});

export default OnboardingNotifications;
