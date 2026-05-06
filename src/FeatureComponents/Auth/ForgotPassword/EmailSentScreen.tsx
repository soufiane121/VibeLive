import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {GlobalColors} from '../../../styles/GlobalColors';

const API_BASE = '{{DOMAIN}}';
const TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESEND_ATTEMPTS = 3;

const EmailSentScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const {email, maskedEmail} = route.params || {};

  // Countdown timer (15 minutes)
  const [timeRemaining, setTimeRemaining] = useState(TOKEN_EXPIRY_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resend state
  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 15-minute countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }, []);

  const handleResend = async () => {
    if (resendAttempts >= MAX_RESEND_ATTEMPTS || resendCooldown > 0) return;

    setIsResending(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    setIsResending(false);
    setResendAttempts(prev => prev + 1);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);

    // Reset 15-min timer on resend
    setTimeRemaining(TOKEN_EXPIRY_SECONDS);
  };

  const handleOpenEmail = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('message://');
    } else {
      Linking.openURL('mailto:');
    }
  };

  const isExpired = timeRemaining === 0;
  const isResendDisabled =
    resendAttempts >= MAX_RESEND_ATTEMPTS || resendCooldown > 0 || isResending;

  // For demo: navigate to ResetPassword screen (simulates deep link)
  const handleSimulateLink = () => {
    navigation.navigate('ResetPassword', {email, token: 'simulated-token'});
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={GlobalColors.Onboarding.text}
          />
        </TouchableOpacity>

        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="email-check-outline"
            size={28}
            color={GlobalColors.Onboarding.accent}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We've sent a password reset link to
        </Text>
        <Text style={styles.emailText}>{maskedEmail || email}</Text>

        {/* Expiry Timer */}
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color={isExpired ? GlobalColors.Onboarding.error : GlobalColors.Onboarding.accent}
          />
          <Text
            style={[
              styles.timerText,
              isExpired && styles.timerTextExpired,
            ]}>
            {isExpired
              ? 'Link expired — please request a new one'
              : `Link expires in ${formatTime(timeRemaining)}`}
          </Text>
        </View>

        {/* Info Note */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={GlobalColors.Onboarding.accent}
            style={{marginRight: 8, marginTop: 1}}
          />
          <Text style={styles.infoText}>
            If an account exists for this email, you'll receive a reset link.
            Check your spam folder if you don't see it.
          </Text>
        </View>

        {/* Open Email Button */}
        <TouchableOpacity
          style={styles.openEmailButton}
          onPress={handleOpenEmail}
          activeOpacity={0.85}>
          <MaterialCommunityIcons
            name="email-open-outline"
            size={18}
            color={GlobalColors.Onboarding.buttonText}
            style={{marginRight: 8}}
          />
          <Text style={styles.openEmailButtonText}>Open email app</Text>
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendLabel}>Didn't receive it?</Text>
          {resendAttempts >= MAX_RESEND_ATTEMPTS ? (
            <Text style={styles.resendDisabledText}>
              Too many attempts. Try again in 10 minutes.
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={isResendDisabled}
              activeOpacity={0.7}>
              {isResending ? (
                <ActivityIndicator
                  size="small"
                  color={GlobalColors.Onboarding.accent}
                />
              ) : (
                <Text
                  style={[
                    styles.resendButtonText,
                    isResendDisabled && styles.resendButtonTextDisabled,
                  ]}>
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend email'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Simulate deep link (dev only) */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.devButton}
            onPress={handleSimulateLink}
            activeOpacity={0.7}>
            <Text style={styles.devButtonText}>
              [DEV] Simulate reset link tap
            </Text>
          </TouchableOpacity>
        )}

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backToLoginContainer}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={14}
            color={GlobalColors.Onboarding.accent}
            style={{marginRight: 4}}
          />
          <Text style={styles.backToLoginText}>Back to login</Text>
        </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: GlobalColors.Onboarding.accentSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: GlobalColors.Onboarding.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: GlobalColors.Onboarding.textSecondary,
    lineHeight: 20,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.text,
    marginTop: 4,
    marginBottom: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '500',
    color: GlobalColors.Onboarding.accent,
    marginLeft: 6,
  },
  timerTextExpired: {
    color: GlobalColors.Onboarding.error,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: GlobalColors.Onboarding.accentSurface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.accentBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: GlobalColors.Onboarding.textSecondary,
    lineHeight: 17,
  },
  openEmailButton: {
    flexDirection: 'row',
    backgroundColor: GlobalColors.Onboarding.accent,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  openEmailButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.buttonText,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendLabel: {
    fontSize: 13,
    color: GlobalColors.Onboarding.textSecondary,
    marginBottom: 6,
  },
  resendButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: GlobalColors.Onboarding.accent,
  },
  resendButtonTextDisabled: {
    opacity: 0.5,
  },
  resendDisabledText: {
    fontSize: 12,
    color: GlobalColors.Onboarding.error,
    textAlign: 'center',
  },
  devButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(79, 126, 232, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 126, 232, 0.3)',
    marginBottom: 16,
  },
  devButtonText: {
    fontSize: 11,
    color: GlobalColors.Onboarding.accent,
    fontWeight: '500',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '500',
    color: GlobalColors.Onboarding.accent,
  },
});

export default EmailSentScreen;
