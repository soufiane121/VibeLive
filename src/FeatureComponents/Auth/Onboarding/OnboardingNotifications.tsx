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
    if (!signupData.firstName || !signupData.lastName || !signupData.age) {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={GlobalColors.Settings.text} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: '100%'}]} />
        </View>
        <Text style={styles.progressText}>{t('onboarding.step4Of4')}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Icon 
              name="bell-ring" 
              size={60} 
              color={GlobalColors.Settings.accent} 
            />
            <View style={styles.pulseRing} />
          </View>
        </View>

        <Text style={styles.title}>{t('onboarding.neverMissAction')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.neverMissActionDesc')}
        </Text>

        {/* FOMO Alerts */}
        <View style={styles.fomoContainer}>
          <View style={styles.fomoAlert}>
            <Icon name="lightning-bolt" size={20} color={GlobalColors.Settings.accent} />
            <Text style={styles.fomoText}>
              <Text style={styles.fomoHighlight}>{t('onboarding.fomoBreaking')}</Text>{t('onboarding.fomoHotEvent')}
            </Text>
          </View>
          <View style={styles.fomoAlert}>
            <Icon name="account-group" size={20} color={GlobalColors.Settings.accent} />
            <Text style={styles.fomoText}>
              <Text style={styles.fomoHighlight}>{t('onboarding.fomoLiveNow')}</Text>{t('onboarding.fomoLiveEvent')}
            </Text>
          </View>
          <View style={styles.fomoAlert}>
            <Icon name="star" size={20} color={GlobalColors.Settings.accent} />
            <Text style={styles.fomoText}>
              <Text style={styles.fomoHighlight}>{t('onboarding.fomoExclusive')}</Text>{t('onboarding.fomoVipEvent')}
            </Text>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>{t('onboarding.benefitsTitle')}</Text>
          <View style={styles.benefit}>
            <Icon name="fire" size={18} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>{t('onboarding.benefitBreaking')}</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="video" size={18} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>{t('onboarding.benefitFriends')}</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="ticket" size={18} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>{t('onboarding.benefitExclusive')}</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="heart" size={18} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>{t('onboarding.benefitInterests')}</Text>
          </View>
        </View>

        {/* Success State */}
        {isNotificationGranted && (
          <View style={styles.successContainer}>
            <Icon name="check-circle" size={24} color={GlobalColors.Common.successIcon} />
            <Text style={styles.successText}>{t('onboarding.welcomeMessage')}</Text>
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {!isNotificationGranted ? (
          <>
            <TouchableOpacity
              style={[styles.enableButton, isLoading && styles.enableButtonDisabled]}
              onPress={requestNotificationPermission}
              disabled={isLoading}>
              <Text style={styles.enableButtonText}>
                {isLoading ? t('onboarding.requestingPermission') : t('onboarding.enableNotifications')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>{t('onboarding.skipFinish')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.completeButton, isSigningUp && styles.completeButtonDisabled]}
            onPress={validateAndCompleteSignUp}
            disabled={isSigningUp || isSignUpLoading}>
            <Text style={styles.completeButtonText}>
              {isSigningUp ? t('onboarding.creatingAccount') : t('onboarding.completeSetup')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyContainer}>
        <Icon name="shield-check" size={16} color={GlobalColors.Settings.textMuted} />
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
    backgroundColor: GlobalColors.Settings.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: GlobalColors.Settings.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GlobalColors.Settings.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: GlobalColors.Settings.textMuted,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GlobalColors.Settings.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GlobalColors.Settings.accent + '20',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: GlobalColors.Settings.accent + '30',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GlobalColors.Settings.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: GlobalColors.Settings.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  fomoContainer: {
    width: '100%',
    marginBottom: 24,
  },
  fomoAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: GlobalColors.Settings.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: GlobalColors.Settings.accent,
  },
  fomoText: {
    flex: 1,
    fontSize: 14,
    color: GlobalColors.Settings.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  fomoHighlight: {
    fontWeight: 'bold',
    color: GlobalColors.Settings.accent,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalColors.Settings.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  benefitText: {
    fontSize: 14,
    color: GlobalColors.Settings.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalColors.Settings.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    fontSize: 16,
    color: GlobalColors.Common.successText,
    marginLeft: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingTop: 20,
  },
  enableButton: {
    backgroundColor: GlobalColors.Settings.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  enableButtonDisabled: {
    backgroundColor: GlobalColors.Settings.border,
  },
  enableButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalColors.Settings.background,
  },
  completeButton: {
    backgroundColor: GlobalColors.Settings.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: GlobalColors.Settings.border,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalColors.Settings.background,
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: GlobalColors.Settings.textMuted,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: 12,
    color: GlobalColors.Settings.textMuted,
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
    lineHeight: 16,
  },
});

export default OnboardingNotifications;
