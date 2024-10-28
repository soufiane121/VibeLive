import {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginContainer from '../../FeatureComponents/Auth/Login/LoginContainer';
import BottomNavigation from '../BottomTap/BottomNavigation';
import {useAutoLoginQuery} from '../../../features/registrations/LoginSliceApi';
import {
  CurrentUserTypes,
  setCurrentUser,
} from '../../../features/registrations/CurrentUser';
import {useDispatch} from 'react-redux';
const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const {data,  isSuccess} = useAutoLoginQuery('');
  const dispatch = useDispatch();
  useEffect(() => {
    if (isSuccess) {
      dispatch(setCurrentUser(data?.data ) );
    }
  }, [isSuccess]);

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
