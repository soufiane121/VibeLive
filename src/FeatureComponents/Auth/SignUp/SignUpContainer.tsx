import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useValidateFieldsMutation, useSendVerificationCodeMutation} from '../../../../features/registrations/LoginSliceApi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useTranslation from '../../../Hooks/useTranslation';
import {GlobalColors} from '../../../styles/GlobalColors';

const requiredFields = [
  'userName',
  'email',
  'password',
  'confirmPassword',
  'phoneNumber',
];

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

const SignUpContainer = ({navigation}) => {
  const [form, setForm] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [validateFields, {isLoading: isValidationPass}] = useValidateFieldsMutation();
  const [sendVerificationCode, {isLoading: isSendingCode}] = useSendVerificationCodeMutation();
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {t} = useTranslation();

  const formatPhoneNumber = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleChange = (key: string, value: string) => {
    const nextValue = key === 'phoneNumber' ? formatPhoneNumber(value) : value;
    setForm({...form, [key]: nextValue});
    if (missingFields.includes(key)) {
      setMissingFields(missingFields.filter(f => f !== key));
    }
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSignUp = async () => {
    const emptyFields = requiredFields.filter(
      field => !form[field as keyof typeof form],
    );
    setMissingFields(emptyFields);

    if (emptyFields.length > 0 || !agreedToTerms) {
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMissingFields(prev => [...new Set([...prev, 'password', 'confirmPassword'])]);
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: t('errors.passwordsDoNotMatch'),
      }));
      return;
    }

    try {
      const validationResult = await validateFields({
        userName: form.userName,
        email: form.email,
        phoneNumber: form.phoneNumber.replace(/\D/g, ''),
      }).unwrap();

      if (!validationResult.isValid) {
        const errors = validationResult.errors || {};
        const errorFields = Object.keys(errors);
        setMissingFields(errorFields);
        setFieldErrors(errors);
        return;
      }

      // Send verification code before navigating
      try {
        await sendVerificationCode({email: form.email}).unwrap();
      } catch (sendErr: any) {
        const sendError = sendErr?.data?.error || '';
        if (sendError === 'TOO_MANY_REQUESTS') {
          setFieldErrors(prev => ({
            ...prev,
            general: t('auth.emailVerification.tooManyRequests'),
          }));
        } else {
          setFieldErrors(prev => ({
            ...prev,
            general: t('auth.emailVerification.sendFailed'),
          }));
        }
        return;
      }

      navigation.navigate('EmailVerification', {
        signupData: {
          userName: form.userName,
          email: form.email,
          password: form.password,
          phoneNumber: form.phoneNumber.replace(/\D/g, ''),
        },
      });
    } catch (error: any) {
      console.log('Validation error:', error);
      if (error?.data?.errors) {
        const errors = error.data.errors;
        const errorFields = Object.keys(errors);
        setMissingFields(errorFields);
        setFieldErrors(errors);
      } else {
        setFieldErrors(prev => ({
          ...prev,
          general: t('auth.signup.validationFailed'),
        }));
      }
    }
  };

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const allRulesPassed = useMemo(() => PASSWORD_RULES.every(rule => rule.test(form.password)), [form.password]);

  const isFormValid =
    requiredFields.every(field => !!form[field as keyof typeof form]) &&
    agreedToTerms &&
    allRulesPassed;

  const isSubmitting = isValidationPass || isSendingCode;

  const getInputBorder = (field: string) =>
    missingFields.includes(field) || fieldErrors[field]
      ? {borderColor: GlobalColors.Onboarding.error}
      : {};

  const renderError = (field: string) =>
    fieldErrors[field] ? <Text style={styles.errorText}>{fieldErrors[field]}</Text> : null;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
      {/* Icon */}
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name="account-plus"
          size={24}
          color={GlobalColors.Onboarding.accent}
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>{t('auth.signup.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>

      {/* Username & Email Row */}
      <View style={styles.row}>
        <View style={styles.halfColumn}>
          <Text style={styles.label}>{t('auth.signup.usernameLabel')}</Text>
          <View style={[styles.inputContainer, getInputBorder('userName')]}>
            <MaterialCommunityIcons
              name="account-outline"
              size={18}
              color={GlobalColors.Onboarding.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t('auth.signup.usernamePlaceholder')}
              placeholderTextColor={GlobalColors.Onboarding.textMuted}
              value={form.userName}
              onChangeText={text => handleChange('userName', text)}
              autoCapitalize="none"
            />
          </View>
          {renderError('userName')}
        </View>
        <View style={styles.halfColumn}>
          <Text style={styles.label}>{t('auth.signup.emailLabel')}</Text>
          <View style={[styles.inputContainer, getInputBorder('email')]}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color={GlobalColors.Onboarding.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t('auth.signup.emailPlaceholder')}
              placeholderTextColor={GlobalColors.Onboarding.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={text => handleChange('email', text)}
            />
          </View>
          {renderError('email')}
        </View>
      </View>
      {/* Phone Number */}
      <Text style={styles.label}>{t('auth.signup.phoneLabel')}</Text>
      <View style={[styles.inputContainer, getInputBorder('phoneNumber')]}>
        <MaterialCommunityIcons
          name="phone-outline"
          size={18}
          color={GlobalColors.Onboarding.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.signup.phonePlaceholder')}
          placeholderTextColor={GlobalColors.Onboarding.textMuted}
          keyboardType="phone-pad"
          value={form.phoneNumber}
          onChangeText={text => handleChange('phoneNumber', text)}
        />
      </View>
      {renderError('phoneNumber')}

      {/* Password */}
      <Text style={styles.label}>{t('auth.signup.passwordLabel')}</Text>
      <View style={[styles.inputContainer, getInputBorder('password')]}>
        <MaterialCommunityIcons
          name="lock-outline"
          size={18}
          color={GlobalColors.Onboarding.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, {flex: 1}]}
          placeholder={t('auth.signup.passwordPlaceholder')}
          placeholderTextColor={GlobalColors.Onboarding.textMuted}
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={text => handleChange('password', text)}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.7}>
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={GlobalColors.Onboarding.textMuted}
          />
        </TouchableOpacity>
      </View>
      {/* Password Strength Indicator */}
      {form.password.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBarTrack}>
            <View
              style={[
                styles.strengthBarFill,
                {
                  width:
                    passwordStrength === 'weak'
                      ? '33%'
                      : passwordStrength === 'fair'
                      ? '66%'
                      : passwordStrength === 'strong'
                      ? '100%'
                      : '0%',
                  backgroundColor: STRENGTH_COLORS[passwordStrength],
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.strengthLabel,
              {color: STRENGTH_COLORS[passwordStrength]},
            ]}>
            {STRENGTH_LABELS[passwordStrength]}
          </Text>
        </View>
      )}

      {/* Password Rules Checklist */}
      <View style={styles.rulesContainer}>
        {PASSWORD_RULES.map((rule, index) => {
          const passed = rule.test(form.password);
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

      {renderError('password')}

      {/* Confirm Password */}
      <Text style={styles.label}>{t('auth.signup.confirmPasswordLabel')}</Text>
      <View style={[styles.inputContainer, getInputBorder('confirmPassword')]}>
        <MaterialCommunityIcons
          name="lock-check-outline"
          size={18}
          color={GlobalColors.Onboarding.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, {flex: 1}]}
          placeholder={t('auth.signup.confirmPasswordPlaceholder')}
          placeholderTextColor={GlobalColors.Onboarding.textMuted}
          secureTextEntry={!showConfirmPassword}
          value={form.confirmPassword}
          onChangeText={text => handleChange('confirmPassword', text)}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          activeOpacity={0.7}>
          <MaterialCommunityIcons
            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={GlobalColors.Onboarding.textMuted}
          />
        </TouchableOpacity>
      </View>
      {renderError('confirmPassword')}

      {/* Passwords match indicator */}
      {form.confirmPassword.length > 0 && (
        <View style={styles.matchContainer}>
          <MaterialCommunityIcons
            name={
              form.password === form.confirmPassword
                ? 'check-circle'
                : 'close-circle'
            }
            size={14}
            color={
              form.password === form.confirmPassword
                ? '#10B981'
                : GlobalColors.Onboarding.error
            }
          />
          <Text
            style={[
              styles.matchText,
              {
                color:
                  form.password === form.confirmPassword
                    ? '#10B981'
                    : GlobalColors.Onboarding.error,
              },
            ]}>
            {form.password === form.confirmPassword
              ? 'Passwords match'
              : 'Passwords do not match'}
          </Text>
        </View>
      )}

      {fieldErrors.general && (
        <Text style={[styles.errorText, {textAlign: 'center', marginVertical: 10}]}>
          {fieldErrors.general}
        </Text>
      )}

      {/* Terms Checkbox */}
      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        activeOpacity={0.7}>
        <View
          style={[
            styles.checkbox,
            agreedToTerms && styles.checkboxChecked,
          ]}>
          {agreedToTerms && (
            <MaterialCommunityIcons
              name="check"
              size={12}
              color={GlobalColors.Onboarding.text}
            />
          )}
        </View>
        <Text style={styles.termsText}>
          {t('auth.signup.agreeTerms')}
          <Text
            style={styles.termsLink}
            onPress={() => navigation.navigate('TermsOfService')}>
            {t('auth.signup.termsOfService')}
          </Text>
          {' '}{t('auth.signup.and')}{' '}
          <Text
            style={styles.termsLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}>
            {t('auth.signup.privacyPolicy')}
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={[
          styles.signUpButton,
          (!isFormValid || isSubmitting) && styles.signUpButtonDisabled,
        ]}
        onPress={handleSignUp}
        disabled={!isFormValid || isSubmitting}
        activeOpacity={0.85}>
        {isSubmitting ? (
          <ActivityIndicator color={GlobalColors.Onboarding.buttonText} />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.signUpButtonText}>
              {t('auth.signup.signUpButton')}
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color={GlobalColors.Onboarding.buttonText}
              style={{marginLeft: 6}}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity
        style={styles.loginContainer}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.7}>
        <Text style={styles.loginText}>
          {t('auth.signup.hasAccount')}{' '}
          <Text style={styles.loginLink}>{t('auth.signup.loginLink')}</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Onboarding.background,
  },
  contentContainer: {
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120,
    flexGrow: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  halfColumn: {
    flex: 1,
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
  errorText: {
    color: GlobalColors.Onboarding.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    backgroundColor: GlobalColors.Onboarding.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: GlobalColors.Onboarding.accent,
    borderColor: GlobalColors.Onboarding.accent,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: GlobalColors.Onboarding.textSecondary,
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 12,
    fontWeight: '600',
    color: GlobalColors.Onboarding.accent,
  },
  signUpButton: {
    backgroundColor: GlobalColors.Onboarding.accent,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.buttonText,
  },
  loginContainer: {
    marginTop: 24,
    alignSelf: 'center',
  },
  loginText: {
    fontSize: 13,
    color: GlobalColors.Onboarding.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '600',
    color: GlobalColors.Onboarding.accent,
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
    marginBottom: 12,
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
});

export default SignUpContainer;
