import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {GlobalColors} from '../../../styles/GlobalColors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useTranslation from '../../../Hooks/useTranslation';

interface OnboardingAccountCreationProps {
  navigation: any;
  route: any;
}

const OnboardingAccountCreation: React.FC<OnboardingAccountCreationProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    isOver18: false,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (key: string, value: string | boolean) => {
    setForm({...form, [key]: value});
    if (errors.includes(key)) {
      setErrors(errors.filter(e => e !== key));
    }
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!form.firstName.trim()) {
      newErrors.push('firstName');
    } else if (form.firstName.trim().length < 2) {
      newErrors.push('firstName');
      Alert.alert(t('onboarding.invalidName'), t('onboarding.firstNameMinLength'));
      return false;
    }

    if (!form.lastName.trim()) {
      newErrors.push('lastName');
    } else if (form.lastName.trim().length < 2) {
      newErrors.push('lastName');
      Alert.alert(t('onboarding.invalidName'), t('onboarding.lastNameMinLength'));
      return false;
    }

    if (!form.age.trim()) {
      newErrors.push('age');
      Alert.alert(t('onboarding.ageRequired'), t('onboarding.enterAgeToContinue'));
      return false;
    }

    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum < 18) {
      newErrors.push('age');
      Alert.alert(
        t('onboarding.ageRestriction'),
        t('onboarding.ageRestrictionDesc')
      );
      return false;
    }

    if (!form.gender) {
      newErrors.push('gender');
      Alert.alert(t('onboarding.genderRequired'), t('onboarding.genderRequired'));
      return false;
    }

    if (!form.isOver18) {
      newErrors.push('isOver18');
      Alert.alert(t('onboarding.ageConfirmation'), t('onboarding.confirmAge18'));
      return false;
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      const signupData = route.params?.signupData || {};
      navigation.navigate('OnboardingLocationAccess', {
        signupData: {
          ...signupData,
          firstName: form.firstName,
          lastName: form.lastName,
          age: parseInt(form.age),
          gender: form.gender,
          isOver18: form.isOver18,
        },
      });
    }
  };

  const isFormValid = form.firstName.trim().length >= 2 && form.lastName.trim().length >= 2 && form.age.trim().length > 0 && parseInt(form.age) >= 18 && !!form.gender && form.isOver18;

  const getInputStyle = (field: string) => [
    styles.input,
    errors.includes(field) && styles.inputError,
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled">
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarsRow}>
          <View style={[styles.progressBar, styles.progressBarActive]} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>
        <Text style={styles.progressText}>{t('onboarding.step1Of4')}</Text>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{t('onboarding.tellAboutYourself')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.personalizeExperience')}
        </Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <View style={styles.nameRow}>
          <View style={styles.nameInputContainer}>
            <Text style={styles.label}>{t('onboarding.firstName')}</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="account-outline"
                size={18}
                color={GlobalColors.Onboarding.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[getInputStyle('firstName'), styles.inputWithIcon]}
                placeholder={t('onboarding.firstNamePlaceholder')}
                placeholderTextColor={GlobalColors.Onboarding.textMuted}
                value={form.firstName}
                onChangeText={(text) => handleChange('firstName', text)}
                maxLength={15}
                autoCapitalize="words"
              />
            </View>
            {errors.includes('firstName') && (
              <Text style={styles.errorText}>
                {!form.firstName.trim() ? t('onboarding.firstNameRequired') : t('onboarding.firstNameMinChars')}
              </Text>
            )}
          </View>
          <View style={styles.nameInputContainer}>
            <Text style={styles.label}>{t('onboarding.lastName')}</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="account-outline"
                size={18}
                color={GlobalColors.Onboarding.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[getInputStyle('lastName'), styles.inputWithIcon]}
                placeholder={t('onboarding.lastNamePlaceholder')}
                placeholderTextColor={GlobalColors.Onboarding.textMuted}
                value={form.lastName}
                onChangeText={text => handleChange('lastName', text)}
                maxLength={15}
                autoCapitalize="words"
              />
            </View>
            {errors.includes('lastName') && (
              <Text style={styles.errorText}>
                {!form.lastName.trim() ? t('onboarding.lastNameRequired') : t('onboarding.lastNameMinChars')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('onboarding.age')}</Text>
          <View style={styles.inputWrapper}>
            <Icon
              name="calendar-blank-outline"
              size={18}
              color={GlobalColors.Onboarding.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[getInputStyle('age'), styles.inputWithIcon]}
              placeholder={t('onboarding.agePlaceholder')}
              placeholderTextColor={GlobalColors.Onboarding.textMuted}
              value={form.age}
              onChangeText={text => handleChange('age', text)}
              keyboardType="numeric"
              maxLength={3}
            />
            {parseInt(form.age) >= 18 && !errors.includes('age') && (
              <Icon
                name="check-circle"
                size={20}
                color={GlobalColors.Onboarding.success}
                style={styles.successIcon}
              />
            )}
          </View>
          {errors.includes('age') && (
            <Text style={styles.errorText}>
              {!form.age.trim() ? t('onboarding.ageRequired') : t('onboarding.ageValid18')}
            </Text>
          )}
        </View>

        {/* Gender Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('onboarding.gender')}</Text>
          <View style={styles.genderRow}>
            {(['male', 'female', 'nonBinary', 'preferNotToSay'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderChip,
                  form.gender === g && styles.genderChipSelected,
                  errors.includes('gender') && !form.gender && styles.genderChipError,
                ]}
                onPress={() => handleChange('gender', g)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.genderChipText,
                    form.gender === g && styles.genderChipTextSelected,
                  ]}>
                  {t(`onboarding.gender${g.charAt(0).toUpperCase() + g.slice(1)}` as any)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.includes('gender') && (
            <Text style={styles.errorText}>{t('onboarding.genderRequired')}</Text>
          )}
        </View>

        {/* Age Requirement Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoIconCircle}>
            <Icon
              name="information"
              size={16}
              color={GlobalColors.Onboarding.infoIcon}
            />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>{t('onboarding.ageRequirement')}</Text>
            <Text style={styles.infoDescription}>
              {t('onboarding.mustBe18Prefix')}
              <Text style={styles.infoHighlight}> {t('onboarding.mustBe18Highlight')} </Text>
              {t('onboarding.mustBe18Suffix')}
            </Text>
          </View>
        </View>

        {/* Age Confirmation Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleChange('isOver18', !form.isOver18)}
          activeOpacity={0.8}>
          <View
            style={[
              styles.checkbox,
              form.isOver18 && styles.checkboxChecked,
            ]}>
            {form.isOver18 && (
              <Icon
                name="check"
                size={14}
                color={GlobalColors.Onboarding.background}
              />
            )}
          </View>
          <Text style={styles.checkboxText}>
            {t('onboarding.confirm18Checkbox')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isFormValid && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isFormValid}
          activeOpacity={0.8}>
          <Text style={[styles.continueButtonText, !isFormValid && styles.continueButtonTextDisabled]}>
            {t('common.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Onboarding.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  progressContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  progressBarsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: GlobalColors.Onboarding.surfaceSecondary,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: GlobalColors.Onboarding.accent,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: GlobalColors.Onboarding.accent,
    letterSpacing: 0.5,
  },
  titleSection: {
    marginBottom: 32,
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
  formContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  nameInputContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: GlobalColors.Onboarding.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalColors.Onboarding.inputBackground,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: GlobalColors.Onboarding.text,
    height: '100%',
    paddingVertical: 0,
  },
  inputWithIcon: {
    paddingHorizontal: 0,
  },
  successIcon: {
    marginLeft: 8,
  },
  inputError: {
    borderColor: GlobalColors.Onboarding.error,
    borderWidth: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GlobalColors.Onboarding.infoIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: GlobalColors.Onboarding.text,
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 13,
    color: GlobalColors.Onboarding.textSecondary,
    lineHeight: 18,
  },
  infoHighlight: {
    color: GlobalColors.Onboarding.accent,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  continueButton: {
    backgroundColor: GlobalColors.Onboarding.buttonBackground,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
  },
  continueButtonDisabled: {
    backgroundColor: GlobalColors.Onboarding.buttonDisabled,
    borderColor: GlobalColors.Onboarding.borderSecondary,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.buttonText,
  },
  continueButtonTextDisabled: {
    color: GlobalColors.Onboarding.buttonDisabledText,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: GlobalColors.Onboarding.border,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: GlobalColors.Onboarding.accent,
    borderColor: GlobalColors.Onboarding.accent,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: GlobalColors.Onboarding.textSecondary,
    lineHeight: 20,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  genderChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.inputBorder,
    backgroundColor: GlobalColors.Onboarding.inputBackground,
  },
  genderChipSelected: {
    borderColor: GlobalColors.Onboarding.accent,
    backgroundColor: GlobalColors.Onboarding.accent + '20',
  },
  genderChipError: {
    borderColor: GlobalColors.Onboarding.error,
  },
  genderChipText: {
    fontSize: 14,
    color: GlobalColors.Onboarding.textSecondary,
    fontWeight: '500',
  },
  genderChipTextSelected: {
    color: GlobalColors.Onboarding.accent,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: GlobalColors.Onboarding.error,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default OnboardingAccountCreation;
