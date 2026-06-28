import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {GlobalColors} from '../../../styles/GlobalColors';

const API_BASE = '{{DOMAIN}}';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const maskEmail = (emailStr: string): string => {
    const [localPart, domain] = emailStr.trim().toLowerCase().split('@');
    if (!localPart || !domain) return emailStr;
    const masked =
      localPart.charAt(0) +
      '***' +
      (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : '');
    return `${masked}@${domain}`;
  };

  const handleSubmit = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simulate error for test email
    if (email.trim().toLowerCase() === 'error@test.com') {
      setIsLoading(false);
      setError('Something went wrong. Please try again.');
      return;
    }

    setIsLoading(false);

    // Navigate to email sent screen with masked email
    navigation.navigate('EmailSent', {
      email: email.trim().toLowerCase(),
      maskedEmail: maskEmail(email),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

          {/* Icon */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="lock-reset"
              size={24}
              color={GlobalColors.Onboarding.accent}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>
            No worries. Enter the email associated with your account and we'll
            send you a link to reset your password.
          </Text>

          {/* Email Field */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View
            style={[
              styles.inputContainer,
              error ? styles.inputContainerError : null,
            ]}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color={GlobalColors.Onboarding.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={GlobalColors.Onboarding.textMuted}
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
            />
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={14}
                color={GlobalColors.Onboarding.error}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!email.trim() || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!email.trim() || isLoading}
            activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color={GlobalColors.Onboarding.buttonText} />
            ) : (
              <Text style={styles.submitButtonText}>Send reset link</Text>
            )}
          </TouchableOpacity>

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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
    marginBottom: 32,
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: GlobalColors.Onboarding.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalColors.Onboarding.inputBackground,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 6,
  },
  inputContainerError: {
    borderColor: GlobalColors.Onboarding.error,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: GlobalColors.Onboarding.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: GlobalColors.Onboarding.error,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: GlobalColors.Onboarding.accent,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.buttonText,
  },
  backToLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 24,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '500',
    color: GlobalColors.Onboarding.accent,
  },
});

export default ForgotPasswordScreen;
