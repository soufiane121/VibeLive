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
import {useSignUpMutation} from '../../../../features/registrations/LoginSliceApi';
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
  const [postSignUp, {isLoading, isSuccess, error, data}] = useSignUpMutation();
  const dispatch = useDispatch();
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (key, value) => {
    setForm({...form, [key]: value});
    if (missingFields.includes(key)) {
      setMissingFields(missingFields.filter(f => f !== key));
    }
  };

  const handleSignUp = async () => {
    const emptyFields = requiredFields.filter(field => !form[field]);
    setMissingFields(emptyFields);

    if (emptyFields.length > 0) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMissingFields(prev => [
        ...new Set([...prev, 'password', 'confirmPassword']),
      ]);
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await postSignUp({
        userName: form.userName,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber,
        coordinates: form.coordinates,
      }).unwrap();
      setLoading(false);
      dispatch(setCurrentUser(res.data));
    } catch (err) {
      setLoading(false);
    }
    if (isSuccess) {
      console.log('Sign Up Successful:', data);
    } else if (error) {
      console.error('Sign Up Error:', error);
    }
  };

  const getInputStyle = (field: string) => [
    styles.input,
    missingFields.includes(field) && {
      borderColor: COLORS.error,
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
        <TextInput
          style={[getInputStyle('userName'), styles.halfInput]}
          className="bg-gray-800 text-white p-4 rounded-lg mb-4"
          placeholder="Username"
          placeholderTextColor="#888"
          value={form.userName}
          onChangeText={text => handleChange('userName', text)}
        />
        <TextInput
          style={[getInputStyle('email'), styles.halfInput, {marginLeft: 10}]}
          placeholder="Email"
          className="bg-gray-800 text-white p-4 rounded-lg mb-4"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={text => handleChange('email', text)}
        />
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
      {/* Password with eye icon */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={[getInputStyle('password'), styles.passwordInput]}
          placeholder="Password"
          className="bg-gray-800 text-white p-4 rounded-lg mb-4"
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
      <View style={styles.passwordContainer}>
        <TextInput
          style={[getInputStyle('confirmPassword'), styles.passwordInput]}
          placeholder="Confirm Password"
          className="bg-gray-800 text-white p-4 rounded-lg mb-4"
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
      <Button
        btnText="Sign Up"
        btnStyle="disabled:bg-slate-50 bg-yellow-500 p-4 rounded-lg items-center w-full"
        textStyle="text-black font-bold text-lg"
        onPress={handleSignUp}
        disabled={loading}
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
    flex: 1,
    borderRadius: 8,
    padding: 14,
  },
  fullInput: {
    width: '95%',
    borderRadius: 8,
    padding: 14,
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
    color: COLORS.text,
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
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    color: COLORS.text,
    justifyContent: 'center',
    // marginTop: 16,
    fontSize: 16,
  },
});

export default SignUpContainer;
