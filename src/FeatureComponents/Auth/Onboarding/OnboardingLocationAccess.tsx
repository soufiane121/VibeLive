import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {GlobalColors} from '../../../styles/GlobalColors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Button from '../../UIComponents/Button';
import useGetLocation from '../../../CustomHooks/useGetLocation';
import useTranslation from '../../../Hooks/useTranslation';

interface OnboardingLocationAccessProps {
  navigation: any;
  route: any;
}

const OnboardingLocationAccess: React.FC<OnboardingLocationAccessProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const {coordinates, hasPermission, requestLocationPermission} = useGetLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationSkipped, setIsLocationSkipped] = useState(false);

  const handleRequestLocation = async () => {
    if (!requestLocationPermission) return;
    
    setIsLoading(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          t('onboarding.locationAccessRequired'),
          t('onboarding.locationAccessDesc'),
          [
            {text: t('common.cancel'), style: 'cancel'},
            {text: t('onboarding.openSettings'), onPress: () => Linking.openSettings()},
          ]
        );
      }
    } catch (error) {
      console.log('Permission request error:', error);
      Alert.alert(t('common.error'), t('onboarding.locationPermissionFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const validateAndContinue = () => {
    // Validation: Check if location permission is granted or user explicitly skipped
    if (!hasPermission && !isLocationSkipped) {
      Alert.alert(
        t('onboarding.locationAccessRequired'),
        t('onboarding.locationEnableOrSkip'),
        [
          {text: t('common.ok'), style: 'default'}
        ]
      );
      return;
    }

    const signupData = route.params?.signupData || {};
    navigation.navigate('OnboardingInterests', {
      signupData: {
        ...signupData,
        coordinates: coordinates,
        locationPermission: hasPermission,
      },
    });
  };

  const handleSkip = () => {
    Alert.alert(
      t('onboarding.skipLocation'),
      t('onboarding.skipLocationDesc'),
      [
        {text: t('onboarding.goBack'), style: 'cancel'},
        {text: t('onboarding.skipAnyway'), onPress: () => {
          setIsLocationSkipped(true);
          validateAndContinue();
        }, style: 'destructive'},
      ]
    );
  };

  const isLocationGranted = hasPermission;

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
          <View style={[styles.progressFill, {width: '50%'}]} />
        </View>
        <Text style={styles.progressText}>{t('onboarding.step2Of4')}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Icon 
              name="map-marker-radius" 
              size={60} 
              color={GlobalColors.Settings.accent} 
            />
          </View>
        </View>

        <Text style={styles.title}>{t('onboarding.dontMissNearby')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.locationSubtitle')}
        </Text>

        {/* FOMO Stats */}
        <View style={styles.fomoContainer}>
          <View style={styles.fomoStat}>
            <Text style={styles.fomoNumber}>47</Text>
            <Text style={styles.fomoLabel}>{t('onboarding.eventsNearYou')}</Text>
          </View>
          <View style={styles.fomoStat}>
            <Text style={styles.fomoNumber}>2.3k</Text>
            <Text style={styles.fomoLabel}>{t('onboarding.peopleStreamingNearby')}</Text>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefit}>
            <Icon name="lightning-bolt" size={20} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>{t('onboarding.locationBenefit1')}</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="account-group" size={20} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>{t('onboarding.locationBenefit2')}</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="bell-ring" size={20} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>{t('onboarding.locationBenefit3')}</Text>
          </View>
        </View>

        {/* Location Status */}
        {isLocationGranted && (
          <View style={styles.successContainer}>
            <Icon name="check-circle" size={24} color={GlobalColors.Common.successIcon} />
            <Text style={styles.successText}>{t('onboarding.locationGranted')}</Text>
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {!isLocationGranted ? (
          <>
            <TouchableOpacity
              style={[styles.enableButton, isLoading && styles.enableButtonDisabled]}
              onPress={handleRequestLocation}
              disabled={isLoading}>
              <Text style={styles.enableButtonText}>
                {isLoading ? t('onboarding.requestingAccess') : t('onboarding.enableLocation')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>{t('onboarding.skipForNow')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={validateAndContinue}>
            <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyContainer}>
        <Icon name="shield-check" size={16} color={GlobalColors.Settings.textMuted} />
        <Text style={styles.privacyText}>
          {t('onboarding.locationPrivacy')}
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
    marginBottom: 40,
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
    marginBottom: 32,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GlobalColors.Settings.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: GlobalColors.Settings.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  fomoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  fomoStat: {
    alignItems: 'center',
  },
  fomoNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: GlobalColors.Settings.accent,
    marginBottom: 4,
  },
  fomoLabel: {
    fontSize: 14,
    color: GlobalColors.Settings.textSecondary,
    textAlign: 'center',
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  benefitText: {
    fontSize: 16,
    color: GlobalColors.Settings.text,
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
  continueButton: {
    backgroundColor: GlobalColors.Settings.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
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

export default OnboardingLocationAccess;
