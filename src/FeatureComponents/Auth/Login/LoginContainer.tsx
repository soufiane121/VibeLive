import React, {useState, useCallback} from 'react';
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
import {useNavigation, PartialState} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useLoginMutation} from '../../../../features/registrations/LoginSliceApi';
import {setLocalData} from '../../../Utils/LocalStorageHelper';
import {useDispatch} from 'react-redux';
import {setCurrentUser} from '../../../../features/registrations/CurrentUser';
import useTranslation from '../../../Hooks/useTranslation';
import {GlobalColors} from '../../../styles/GlobalColors';

const LoginContainer = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyLogin, {isLoading}] = useLoginMutation();
  const navigation =
    useNavigation<NativeStackNavigationProp<PartialState<any>>>();
  const dispatch = useDispatch();
  const {t} = useTranslation();

  const handleLogin = useCallback(async () => {
    if (email && password) {
      try {
        const answer = await verifyLogin({password, email}).unwrap();
        console.log({answer});

        if (answer.data) {
          await setLocalData({key: 'token', value: answer.data.email});
          dispatch(setCurrentUser(answer.data));

          navigation.replace('Bottom');
        }
      } catch (error) {
        console.log({error});
      }
    }
  }, [email, password, verifyLogin, dispatch, navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Logo Icon */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="video"
              size={24}
              color={GlobalColors.Onboarding.accent}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('auth.login.title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.login.subtitle')}
          </Text>

          {/* Email Field */}
          <Text style={styles.label}>{t('auth.login.emailLabel')}</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color={GlobalColors.Onboarding.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t('auth.login.emailPlaceholder')}
              placeholderTextColor={GlobalColors.Onboarding.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Field */}
          <Text style={styles.label}>{t('auth.login.passwordLabel')}</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={18}
              color={GlobalColors.Onboarding.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, {flex: 1}]}
              placeholder={t('auth.login.passwordPlaceholder')}
              placeholderTextColor={GlobalColors.Onboarding.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={GlobalColors.Onboarding.textMuted}
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}>
            <Text style={styles.forgotText}>
              {t('auth.login.forgotPassword')}
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              (!email || !password || isLoading) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!email || !password || isLoading}
            activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color={GlobalColors.Onboarding.buttonText} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.loginButtonText}>
                  {t('auth.login.loginButton')}
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

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerContainer}
            onPress={() => navigation.navigate('sign-up')}
            activeOpacity={0.7}>
            <Text style={styles.registerText}>
              {t('auth.login.noAccount')}{' '}
              <Text style={styles.registerLink}>
                {t('auth.login.signUpLink')}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <View style={styles.privacyContainer}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={12}
              color={GlobalColors.Onboarding.textMuted}
              style={{marginRight: 4}}
            />
            <Text style={styles.privacyText}>
              {t('auth.login.privacyNote')}
            </Text>
          </View>
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
  inputIcon: {
    marginRight: 10,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    color: GlobalColors.Onboarding.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
    color: GlobalColors.Onboarding.accent,
  },
  loginButton: {
    backgroundColor: GlobalColors.Onboarding.accent,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.buttonText,
  },
  registerContainer: {
    marginTop: 24,
    alignSelf: 'center',
  },
  registerText: {
    fontSize: 13,
    color: GlobalColors.Onboarding.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: GlobalColors.Onboarding.accent,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,
  },
  privacyText: {
    fontSize: 11,
    color: GlobalColors.Onboarding.textMuted,
  },
});

export default React.memo(LoginContainer);
