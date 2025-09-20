import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSignUpMutation, useValidateFieldsMutation} from '../../../../features/registrations/LoginSliceApi';
import {useDispatch} from 'react-redux';
import {setCurrentUser} from '../../../../features/registrations/CurrentUser';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../../../UIComponents/Button';

const COLORS = {
  primary: '#FF2D55',
  background: '#181818',
  input: '#222',
  text: '#fff',
  accent: '#FFD600',
  error: '#FF2D55',
};

const requiredFields = [
  'userName',
  'email',
  'password',
  'confirmPassword',
  'phoneNumber',
];

const SignUpContainer = ({navigation}) => {
  const [form, setForm] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    coordinates: [0, 0], // Default, replace with real location if available
  });
  const [loading, setLoading] = useState(false);
  const [signUp, {isLoading}] = useSignUpMutation();
  const [validateFields, {isLoading: isValidationPass}] = useValidateFieldsMutation();
  const dispatch = useDispatch();
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (key, value) => {
    setForm({...form, [key]: value});
    if (missingFields.includes(key)) {
      setMissingFields(missingFields.filter(f => f !== key));
    }
    // Clear field-specific errors when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSignUp = async () => {
    const emptyFields = requiredFields.filter(field => !form[field]);
    setMissingFields(emptyFields);

    if (emptyFields.length > 0) {
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMissingFields(prev => [
        ...new Set([...prev, 'password', 'confirmPassword']),
      ]);
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
      return;
    }

    // Validate unique fields before proceeding
    try {
      const validationResult = await validateFields({
        userName: form.userName,
        email: form.email,
        phoneNumber: form.phoneNumber,
      }).unwrap();

      if (!validationResult.isValid) {
        const errors = validationResult.errors || {};
        const errorFields = Object.keys(errors);
        setMissingFields(errorFields);
        setFieldErrors(errors);
        return;
      } else {
        // If validation passes, navigate to onboarding flow
        navigation.navigate('OnboardingAccountCreation', {
          signupData: {
            userName: form.userName,
            email: form.email,
            password: form.password,
            phoneNumber: form.phoneNumber,
            coordinates: form.coordinates,
          },
        });

      }


    } catch (error: any) {
      console.log('Validation error:', error);
      // Handle validation error response
      if (error?.data?.errors) {
        const errors = error.data.errors;
        const errorFields = Object.keys(errors);
        setMissingFields(errorFields);
        setFieldErrors(errors);
      } else {
        setFieldErrors(prev => ({
          ...prev,
          general: 'Failed to validate account information. Please try again.'
        }));
      }
    }
  };

  const getInputStyle = (field: string) => [
    styles.input,
    (missingFields.includes(field) || fieldErrors[field]) && {
      borderColor: '#FF2D55',
      borderWidth: 2,
    },
  ];

  return (
    <View
      style={styles.container}
      className="flex-1 bg-gray-900 justify-center px-8">
      <Text style={styles.title} className="text-yellow-500">
        Create Account
      </Text>
      {/* Username and Email in the same row */}
      <View style={styles.row}>
        <View style={styles.halfContainer}>
          <TextInput
            style={[getInputStyle('userName'), styles.halfInput]}
            placeholder="Username"
            placeholderTextColor="#888"
            value={form.userName}
            onChangeText={text => handleChange('userName', text)}
            autoCapitalize="none"
          />
          {fieldErrors.userName && (
            <Text style={styles.errorText}>{fieldErrors.userName}</Text>
          )}
        </View>
        <View style={styles.halfContainer}>
          <TextInput
            style={[getInputStyle('email'), styles.halfInput]}
            placeholder="Email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={text => handleChange('email', text)}
          />
          {fieldErrors.email && (
            <Text style={styles.errorText}>{fieldErrors.email}</Text>
          )}
        </View>
      </View>
      {/* The rest in column */}
      <TextInput
        style={[getInputStyle('phoneNumber'), styles.fullInput]}
        className="bg-gray-800 text-white p-4 rounded-lg mb-4"
        placeholder="Phone Number"
        placeholderTextColor="#888"
        keyboardType="phone-pad"
        value={form.phoneNumber}
        onChangeText={text => handleChange('phoneNumber', text)}
      />
      {fieldErrors.phoneNumber && (
        <Text style={styles.errorText}>{fieldErrors.phoneNumber}</Text>
      )}
      {/* Password with eye icon */}
      <View style={[
        styles.passwordContainer,
        (missingFields.includes('password') || fieldErrors.password) && {
          borderColor: '#FF2D55',
          borderWidth: 2,
        }
      ]}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={text => handleChange('password', text)}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>
      {fieldErrors.password && (
        <Text style={styles.errorText}>{fieldErrors.password}</Text>
      )}
      <View style={[
        styles.passwordContainer,
        (missingFields.includes('confirmPassword') || fieldErrors.confirmPassword) && {
          borderColor: '#FF2D55',
          borderWidth: 2,
        }
      ]}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry={!showConfirmPassword}
          value={form.confirmPassword}
          onChangeText={text => handleChange('confirmPassword', text)}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon
            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>
      {fieldErrors.confirmPassword && (
        <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>
      )}
      {fieldErrors.general && (
        <Text style={[styles.errorText, {textAlign: 'center', marginVertical: 10}]}>
          {fieldErrors.general}
        </Text>
      )}
      <Button
        btnText="Sign Up"
        btnStyle="disabled:bg-slate-50 bg-yellow-500 p-4 rounded-lg items-center w-full"
        textStyle="text-black font-bold text-lg"
        onPress={handleSignUp}
        disabled={isValidationPass}
      />
      <TouchableOpacity
        className="mt-6"
        onPress={() => navigation.navigate('Login')}>
        <Text className="text-gray-500 text-center">
          You have an account already?{' '}
          <Text className="text-yellow-500">Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    width: '95%',
    marginBottom: 16,
  },
  halfInput: {
    // flex: 1,
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    // marginBottom: 16,
    marginLeft: 0
  },
  fullInput: {
    width: '95%',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '95%',
    marginBottom: 16,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    color: '#ffffff',
    backgroundColor: '#1f2937',
    borderRadius: 8,
  },
  eyeIcon: {
    paddingHorizontal: 10,
  },
  button: {
    width: '95%',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  linkText: {
    color: COLORS.accent,
    marginTop: 12,
    fontSize: 16,
    paddingTop: 18,
  },
  input: {
    borderRadius: 8,
    marginBottom: 0,
    borderWidth: 0,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    padding: 14,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    color: COLORS.text,
    justifyContent: 'center',
    // marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 4,
  },
  halfContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default SignUpContainer;
