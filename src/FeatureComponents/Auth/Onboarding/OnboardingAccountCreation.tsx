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
// import Button from '../../../UIComponents/Button';

interface OnboardingAccountCreationProps {
  navigation: any;
  route: any;
}

const OnboardingAccountCreation: React.FC<OnboardingAccountCreationProps> = ({
  navigation,
  route,
}) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
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
    
    // First name validation
    if (!form.firstName.trim()) {
      newErrors.push('firstName');
    } else if (form.firstName.trim().length < 2) {
      newErrors.push('firstName');
      Alert.alert('Invalid Name', 'First name must be at least 2 characters long.');
      return false;
    }
    
    // Last name validation
    if (!form.lastName.trim()) {
      newErrors.push('lastName');
    } else if (form.lastName.trim().length < 2) {
      newErrors.push('lastName');
      Alert.alert('Invalid Name', 'Last name must be at least 2 characters long.');
      return false;
    }
    
    // Age validation
    if (!form.age.trim()) {
      newErrors.push('age');
      Alert.alert('Age Required', 'Please enter your age to continue.');
      return false;
    }
    
    const ageNum = parseInt(form.age);
    
    // if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
    //   newErrors.push('age');
    //   Alert.alert('Invalid Age', 'Please enter a valid age between 13 and 120.');
    //   return false;
    // }
    
    // Block users under 18 completely
    if (ageNum < 18) {
      newErrors.push('age');
      Alert.alert(
        'Age Restriction', 
        'VibeLive is only available to users 18 years of age or older. We apologize for any inconvenience.'
      );
      return false;
    }
    
    // For users 18+, require checkbox confirmation
    if (ageNum >= 18 && !form.isOver18) {
      newErrors.push('isOver18');
      Alert.alert('Age Confirmation', 'Please confirm you are 18 or older to continue.');
      return false;
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      // Pass the signup data and account creation data to next screen
      const signupData = route.params?.signupData || {};
      navigation.navigate('OnboardingLocationAccess', {
        signupData: {
          ...signupData,
          firstName: form.firstName,
          lastName: form.lastName,
          age: parseInt(form.age),
          isOver18: form.isOver18,
        },
      });
    }
  };

  const getInputStyle = (field: string) => [
    styles.input,
    errors.includes(field) && styles.inputError,
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-left"
            size={24}
            color={GlobalColors.Settings.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          Let's personalize your VibeLive experience
        </Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: '25%'}]} />
        </View>
        <Text style={styles.progressText}>Step 1 of 4</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <View style={styles.nameRow}>
          <View style={styles.nameInputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={getInputStyle('firstName')}
              placeholder="First Name"
              placeholderTextColor={GlobalColors.Settings.textMuted}
              value={form.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              maxLength={15}
              autoCapitalize="words"
            />
            {errors.includes('firstName') && (
              <Text style={styles.errorText}>
                {!form.firstName.trim() ? 'First name is required' : 'First name must be at least 2 characters'}
              </Text>
            )}
          </View>
          <View style={styles.nameInputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={getInputStyle('lastName')}
              placeholder="Enter your last name"
              placeholderTextColor={GlobalColors.Settings.textMuted}
              value={form.lastName}
              onChangeText={text => handleChange('lastName', text)}
              maxLength={15}
              autoCapitalize="words"
            />
            {errors.includes('lastName') && (
              <Text style={styles.errorText}>
                {!form.lastName.trim() ? 'Last name is required' : 'Last name must be at least 2 characters'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={getInputStyle('age')}
            placeholder="Enter your age"
            placeholderTextColor={GlobalColors.Settings.textMuted}
            value={form.age}
            onChangeText={text => handleChange('age', text)}
            keyboardType="numeric"
            maxLength={3}
          />
          {errors.includes('age') && (
            <Text style={styles.errorText}>
              {!form.age.trim() ? 'Age is required' : 'Please enter a valid age (18+)'}
            </Text>
          )}
        </View>

        {/* Age Confirmation for 18+ */}
        {parseInt(form.age) >= 18 && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleChange('isOver18', !form.isOver18)}>
            <View
              style={[
                styles.checkbox,
                form.isOver18 && styles.checkboxChecked,
              ]}>
              {form.isOver18 && (
                <Icon
                  name="check"
                  size={16}
                  color={GlobalColors.Settings.background}
                />
              )}
            </View>
            <Text style={styles.checkboxText}>
              I confirm that I am 18 years of age or older
            </Text>
          </TouchableOpacity>
        )}

        {/* Age Info */}
        <View style={styles.infoContainer}>
          <Icon
            name="information-outline"
            size={20}
            color={GlobalColors.Settings.accent}
          />
          <Text style={styles.infoText}>
            {parseInt(form.age) >= 18
              ? 'You must be 18+ to access all VibeLive features'
              : 'You must be 18 or older to join VibeLive'}
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!form.firstName || !form.lastName || !form.age || (parseInt(form.age) >= 18 && !form.isOver18)) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!form.firstName || !form.lastName || !form.age || (parseInt(form.age) >= 18 && !form.isOver18)}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Settings.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GlobalColors.Settings.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: GlobalColors.Settings.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: GlobalColors.Settings.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GlobalColors.Settings.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: GlobalColors.Settings.textMuted,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  nameInputContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalColors.Settings.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: GlobalColors.Settings.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Settings.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: GlobalColors.Settings.text,
  },
  inputError: {
    borderColor: GlobalColors.Common.errorText,
    borderWidth: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: GlobalColors.Settings.border,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: GlobalColors.Settings.accent,
    borderColor: GlobalColors.Settings.accent,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: GlobalColors.Settings.text,
    lineHeight: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: GlobalColors.Settings.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: GlobalColors.Settings.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingTop: 20,
  },
  continueButton: {
    backgroundColor: GlobalColors.Settings.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: GlobalColors.Settings.border,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalColors.Settings.background,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default OnboardingAccountCreation;
