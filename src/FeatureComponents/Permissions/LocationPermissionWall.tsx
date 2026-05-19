import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {GlobalColors} from '../../styles/GlobalColors';
import useTranslation from '../../Hooks/useTranslation';

const colors = GlobalColors.LocationPermissionWall;

interface LocationPermissionWallProps {
  children: React.ReactNode;
}

const LocationPermissionWall: React.FC<LocationPermissionWallProps> = ({
  children,
}) => {
  const {t} = useTranslation();
  const [isGranted, setIsGranted] = useState<boolean | null>(null);
  const [needsPreciseLocation, setNeedsPreciseLocation] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermission = useCallback(async () => {
    try {
      const {status} = await Location.getBackgroundPermissionsAsync();
      const hasBackground = status === 'granted';

      if (!hasBackground) {
        setIsGranted(false);
        setNeedsPreciseLocation(false);
        return;
      }

      // Permission granted — now verify precise location accuracy
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const accuracy = position.coords.accuracy;
        const isPrecise = accuracy !== null && accuracy !== undefined && accuracy <= 100;
        setNeedsPreciseLocation(!isPrecise);
        setIsGranted(isPrecise);
      } catch (locError: any) {
        console.warn('[LocationPermissionWall] Could not verify accuracy:', locError.message);
        // If we can't verify, be lenient — don't block on this
        setNeedsPreciseLocation(false);
        setIsGranted(true);
      }
    } catch (error: any) {
      console.error('[LocationPermissionWall] Check error:', error.message);
      setIsGranted(false);
      setNeedsPreciseLocation(false);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Re-check when app returns to foreground (user may have changed in Settings)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkPermission();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkPermission]);

  // Fallback polling re-check while wall is visible — AppState is unreliable
  // on some iOS versions when returning from Settings.
  useEffect(() => {
    if (isGranted !== false) return;
    const id = setInterval(() => checkPermission(), 2000);
    return () => clearInterval(id);
  }, [isGranted, checkPermission]);

  const handleEnableLocation = async () => {
    if (isRequesting) return;
    setIsRequesting(true);

    // Timeout guard: if expo-location hangs (known iOS issue), force reset
    const timeoutId = setTimeout(() => {
      console.warn('[LocationPermissionWall] Permission request timed out — resetting spinner');
      setIsRequesting(false);
    }, 10000);

    try {
      if (Platform.OS === 'ios') {
        // iOS 13+: "Always Allow" can NOT be granted via in-app dialog.
        // The system only offers "While Using" in the modal. The user MUST
        // go to Settings → Privacy → Location Services → VibeLive → Always.
        // Skip the unreliable request and open Settings directly.
        await Linking.openSettings();
      } else {
        // Android: request foreground first, then background
        const {status: fgStatus} = await Location.getForegroundPermissionsAsync();
        if (fgStatus !== 'granted') {
          const {status} = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            await Linking.openSettings();
            return;
          }
        }

        const {status} = await Location.requestBackgroundPermissionsAsync();
        if (status === 'granted') {
          setIsGranted(true);
          return;
        }

        await Linking.openSettings();
      }
    } catch (error: any) {
      console.error('[LocationPermissionWall] Request error:', error.message);
      await Linking.openSettings();
    } finally {
      clearTimeout(timeoutId);
      setIsRequesting(false);
    }
  };

  // Still loading initial check
  if (isGranted === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Permission granted and precise location verified — render children
  if (isGranted && !needsPreciseLocation) {
    return <>{children}</>;
  }

  // Wall: permission not granted
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Location Icon with glow */}
        <View style={styles.iconRingOuter}>
          <View style={styles.iconRingInner}>
            <Icon name="map-marker" size={32} color={colors.accent} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {needsPreciseLocation
            ? t('locationPermissionWall.preciseTitle')
            : t('locationPermissionWall.title')}
        </Text>

        {/* Body */}
        <Text style={styles.body}>
          {needsPreciseLocation
            ? t('locationPermissionWall.preciseBody')
            : t('locationPermissionWall.body')}
        </Text>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1 */}
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, {backgroundColor: colors.hotSurface, borderColor: colors.hotBorder}]}>
              <Icon name="flash" size={16} color={colors.hotIcon} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{t('locationPermissionWall.feature1Title')}</Text>
              <Text style={styles.featureBody}>{t('locationPermissionWall.feature1Body')}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Card 2 */}
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, {backgroundColor: colors.accentSurface, borderColor: colors.accentBorder}]}>
              <Icon name="account" size={16} color={colors.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{t('locationPermissionWall.feature2Title')}</Text>
              <Text style={styles.featureBody}>{t('locationPermissionWall.feature2Body')}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Card 3 */}
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, {backgroundColor: colors.goldSurface, borderColor: colors.goldSurface}]}>
              <Icon name="eye" size={16} color={colors.goldIcon} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{t('locationPermissionWall.feature3Title')}</Text>
              <Text style={styles.featureBody}>{t('locationPermissionWall.feature3Body')}</Text>
            </View>
          </View>
        </View>

        {/* iOS Settings Instruction Card */}
        {Platform.OS === 'ios' && (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsLabel}>{t('locationPermissionWall.settingsLabel')}</Text>
            <View style={styles.settingsRow}>
              <Icon name="apple" size={16} color={colors.textSecondary} />
              <Text style={styles.settingsText}>
                {t('locationPermissionWall.settingsPath')}
              </Text>
              <Icon name="chevron-right" size={14} color={colors.textSecondary} />
            </View>
          </View>
        )}

        {/* CTA button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleEnableLocation}
          activeOpacity={0.85}
          disabled={isRequesting}>
          {isRequesting ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <View style={styles.buttonContent}>
              <Icon name="map-marker" size={16} color={colors.buttonText} />
              <Text style={styles.buttonText}>
                {needsPreciseLocation
                  ? t('locationPermissionWall.preciseButton')
                  : t('locationPermissionWall.enableButton')}
              </Text>
              <Icon name="arrow-right" size={16} color={colors.buttonText} style={{marginLeft: 4}} />
            </View>
          )}
        </TouchableOpacity>

        {/* Footnote */}
        <Text style={styles.footnote}>
          {t('locationPermissionWall.footnote')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 380,
    alignSelf: 'center',
    width: '100%',
  },
  iconRingOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  iconRingInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'left',
    marginBottom: 10,
    lineHeight: 32,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'left',
    marginBottom: 28,
  },
  cardsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  featureBody: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.separator,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  settingsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.accent,
    flex: 1,
  },
  button: {
    backgroundColor: colors.buttonBackground,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.buttonText,
  },
  footnote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LocationPermissionWall;
