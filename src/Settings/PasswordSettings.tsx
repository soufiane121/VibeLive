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
  Switch,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { ChevronBackIcon, ShieldCheckmarkIcon, CheckmarkIcon, InformationCircleIcon, BulbIcon, PasswordIcons } from '../UIComponents/Icons';
import { useAnalytics } from '../Hooks/useAnalytics';
import {
  useChangePasswordMutation,
  useToggleTwoFactorMutation,
} from '../../features/settings/SettingsSliceApi';

const PasswordSettings = () => {
  const navigation = useNavigation();
  const { trackEvent } = useAnalytics();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, {isLoading: changePasswordLoading}] = useChangePasswordMutation();
  const [toggleTwoFactor, {isLoading: toggleTwoFactorLoading}] = useToggleTwoFactorMutation();

  React.useEffect(() => {
    trackEvent('app_opened', {
      screen_name: 'PasswordSettings',
      user_id: currentUser?._id,
    });
  }, []);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: [
        ...(password.length < minLength ? ['At least 8 characters'] : []),
        ...(!hasUpperCase ? ['One uppercase letter'] : []),
        ...(!hasLowerCase ? ['One lowercase letter'] : []),
        ...(!hasNumbers ? ['One number'] : []),
        ...(!hasSpecialChar ? ['One special character'] : []),
      ]
    };
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();
      
      if (response.success) {
        Alert.alert('Success', 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        trackEvent('password_changed', {
          user_id: currentUser?._id,
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleToggleTwoFactor = async (enabled: boolean) => {
    try {
      await toggleTwoFactor(enabled);
      
      trackEvent('two_factor_toggled', {
        enabled,
        user_id: currentUser?._id,
      });

      Alert.alert(
        'Success',
        `Two-factor authentication has been ${enabled ? 'enabled' : 'disabled'}.`
      );
    } catch (error: any) {
      console.error('Error toggling two-factor:', error);
      Alert.alert('Error', error.message || 'Failed to update two-factor authentication.');
    }
  };

  const passwordValidation = validatePassword(newPassword);
  const twoFactorEnabled = currentUser?.accountSettings?.twoFactorEnabled || false;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ChevronBackIcon size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Text style={styles.sectionDescription}>
            Create a strong password to keep your account secure
          </Text>
        </View>

        {/* Current Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Current Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.textInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <PasswordIcons
                name={showCurrentPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>New Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}>
              <PasswordIcons
                name={showNewPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <View style={styles.passwordStrength}>
              <Text style={styles.strengthTitle}>Password Requirements:</Text>
              {[
                {text: 'At least 8 characters', valid: newPassword.length >= 8},
                {
                  text: 'One uppercase letter',
                  valid: /[A-Z]/.test(newPassword),
                },
                {
                  text: 'One lowercase letter',
                  valid: /[a-z]/.test(newPassword),
                },
                {text: 'One number', valid: /\d/.test(newPassword)},
                {
                  text: 'One special character',
                  valid: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
                },
              ].map((requirement, index) => (
                <View key={index} style={styles.requirementRow}>
                  {/* <Icon
                    name={requirement.valid ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={requirement.valid ? '#059669' : '#dc2626'}
                  /> */}
                  <Text
                    style={[
                      styles.requirementText,
                      {color: requirement.valid ? '#059669' : '#dc2626'},
                    ]}>
                    {requirement.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <PasswordIcons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[
            styles.changePasswordButton,
            (!passwordValidation.isValid ||
              newPassword !== confirmPassword ||
              !currentPassword ||
              changePasswordLoading) &&
              styles.disabledButton,
          ]}
          onPress={handleChangePassword}
          disabled={changePasswordLoading || toggleTwoFactorLoading}>
          <Text style={styles.changePasswordText}>
            {changePasswordLoading ? 'Changing Password...' : 'Change Password'}
          </Text>
        </TouchableOpacity>

        {/* Two-Factor Authentication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
          <Text style={styles.sectionDescription}>
            Add an extra layer of security to your account
          </Text>
        </View>

        <View style={styles.twoFactorContainer}>
          <View style={styles.twoFactorLeft}>
            <View style={styles.iconContainer}>
              <ShieldCheckmarkIcon size={20} color="#fff" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingSubtitle}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'} • Secure your
                account with 2FA
              </Text>
            </View>
          </View>
          <Switch
            value={twoFactorEnabled}
            onValueChange={handleToggleTwoFactor}
            trackColor={{false: '#374151', true: '#8b5cf6'}}
            thumbColor={twoFactorEnabled ? '#fff' : '#9ca3af'}
          />
        </View>

        {/* Security Tips */}
        <View style={styles.securitySection}>
          <View style={styles.securityHeader}>
            <BulbIcon size={24} color="#8b5cf6" />
            <Text style={styles.securityTitle}>Security Tips</Text>
          </View>
          <Text style={styles.securityText}>
            • Use a unique password that you don't use elsewhere{'\n'}• Enable
            two-factor authentication for extra security{'\n'}• Change your
            password regularly{'\n'}• Never share your password with anyone
            {'\n'}• Use a password manager to generate and store secure
            passwords
          </Text>
        </View>

        {/* Account Info */}
        <View style={styles.accountInfo}>
          <Text style={styles.accountInfoTitle}>Account Security Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Email Verified:</Text>
            <Text
              style={[
                styles.statusValue,
                {
                  color: currentUser?.accountSettings?.emailVerified
                    ? '#059669'
                    : '#dc2626',
                },
              ]}>
              {currentUser?.accountSettings?.emailVerified
                ? '✓ Verified'
                : '⚠️ Not Verified'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Two-Factor Auth:</Text>
            <Text
              style={[
                styles.statusValue,
                {color: twoFactorEnabled ? '#059669' : '#dc2626'},
              ]}>
              {twoFactorEnabled ? '✓ Enabled' : '⚠️ Disabled'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Password Change:</Text>
            <Text style={styles.statusValue}>
              {currentUser?.accountSettings?.lastPasswordChange
                ? new Date(
                    currentUser.accountSettings.lastPasswordChange,
                  ).toLocaleDateString()
                : 'Unknown'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PasswordSettings;

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
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  eyeButton: {
    padding: 16,
  },
  passwordStrength: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
  },
  strengthTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 13,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 6,
  },
  changePasswordButton: {
    backgroundColor: '#8b5cf6',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#374151',
  },
  changePasswordText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  twoFactorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  twoFactorLeft: {
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
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
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
  accountInfo: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  accountInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
