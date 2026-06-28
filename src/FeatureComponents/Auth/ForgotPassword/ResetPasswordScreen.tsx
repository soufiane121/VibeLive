import React, {useState, useMemo} from 'react';
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
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {GlobalColors} from '../../../styles/GlobalColors';

const API_BASE = '{{DOMAIN}}';

interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  {label: 'At least 8 characters', test: (p: string) => p.length >= 8},
  {label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p)},
  {label: 'One number', test: (p: string) => /[0-9]/.test(p)},
  {
    label: 'One special character',
    test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p),
  },
];

type PasswordStrength = 'none' | 'weak' | 'fair' | 'strong';

const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return 'none';
  const passedRules = PASSWORD_RULES.filter(rule => rule.test(password)).length;
  if (passedRules <= 1) return 'weak';
  if (passedRules <= 3) return 'fair';
  return 'strong';
};

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  none: GlobalColors.Onboarding.border,
  weak: '#EF4444',
  fair: '#F59E0B',
  strong: '#10B981',
};

const STRENGTH_LABELS: Record<PasswordStrength, string> = {
  none: '',
  weak: 'Weak',
  fair: 'Fair',
  strong: 'Strong',
};

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const {email, token} = route.params || {};

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const allRulesPassed = useMemo(
    () => PASSWORD_RULES.every(rule => rule.test(newPassword)),
    [newPassword],
  );

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const canSubmit = allRulesPassed && passwordsMatch && !isLoading;

  const handleSubmit = async () => {
    setError('');

    if (!canSubmit) return;

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simulate error for specific token
    if (token === 'expired-token') {
      setIsLoading(false);
      setError('This reset link has expired. Please request a new one.');
      return;
    }

    setIsLoading(false);

    // Navigate to success
    navigation.navigate('ResetSuccess');
  };

  const strengthBarWidth = (): string => {
    switch (strength) {
      case 'weak':
        return '33%';
      case 'fair':
        return '66%';
      case 'strong':
        return '100%';
      default:
        return '0%';
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
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

          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={24}
                color={GlobalColors.Onboarding.accent}
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>Create new password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from your previously used
              password.
            </Text>

            {/* New Password Field */}
            <Text style={styles.label}>NEW PASSWORD</Text>
            <View
              style={[
                styles.inputContainer,
                error ? styles.inputContainerError : null,
              ]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={18}
                color={GlobalColors.Onboarding.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={GlobalColors.Onboarding.textMuted}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={text => {
                  setNewPassword(text);
                  if (error) setError('');
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={GlobalColors.Onboarding.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarTrack}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        width: strengthBarWidth() as any,
                        backgroundColor: STRENGTH_COLORS[strength],
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    {color: STRENGTH_COLORS[strength]},
                  ]}>
                  {STRENGTH_LABELS[strength]}
                </Text>
              </View>
            )}

            {/* Password Rules Checklist */}
            <View style={styles.rulesContainer}>
              {PASSWORD_RULES.map((rule, index) => {
                const passed = rule.test(newPassword);
                return (
                  <View key={index} style={styles.ruleRow}>
                    <MaterialCommunityIcons
                      name={passed ? 'check-circle' : 'circle-outline'}
                      size={16}
                      color={
                        passed
                          ? '#10B981'
                          : GlobalColors.Onboarding.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        passed && styles.ruleTextPassed,
                      ]}>
                      {rule.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Confirm Password Field */}
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View
              style={[
                styles.inputContainer,
                confirmPassword.length > 0 &&
                  !passwordsMatch &&
                  styles.inputContainerError,
              ]}>
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={18}
                color={GlobalColors.Onboarding.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={GlobalColors.Onboarding.textMuted}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={text => {
                  setConfirmPassword(text);
                  if (error) setError('');
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name={
                    showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
                  }
                  size={18}
                  color={GlobalColors.Onboarding.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Passwords match indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchContainer}>
                <MaterialCommunityIcons
                  name={passwordsMatch ? 'check-circle' : 'close-circle'}
                  size={14}
                  color={passwordsMatch ? '#10B981' : GlobalColors.Onboarding.error}
                />
                <Text
                  style={[
                    styles.matchText,
                    {
                      color: passwordsMatch
                        ? '#10B981'
                        : GlobalColors.Onboarding.error,
                    },
                  ]}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}

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
                !canSubmit && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}>
              {isLoading ? (
                <ActivityIndicator
                  color={GlobalColors.Onboarding.buttonText}
                />
              ) : (
                <Text style={styles.submitButtonText}>Reset password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Onboarding.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,
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
    marginBottom: 28,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  strengthBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: GlobalColors.Onboarding.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 10,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 50,
  },
  rulesContainer: {
    marginBottom: 20,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ruleText: {
    fontSize: 12,
    color: GlobalColors.Onboarding.textMuted,
    marginLeft: 8,
  },
  ruleTextPassed: {
    color: '#10B981',
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  matchText: {
    fontSize: 12,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
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
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.buttonText,
  },
});

export default ResetPasswordScreen;
