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
import {
  useChangeEmailMutation,
  useVerifyEmailMutation,
} from '../../features/settings/SettingsSliceApi';
import { setCurrentUser } from '../../features/registrations/CurrentUser';

const EmailSettings = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
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
      Alert.alert('Error', 'Please enter a valid email address');
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
        'Verification Sent',
        'A verification code has been sent to your email address. Please check your inbox and enter the code below.'
      );
    } catch (error: any) {
      console.error('Error sending verification:', error);
      Alert.alert('Error', 'Failed to send verification email. Please try again.');
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
        
        Alert.alert('Success', 'Email verified successfully');
        setVerificationCode('');
        
        trackEvent('email_verified', {
          user_id: currentUser?._id,
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to verify email');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      Alert.alert('Error', 'Failed to verify email');
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(newEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const response = await changeEmail({
        newEmail,
        password,
      }).unwrap();
      
      if (response.success) {
        Alert.alert('Success', 'Email change request sent. Please check your new email for verification.');
        setNewEmail('');
        setPassword('');
        
        trackEvent('email_change_requested', {
          user_id: currentUser?._id,
          new_email: newEmail,
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to change email');
      }
    } catch (error) {
      console.error('Error changing email:', error);
      Alert.alert('Error', 'Failed to change email');
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
        <Text style={styles.headerTitle}>Email Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Email */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Email</Text>
          <Text style={styles.sectionDescription}>
            Your email address is used for account recovery and important notifications
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
                  {isEmailVerified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Email Verification */}
        {!isEmailVerified && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email Verification</Text>
              <Text style={styles.sectionDescription}>
                Verify your email to secure your account and receive important updates
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
                  {'Send Verification Email'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.verificationContainer}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <TextInput
                  style={styles.codeInput}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter 6-digit code"
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
                    {verifyEmailLoading ? 'Verifying...' : 'Verify Email'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => {
                    setVerificationSent(false);
                    setVerificationCode('');
                  }}
                >
                  <Text style={styles.resendText}>Send New Code</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Change Email */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Email Address</Text>
          <Text style={styles.sectionDescription}>
            Update your email address. You'll need to verify the new address.
          </Text>
        </View>

        <View style={styles.changeEmailContainer}>
          <Text style={styles.inputLabel}>New Email Address</Text>
          <TextInput
            style={styles.emailInput}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email address"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.emailInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
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
              {changeEmailLoading ? 'Changing...' : 'Change Email'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Preferences</Text>
          <Text style={styles.sectionDescription}>
            Manage what types of emails you receive
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
            <Text style={styles.preferencesText}>Email Notifications</Text>
          </View>
          <ChevronForwardIcon size={20} color="#6b7280" />
        </TouchableOpacity>

        {/* Security Info */}
        <View style={styles.securitySection}>
          <View style={styles.securityHeader}>
            <ShieldCheckmarkIcon size={24} color="#8b5cf6" />
            <Text style={styles.securityTitle}>Email Security</Text>
          </View>
          <Text style={styles.securityText}>
            • Keep your email address up to date for account recovery{'\n'}
            • Verify your email to enable all security features{'\n'}
            • We'll never share your email with third parties{'\n'}
            • Check your spam folder if you don't receive verification emails
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
