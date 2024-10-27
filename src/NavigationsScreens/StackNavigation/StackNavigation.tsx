import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginContainer from '../../FeatureComponents/Auth/Login/LoginContainer';
import BottomNavigation from '../BottomTap/BottomNavigation';
import {useAutoLoginQuery} from '../../../features/registrations/LoginSliceApi';
const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const {data, error, isLoading, isSuccess} = useAutoLoginQuery("");
  console.log({data, isSuccess, isLoading});
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'fade',
        headerBackVisible: false,
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={LoginContainer} />
      <Stack.Screen name="Bottom" component={BottomNavigation} />
    </Stack.Navigator>
  );
};
export default StackNavigation;
