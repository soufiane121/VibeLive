import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import {useAppleAuthMutation} from '../../../../features/registrations/LoginSliceApi';
import {setLocalData} from '../../../Utils/LocalStorageHelper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useTranslation from '../../../Hooks/useTranslation';
import {GlobalColors} from '../../../styles/GlobalColors';
import { AppleIcon } from '../../../UIComponents/Icons';
import {TokenManager} from '../../../Services/TokenManager';
import {USE_DUAL_TOKEN_AUTH} from '../../../Config/AppConfig';

const SignUpContainer = ({navigation}) => {
  const [appleAuth, {isLoading: isAppleLoading}] = useAppleAuthMutation();
  const {t} = useTranslation();

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const result = await appleAuth({
        identityToken: credential.identityToken,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        phone: null,
      }).unwrap();

      if (result?.data?.email) {
        await setLocalData({key: 'token', value: result.data.email});
        await setLocalData({key: 'isAuthenticated', value: 'true'});
        if (USE_DUAL_TOKEN_AUTH && result.data.tokenPair) {
          await TokenManager.setTokens(result.data.tokenPair);
        }
        navigation.navigate('OnboardingAccountCreation', {
          signupData: {
            userName: result.data.userName || '',
            email: result.data.email,
            phoneNumber: result.data.phoneNumber || '',
            appleAuth: true,
          },
        });
      }
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      Alert.alert(
        t('auth.signup.appleSignInError'),
        t('auth.signup.appleSignInErrorDesc'),
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
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

        {/* Sign in with Apple */}
        <TouchableOpacity
          style={styles.appleButton}
          onPress={handleAppleSignIn}
          activeOpacity={0.85}
          disabled={isAppleLoading}>
          {isAppleLoading ? (
            <ActivityIndicator color={GlobalColors.Onboarding.background} />
          ) : (
            <View style={styles.buttonContent}>
              {/* <Text style={styles.appleIcon}></Text> */}
              <AppleIcon style={styles.appleIcon}  />
              <Text style={styles.appleButtonText}>
                {t('auth.signup.signInWithApple')}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* OR Divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>{t('auth.signup.or')}</Text>
          <View style={styles.orLine} />
        </View>

        {/* Sign up with Email */}
        <TouchableOpacity
          style={styles.emailButton}
          onPress={() => navigation.navigate('sign-up-email')}
          activeOpacity={0.85}>
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color={GlobalColors.Onboarding.text}
              style={styles.emailIcon}
            />
            <Text style={styles.emailButtonText}>
              {t('auth.signup.signUpWithEmail')}
            </Text>
          </View>
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

        {/* Terms note */}
        <View style={styles.termsNoteContainer}>
          <Text style={styles.termsNoteText}>
            {t('auth.signup.continueAgreement')}{' '}
            <Text style={styles.termsNoteLink}>{t('auth.signup.termsOfService')}</Text>
            {' '}{t('auth.signup.and')}{' '}
            <Text style={styles.termsNoteLink}>{t('auth.signup.privacyPolicy')}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Onboarding.background,
    justifyContent: 'center',
  },
  inner: {
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
  appleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalColors.Onboarding.text,
    borderRadius: 12,
    height: 50,
    marginBottom: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appleIcon: {
    fontSize: 18,
    color: GlobalColors.Onboarding.background,
    marginRight: 8,
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.background,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: GlobalColors.Onboarding.border,
  },
  orText: {
    fontSize: 12,
    color: GlobalColors.Onboarding.textMuted,
    marginHorizontal: 12,
  },
  emailButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalColors.Onboarding.inputBackground,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.inputBorder,
    borderRadius: 12,
    height: 50,
    marginBottom: 32,
  },
  emailIcon: {
    marginRight: 8,
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.text,
  },
  loginContainer: {
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
  termsNoteContainer: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
  },
  termsNoteText: {
    fontSize: 11,
    color: GlobalColors.Onboarding.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsNoteLink: {
    fontSize: 11,
    fontWeight: '600',
    color: GlobalColors.Onboarding.accent,
  },
});

export default SignUpContainer;
