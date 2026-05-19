import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {GlobalColors} from '../../../styles/GlobalColors';

const SUPPORT_EMAIL = 'support@vibelive.app';

const ResetSuccessScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoToLogin = () => {
    // Reset navigation to Login screen
    (navigation as any).reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Password Reset Issue`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Success Checkmark Animation */}
        <Animated.View
          style={[
            styles.successCircle,
            {transform: [{scale: scaleAnim}]},
          ]}>
          <View style={styles.successCircleInner}>
            <MaterialCommunityIcons
              name="check"
              size={36}
              color="#10B981"
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{opacity: fadeAnim}}>
          <Text style={styles.title}>Password updated!</Text>
          <Text style={styles.subtitle}>
            Your password has been changed successfully. You can now sign in
            with your new password.
          </Text>

          {/* Security Notice */}
          <View style={styles.securityCard}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={18}
              color={GlobalColors.Onboarding.accent}
              style={{marginRight: 10, marginTop: 1}}
            />
            <View style={{flex: 1}}>
              <Text style={styles.securityTitle}>
                All other sessions have been signed out
              </Text>
              <Text style={styles.securityText}>
                For your security, all other active sessions have been
                terminated. You'll need to sign in again on those devices.
              </Text>
            </View>
          </View>

          {/* Go to Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleGoToLogin}
            activeOpacity={0.85}>
            <Text style={styles.loginButtonText}>Sign in</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color={GlobalColors.Onboarding.buttonText}
              style={{marginLeft: 6}}
            />
          </TouchableOpacity>

          {/* Contact Support */}
          <View style={styles.supportContainer}>
            <Text style={styles.supportLabel}>This wasn't you?</Text>
            <TouchableOpacity
              onPress={handleContactSupport}
              activeOpacity={0.7}>
              <Text style={styles.supportLink}>Contact support</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Onboarding.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 28,
  },
  successCircleInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: GlobalColors.Onboarding.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: GlobalColors.Onboarding.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: GlobalColors.Onboarding.accentSurface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.accentBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: GlobalColors.Onboarding.text,
    marginBottom: 4,
  },
  securityText: {
    fontSize: 12,
    color: GlobalColors.Onboarding.textSecondary,
    lineHeight: 17,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: GlobalColors.Onboarding.accent,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.buttonText,
  },
  supportContainer: {
    alignItems: 'center',
  },
  supportLabel: {
    fontSize: 13,
    color: GlobalColors.Onboarding.textSecondary,
    marginBottom: 4,
  },
  supportLink: {
    fontSize: 13,
    fontWeight: '600',
    color: GlobalColors.Onboarding.accent,
  },
});

export default ResetSuccessScreen;
