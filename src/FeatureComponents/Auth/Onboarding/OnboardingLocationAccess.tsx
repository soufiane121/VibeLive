import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import {GlobalColors} from '../../../styles/GlobalColors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Button from '../../UIComponents/Button';
import {useCoordinates, useLocationPermission} from '../../../CustomHooks/useGetLocation';
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
  const coordinates = useCoordinates();
  const {hasPermission, requestLocationPermission} = useLocationPermission();
  const [isLoading, setIsLoading] = useState(false);
  const isLocationGranted = hasPermission;

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
        return;
      }

      // Validate precise location (not approximate)
      const permissions = await Location.getForegroundPermissionsAsync();
      const isAndroidCoarse = Platform.OS === 'android' && permissions.android?.accuracy === 'coarse';

      if (isAndroidCoarse) {
        Alert.alert(
          t('onboarding.preciseLocationRequired'),
          t('onboarding.preciseLocationDesc'),
          [
            {text: t('common.cancel'), style: 'cancel'},
            {text: t('onboarding.openSettings'), onPress: () => Linking.openSettings()},
          ]
        );
        return;
      }

      // Cross-platform accuracy check: fetch current position and verify horizontal accuracy
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const horizontalAccuracy = current.coords.accuracy;
      const isLowAccuracy = horizontalAccuracy == null || horizontalAccuracy > 100;

      if (isLowAccuracy) {
        Alert.alert(
          t('onboarding.preciseLocationRequired'),
          t('onboarding.preciseLocationDesc'),
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

  const handleContinue = () => {
    if (!hasPermission) {
      Alert.alert(
        t('onboarding.locationAccessRequired'),
        t('onboarding.locationEnableOrSkip'),
        [{text: t('common.ok'), style: 'default'}]
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
          <View style={[styles.progressBar, styles.progressBarActive]} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>
        <Text style={styles.progressText}>{t('onboarding.step2Of4')}</Text>
      </View>

      {/* Location Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <Icon
            name="map-marker"
            size={28}
            color={GlobalColors.Onboarding.accent}
          />
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{t('onboarding.dontMissNearby')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.locationSubtitle')}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>47</Text>
          <Text style={styles.statLabel}>{t('onboarding.eventsNearYou')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>2.3k</Text>
          <Text style={styles.statLabel}>{t('onboarding.peopleStreamingNearby')}</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconBox}>
          <Icon name="compass" size={18} color={GlobalColors.Onboarding.accent} />
        </View>
        <Text style={styles.infoCardText}>
          {t('onboarding.discoverEventsRealtime')}
        </Text>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {!isLocationGranted ? (
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleRequestLocation}
            disabled={isLoading}
            activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>
              {isLoading ? t('onboarding.requestingAccess') : t('onboarding.allowLocationAccess')}
            </Text>
            {!isLoading && (
              <Icon name="arrow-right" size={18} color={GlobalColors.Onboarding.background} style={styles.buttonArrow} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
            activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>{t('common.continue')}</Text>
            <Icon name="arrow-right" size={18} color={GlobalColors.Onboarding.background} style={styles.buttonArrow} />
          </TouchableOpacity>
        )}
      </View>

      {/* Privacy Note */}
      <Text style={styles.privacyText}>
        {t('onboarding.locationPrivacy')}
      </Text>
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
    marginBottom: 32,
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    borderRadius: 14,
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: GlobalColors.Onboarding.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: GlobalColors.Onboarding.textMuted,
    lineHeight: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  infoIconBox: {
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
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: GlobalColors.Onboarding.text,
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
  buttonArrow: {
    marginLeft: 6,
  },
  privacyText: {
    fontSize: 11,
    color: GlobalColors.Onboarding.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});

export default OnboardingLocationAccess;
