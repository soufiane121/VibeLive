import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useSendVerificationCodeMutation,
  useVerifyEmailCodeMutation,
} from '../../../features/registrations/LoginSliceApi';
import useTranslation from '../../Hooks/useTranslation';
import {GlobalColors} from '../../styles/GlobalColors';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

interface EmailVerificationScreenProps {
  navigation: any;
  route: any;
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const {t} = useTranslation();
  const signupData = route.params?.signupData || {};
  const email = signupData.email || '';

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [codeSentMessage, setCodeSentMessage] = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sendVerificationCode, {isLoading: isSending}] =
    useSendVerificationCodeMutation();
  const [verifyEmailCode, {isLoading: isVerifying}] =
    useVerifyEmailCodeMutation();

  // Cooldown timer
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
  }, [resendCooldown > 0 ? 1 : 0]); // restart only when transitioning 0 → positive

  const handleDigitChange = (text: string, index: number) => {
    setError('');
    setCodeSentMessage('');

    // Handle paste — if the user pastes 6 digits into any field
    if (text.length > 1) {
      const cleaned = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
      if (cleaned.length === CODE_LENGTH) {
        const newDigits = cleaned.split('');
        setDigits(newDigits);
        inputRefs.current[CODE_LENGTH - 1]?.focus();
        return;
      }
    }

    const digit = text.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const code = digits.join('');
  const isCodeComplete = code.length === CODE_LENGTH;

  const handleVerify = useCallback(async () => {
    if (!isCodeComplete || isVerifying) return;

    try {
      const result = await verifyEmailCode({email, code}).unwrap();
      if (result.verified) {
        navigation.navigate('OnboardingAccountCreation', {signupData});
      }
    } catch (err: any) {
      const serverError = err?.data?.error || '';
      const serverMessage = err?.data?.message || '';

      if (serverError === 'TOO_MANY_ATTEMPTS') {
        setError(t('auth.emailVerification.tooManyAttempts'));
        setDigits(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else if (serverError === 'EXPIRED') {
        setError(t('auth.emailVerification.codeExpired'));
        setDigits(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else if (serverError === 'INVALID_CODE') {
        setError(serverMessage || t('auth.emailVerification.invalidCode'));
        setDigits(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else {
        setError(t('auth.emailVerification.serverError'));
      }
    }
  }, [code, isCodeComplete, isVerifying, email, signupData]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || isSending) return;

    try {
      await sendVerificationCode({email}).unwrap();
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setDigits(Array(CODE_LENGTH).fill(''));
      setError('');
      setCodeSentMessage(t('auth.emailVerification.codeSent'));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const serverError = err?.data?.error || '';
      if (serverError === 'TOO_MANY_REQUESTS') {
        setError(t('auth.emailVerification.tooManyRequests'));
      } else {
        setError(t('auth.emailVerification.sendFailed'));
      }
    }
  }, [resendCooldown, isSending, email]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={GlobalColors.Onboarding.textSecondary}
          />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="email-check-outline"
            size={24}
            color={GlobalColors.Onboarding.accent}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {t('auth.emailVerification.title')}
        </Text>
        <Text style={styles.subtitle}>
          {t('auth.emailVerification.subtitle')}
        </Text>
        <Text style={styles.emailText}>{email}</Text>

        {/* Code inputs */}
        <View style={styles.codeRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : {},
                error ? styles.codeInputError : {},
              ]}
              value={digit}
              onChangeText={text => handleDigitChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? CODE_LENGTH : 1}
              selectTextOnFocus
              textContentType="oneTimeCode"
              autoComplete={index === 0 ? 'sms-otp' : 'off'}
              placeholderTextColor={GlobalColors.Onboarding.textMuted}
            />
          ))}
        </View>

        {/* Error / success messages */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        {codeSentMessage && !error ? (
          <Text style={styles.successText}>{codeSentMessage}</Text>
        ) : null}

        {/* Verify button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (!isCodeComplete || isVerifying) && styles.verifyButtonDisabled,
          ]}
          onPress={handleVerify}
          disabled={!isCodeComplete || isVerifying}
          activeOpacity={0.85}>
          {isVerifying ? (
            <ActivityIndicator color={GlobalColors.Onboarding.buttonText} />
          ) : (
            <Text style={styles.verifyButtonText}>
              {t('auth.emailVerification.verify')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend section */}
        <View style={styles.resendSection}>
          <Text style={styles.didntReceiveText}>
            {t('auth.emailVerification.didntReceive')}
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCooldown > 0 || isSending}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.resendText,
                resendCooldown > 0 && styles.resendTextDisabled,
              ]}>
              {resendCooldown > 0
                ? t('auth.emailVerification.resendIn', {
                    seconds: resendCooldown,
                  })
                : t('auth.emailVerification.resendCode')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.checkSpamText}>
          {t('auth.emailVerification.checkSpam')}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Onboarding.background,
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GlobalColors.Onboarding.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: GlobalColors.Onboarding.accent,
    marginBottom: 36,
    marginTop: 4,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: GlobalColors.Onboarding.inputBackground,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.inputBorder,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: GlobalColors.Onboarding.text,
  },
  codeInputFilled: {
    borderColor: GlobalColors.Onboarding.accent,
    backgroundColor: GlobalColors.Onboarding.accentSurface,
  },
  codeInputError: {
    borderColor: GlobalColors.Onboarding.error,
  },
  errorText: {
    color: GlobalColors.Onboarding.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  successText: {
    color: GlobalColors.Onboarding.success,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  verifyButton: {
    backgroundColor: GlobalColors.Onboarding.accent,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.buttonText,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  didntReceiveText: {
    fontSize: 13,
    color: GlobalColors.Onboarding.textSecondary,
    marginBottom: 6,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalColors.Onboarding.accent,
  },
  resendTextDisabled: {
    color: GlobalColors.Onboarding.textMuted,
  },
  checkSpamText: {
    fontSize: 12,
    color: GlobalColors.Onboarding.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EmailVerificationScreen;
