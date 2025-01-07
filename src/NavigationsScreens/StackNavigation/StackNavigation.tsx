import {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginContainer from '../../FeatureComponents/Auth/Login/LoginContainer';
import BottomNavigation from '../BottomTap/BottomNavigation';
import {useAutoLoginMutation} from '../../../features/registrations/LoginSliceApi';
import {
  setCurrentUser,
} from '../../../features/registrations/CurrentUser';
import {useDispatch} from 'react-redux';
import useGetLocation from '../../CustomHooks/useGetLocation';
import {Alert} from 'react-native';
const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const {coordinates} = useGetLocation();
  const [autoLoginFetch, {data, isSuccess}] = useAutoLoginMutation();

  const dispatch = useDispatch();
  useEffect(() => {
    if (!data) {
      fetchAutoLogin();
    }
  }, []);

  const fetchAutoLogin = async () => {
    try {
      const res = await autoLoginFetch({coordinates}).unwrap();
      if (res.data._id) {
        dispatch(setCurrentUser(data?.data));
      }
    } catch (error) {
      // Alert.alert(error as string);
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'fade',
        headerBackVisible: false,
        headerShown: false,
      }}>
      {!isSuccess && data?.['_id'] && (
        <Stack.Screen name="Login" component={LoginContainer} />
      )}
      <Stack.Screen name="Bottom" component={BottomNavigation} />
    </Stack.Navigator>
  );
};
export default StackNavigation;
