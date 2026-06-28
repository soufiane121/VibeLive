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
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { ChevronBackIcon, PasswordIcons } from '../UIComponents/Icons';
import { useAnalytics } from '../Hooks/useAnalytics';
import { AnalyticsEventType } from '../types/AnalyticsEnums';
import useTranslation from '../Hooks/useTranslation';
import { GlobalColors } from '../styles/GlobalColors';
import {
  useChangePasswordMutation,
} from '../../features/settings/SettingsSliceApi';

const PasswordSettings = () => {
  const navigation = useNavigation();
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, {isLoading: changePasswordLoading}] = useChangePasswordMutation();

  React.useEffect(() => {
    trackEvent(AnalyticsEventType.SCREEN_VIEWED, {
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
        ...(password.length < minLength ? [t('password.requirements.minLength')] : []),
        ...(!hasUpperCase ? [t('password.requirements.uppercase')] : []),
        ...(!hasLowerCase ? [t('password.requirements.lowercase')] : []),
        ...(!hasNumbers ? [t('password.requirements.number')] : []),
        ...(!hasSpecialChar ? [t('password.requirements.special')] : []),
      ]
    };
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('errors.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('errors.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('errors.invalidPassword'));
      return;
    }

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();
      
      if (response.success) {
        Alert.alert(t('common.success'), t('password.changeSuccess'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        trackEvent(AnalyticsEventType.PASSWORD_CHANGED, {
          user_id: currentUser?._id,
        });
      } else {
        Alert.alert(t('common.error'), response.message || t('password.changeFailed'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert(t('common.error'), t('password.changeFailed'));
    }
  };

  const passwordValidation = validatePassword(newPassword);
  const isAppleUser = currentUser?.authProvider === 'apple';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ChevronBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('password.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('password.changePasswordTitle')}</Text>
          <Text style={styles.sectionDescription}>
            {t('password.changePasswordDescription')}
          </Text>
        </View>

        {isAppleUser && (
          <View style={styles.appleBanner}>
            <Text style={styles.appleBannerText}>
              {t('password.appleUserMessage')}
            </Text>
          </View>
        )}

        {/* Current Password */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, isAppleUser && styles.disabledLabel]}>
            {t('password.currentPassword')}
          </Text>
          <View style={[styles.passwordInput, isAppleUser && styles.disabledInput]}>
            <TextInput
              style={styles.textInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t('password.currentPasswordPlaceholder')}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
              editable={!isAppleUser}
            />
            {!isAppleUser && (
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <PasswordIcons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, isAppleUser && styles.disabledLabel]}>
            {t('password.newPassword')}
          </Text>
          <View style={[styles.passwordInput, isAppleUser && styles.disabledInput]}>
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('password.newPasswordPlaceholder')}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              editable={!isAppleUser}
            />
            {!isAppleUser && (
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}>
                <PasswordIcons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Password Strength Indicator */}
          {!isAppleUser && newPassword.length > 0 && (
            <View style={styles.passwordStrength}>
              <Text style={styles.strengthTitle}>{t('password.requirementsTitle')}</Text>
              {[
                {text: t('password.requirements.minLength'), valid: newPassword.length >= 8},
                {
                  text: t('password.requirements.uppercase'),
                  valid: /[A-Z]/.test(newPassword),
                },
                {
                  text: t('password.requirements.lowercase'),
                  valid: /[a-z]/.test(newPassword),
                },
                {text: t('password.requirements.number'), valid: /\d/.test(newPassword)},
                {
                  text: t('password.requirements.special'),
                  valid: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
                },
              ].map((requirement, index) => (
                <View key={index} style={styles.requirementRow}>
                  <Text
                    style={[
                      styles.requirementText,
                      {color: requirement.valid ? colors.success : colors.error},
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
          <Text style={[styles.inputLabel, isAppleUser && styles.disabledLabel]}>
            {t('password.confirmNewPassword')}
          </Text>
          <View style={[styles.passwordInput, isAppleUser && styles.disabledInput]}>
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('password.confirmNewPasswordPlaceholder')}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!isAppleUser}
            />
            {!isAppleUser && (
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <PasswordIcons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <Text style={styles.errorText}>{t('errors.passwordsDoNotMatch')}</Text>
          )}
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[
            styles.changePasswordButton,
            (isAppleUser ||
              !passwordValidation.isValid ||
              newPassword !== confirmPassword ||
              !currentPassword ||
              changePasswordLoading) &&
              styles.disabledButton,
          ]}
          onPress={handleChangePassword}
          disabled={isAppleUser || changePasswordLoading}>
          <Text style={styles.changePasswordText}>
            {changePasswordLoading ? t('password.changing') : t('password.changePasswordButton')}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default PasswordSettings;

const colors = GlobalColors.PasswordSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
    color: colors.text,
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 16,
  },
  passwordStrength: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
  },
  strengthTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
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
    color: colors.error,
    marginTop: 6,
  },
  changePasswordButton: {
    backgroundColor: colors.saveButton,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: colors.disabledButton,
  },
  changePasswordText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  appleBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    backgroundColor: colors.infoBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  appleBannerText: {
    fontSize: 13,
    color: colors.infoText,
    lineHeight: 20,
    textAlign: 'center',
  },
  disabledInput: {
    opacity: 0.5,
  },
  disabledLabel: {
    opacity: 0.5,
  },
});
