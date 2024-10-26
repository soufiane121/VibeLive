import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {useNavigation, PartialState} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import LottieAnimation from '../../../UIComponents/LottieAnimation';
import UsefetchLogin from '../../../CustomHooks/UsefetchLogin';
import Button from '../../../UIComponents/Button';

const LoginContainer = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [canFetch, setCanFetch] = useState<boolean>(false);
  const {data, error, isLoading, isSuccess} = UsefetchLogin({
    email,
    password,
    canFetch,
  });
  console.log({data, error, isLoading, isSuccess}, 'container');
  const navigation =
    useNavigation<NativeStackNavigationProp<PartialState<any>>>();

  useEffect(() => {
    // navigation.replace('Bottom');
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-900 justify-center px-8">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {/* <LottieAnimation
        source={require('../../../../assests/logo.json')}
        style={{flex: 2}}
      /> */}
        <View>
          <View className="items-center mb-8">
            <ImageBackground
              source={{uri: 'https://bin.bnbstatic.com/static/images/logo.png'}}
              className="w-24 h-24"
            />
          </View>

          {/* Title */}
          <Text className="text-white text-2xl font-bold text-center mb-8">
            Welcome Back
          </Text>

          <TextInput
            className="bg-gray-800 text-white p-4 rounded-lg mb-4"
            placeholder="Email"
            placeholderTextColor="gray"
            value={email}
            onChangeText={text => setEmail(text)}
            keyboardType="email-address"
          />

          {/* Password Input */}
          <TextInput
            className="bg-gray-800 text-white p-4 rounded-lg mb-6"
            placeholder="Password"
            placeholderTextColor="gray"
            secureTextEntry
            value={password}
            onChangeText={text => setPassword(text)}
          />

          {/* Login Button */}
          {/* <TouchableOpacity
            className="bg-yellow-500 p-4 rounded-lg items-center"
            onPress={() => {
              setCanFetch(true);
            }}>
            <Text className="text-black font-bold text-lg">Login</Text>
          </TouchableOpacity> */}
          <Button
            btnText="Login"
            btnStyle="bg-yellow-500 p-4 rounded-lg items-center"
            textStyle="text-black font-bold text-lg"
            onPress={() => setCanFetch(true)}
          />

          {/* Register Link */}
          <TouchableOpacity className="mt-6">
            <Text className="text-gray-500 text-center">
              Don't have an account?{' '}
              <Text className="text-yellow-500">Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default LoginContainer;
