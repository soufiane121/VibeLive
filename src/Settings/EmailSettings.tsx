import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { ChevronBackIcon, ChevronForwardIcon, MailIcon, MailOutlineIcon, NotificationsIcon, ShieldCheckmarkIcon, CheckmarkIcon } from '../UIComponents/Icons';
import { useAnalytics } from '../Hooks/useAnalytics';
import useTranslation from '../Hooks/useTranslation';
import {
  useChangeEmailMutation,
  useVerifyEmailMutation,
} from '../../features/settings/SettingsSliceApi';
import { setCurrentUser } from '../../features/registrations/CurrentUser';

const EmailSettings = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [changeEmail, {isLoading: changeEmailLoading}] = useChangeEmailMutation();
  const [verifyEmail, {isLoading: verifyEmailLoading}] = useVerifyEmailMutation();
  const [verificationSent, setVerificationSent] = useState(false);

  React.useEffect(() => {
    trackEvent('app_opened', {
      screen_name: 'EmailSettings',
      user_id: currentUser?._id,
    });
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidEmail = (email: string) => {
    return validateEmail(email);
  };

  const handleSendVerification = async () => {
    if (!validateEmail(currentUser.email)) {
      Alert.alert(t('common.error'), t('errors.invalidEmail'));
      return;
    }

    try {
      // In a real implementation, you would call an API to send verification email
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVerificationSent(true);
      
      trackEvent('email_verification_sent', {
        user_id: currentUser?._id,
      });

      Alert.alert(
        t('email.verificationSent'),
        t('email.verificationSentDesc')
      );
    } catch (error: any) {
      console.error('Error sending verification:', error);
      Alert.alert(t('common.error'), t('email.verificationFailed'));
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      const response = await verifyEmail({
        verificationCode,
      }).unwrap();
      
      if (response.success) {
        // Update Redux store
        const updatedUser = {
          ...currentUser,
          accountSettings: {
            ...currentUser?.accountSettings,
            emailVerified: true,
          },
        };
        dispatch(setCurrentUser(updatedUser));
        
        Alert.alert(t('common.success'), t('email.verifySuccess'));
        setVerificationCode('');
        
        trackEvent('email_verified', {
          user_id: currentUser?._id,
        });
      } else {
        Alert.alert(t('common.error'), response.message || t('email.verifyFailed'));
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      Alert.alert(t('common.error'), t('email.verifyFailed'));
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !password) {
      Alert.alert(t('common.error'), t('errors.fillAllFields'));
      return;
    }

    if (!isValidEmail(newEmail)) {
      Alert.alert(t('common.error'), t('errors.invalidEmail'));
      return;
    }

    try {
      const response = await changeEmail({
        newEmail,
        password,
      }).unwrap();
      
      if (response.success) {
        Alert.alert(t('common.success'), t('email.changeSuccess'));
        setNewEmail('');
        setPassword('');
        
        trackEvent('email_change_requested', {
          user_id: currentUser?._id,
          new_email: newEmail,
        });
      } else {
        Alert.alert(t('common.error'), response.message || t('email.changeFailed'));
      }
    } catch (error) {
      console.error('Error changing email:', error);
      Alert.alert(t('common.error'), t('email.changeFailed'));
    }
  };

  const isEmailVerified = currentUser?.accountSettings?.emailVerified || false;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronBackIcon size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.sections.email.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Email */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('email.currentEmail')}</Text>
          <Text style={styles.sectionDescription}>
            {t('email.currentEmailDesc')}
          </Text>
        </View>

        <View style={styles.emailContainer}>
          <View style={styles.emailInfo}>
            <MailIcon size={20} color="#8b5cf6" />
            <View style={styles.emailDetails}>
              <Text style={styles.emailAddress}>{currentUser?.email}</Text>
              <View style={styles.verificationStatus}>
                <CheckmarkIcon
                  size={16}
                  color={isEmailVerified ? '#059669' : '#dc2626'}
                />
                <Text style={[
                  styles.verificationText,
                  { color: isEmailVerified ? '#059669' : '#dc2626' }
                ]}>
                  {isEmailVerified ? t('common.verified') : t('common.notVerified')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Email Verification */}
        {!isEmailVerified && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('email.verification')}</Text>
              <Text style={styles.sectionDescription}>
                {t('email.verificationDesc')}
              </Text>
            </View>

            {!verificationSent ? (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleSendVerification}
                disabled={false}
              >
                <MailOutlineIcon size={20} color="#fff" />
                <Text style={styles.verifyButtonText}>
                  {t('email.sendVerification')}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.verificationContainer}>
                <Text style={styles.inputLabel}>{t('email.verificationCode')}</Text>
                <TextInput
                  style={styles.codeInput}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder={t('email.codePlaceholder')}
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!verificationCode || verificationCode.length < 6 || verifyEmailLoading) && styles.disabledButton
                  ]}
                  onPress={handleVerifyEmail}
                  disabled={verifyEmailLoading || !verificationCode || verificationCode.length < 6}
                >
                  <Text style={styles.submitButtonText}>
                    {verifyEmailLoading ? t('email.verifying') : t('email.verifyEmail')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => {
                    setVerificationSent(false);
                    setVerificationCode('');
                  }}
                >
                  <Text style={styles.resendText}>{t('email.sendNewCode')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Change Email */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('email.changeEmail')}</Text>
          <Text style={styles.sectionDescription}>
            {t('email.changeEmailDesc')}
          </Text>
        </View>

        <View style={styles.changeEmailContainer}>
          <Text style={styles.inputLabel}>{t('email.newEmail')}</Text>
          <TextInput
            style={styles.emailInput}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder={t('email.newEmailPlaceholder')}
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputLabel}>{t('common.password')}</Text>
          <TextInput
            style={styles.emailInput}
            value={password}
            onChangeText={setPassword}
            placeholder={t('email.passwordPlaceholder')}
            placeholderTextColor="#6b7280"
            secureTextEntry={true}
          />
          <TouchableOpacity
            style={[
              styles.changeEmailButton,
              (!newEmail || !password || !isValidEmail(newEmail) || changeEmailLoading) && styles.disabledButton
            ]}
            onPress={handleChangeEmail}
            disabled={changeEmailLoading || !newEmail || !password || !isValidEmail(newEmail)}
          >
            <Text style={styles.changeEmailButtonText}>
              {changeEmailLoading ? t('email.changing') : t('email.changeEmailButton')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('email.preferences')}</Text>
          <Text style={styles.sectionDescription}>
            {t('email.preferencesDesc')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.preferencesButton}
          onPress={() => navigation.navigate('NotificationSettings' as never)}
        >
          <View style={styles.preferencesLeft}>
            <View style={styles.iconContainer}>
              <NotificationsIcon size={20} color="#fff" />
            </View>
            <Text style={styles.preferencesText}>{t('email.notifications')}</Text>
          </View>
          <ChevronForwardIcon size={20} color="#6b7280" />
        </TouchableOpacity>

        {/* Security Info */}
        <View style={styles.securitySection}>
          <View style={styles.securityHeader}>
            <ShieldCheckmarkIcon size={24} color="#8b5cf6" />
            <Text style={styles.securityTitle}>{t('email.securityTitle')}</Text>
          </View>
          <Text style={styles.securityText}>
            • {t('email.tips.recovery')}{'\n'}
            • {t('email.tips.verify')}{'\n'}
            • {t('email.tips.privacy')}{'\n'}
            • {t('email.tips.spam')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmailSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  emailContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  emailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  emailDetails: {
    marginLeft: 15,
    flex: 1,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  verificationContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#374151',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
  },
  changeEmailContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emailInput: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  changeEmailButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  changeEmailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  preferencesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  preferencesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  preferencesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  securitySection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  securityText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
});
