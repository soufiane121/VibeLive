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
import UsefetchLogin from '../../../CustomHooks/useIsAuthenticated';
import Button from '../../../UIComponents/Button';
import {useAutoLoginQuery, useLoginMutation} from '../../../../features/registrations/LoginSliceApi';
import {getLocalData, setLocalData} from '../../../Utils/LocalStorageHelper';
import LoadingAnimation from '../../../UIComponents/LoadingAnimation';

const LoginContainer = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyLogin, {isError, data, isLoading, isSuccess}] =
    useLoginMutation();
  const navigation =
    useNavigation<NativeStackNavigationProp<PartialState<any>>>();

    

  const handleLogin = async () => {
    if (email && password) {
      try {
        const answer = await verifyLogin({password, email}).unwrap();
        if (answer.data) {
          await setLocalData({key: 'token', value: answer.data.email});
          navigation.replace('Bottom');
        }
      } catch (error) {
        console.log({error});
      }
    }
  };



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
          <Button
            btnText="Login"
            btnStyle="disabled:bg-slate-50 bg-yellow-500 p-4 rounded-lg items-center"
            textStyle="text-black font-bold text-lg"
            onPress={handleLogin}
            disabled={isLoading}
            children={<LoadingAnimation  />}
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
