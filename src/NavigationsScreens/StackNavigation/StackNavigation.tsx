import {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginContainer from '../../FeatureComponents/Auth/Login/LoginContainer';
import BottomNavigation from '../BottomTap/BottomNavigation';
import {useAutoLoginMutation} from '../../../features/registrations/LoginSliceApi';
import {setCurrentUser} from '../../../features/registrations/CurrentUser';
import {useDispatch} from 'react-redux';
import useGetLocation from '../../CustomHooks/useGetLocation';
import StreamPlayer from '../../WatchStream/StreamPlayer';
import CarrouselContainer from '../../Carrousel/CarrouselContainer';
import SignUpContainer from '../../FeatureComponents/Auth/SignUp/SignUpContainer';
// Settings Screens
import NotificationSettings from '../../Settings/NotificationSettings';
import PrivacySettings from '../../Settings/PrivacySettings';
import StreamingPreferences from '../../Settings/StreamingPreferences';
import BlockedUsers from '../../Settings/BlockedUsers';
import PasswordSettings from '../../Settings/PasswordSettings';
import EmailSettings from '../../Settings/EmailSettings';
// Ad Creation Screens
import CreateAdFlow from '../../Ads/CreateAd/CreateAdFlow';
import AdTypeSelection from '../../Ads/CreateAd/AdTypeSelection';
import AdMediaUpload from '../../Ads/CreateAd/AdMediaUpload';
import AdTargeting from '../../Ads/CreateAd/AdTargeting';
import AdPricing from '../../Ads/CreateAd/AdPricing';
import AdPreview from '../../Ads/CreateAd/AdPreview';
import AdPayment from '../../Ads/CreateAd/AdPayment';
import AdSuccess from '../../Ads/CreateAd/AdSuccess';
import AdDashboard from '../../Ads/AdDashboard/AdDashboard';
const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const dispatch = useDispatch();
  const {coordinates} = useGetLocation();
  const [autoLoginFetch, {data, isSuccess}] = useAutoLoginMutation();

  useEffect(() => {
    if (!data) {
      fetchAutoLogin();
    }
  }, [data]);

  const fetchAutoLogin = async () => {
    
    try {
      const res = await autoLoginFetch({coordinates}).unwrap();
      console.log('fetchAutoLogin -------------------------------------', {res});
      if (res?.data?._id) {
        dispatch(setCurrentUser(res?.data));
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
        <>
          <Stack.Screen name="Login" component={LoginContainer} />
          <Stack.Screen
            name="sign-up"
            component={SignUpContainer}
            options={{headerShown: false}}
          />
        </>
      )}
      <Stack.Screen name="Bottom" component={BottomNavigation} />
      <Stack.Screen name="StreamPlayer" component={StreamPlayer} />
      <Stack.Screen name="carrouselSwiper" component={CarrouselContainer} />
      {/* Settings Screens */}
      <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettings} />
      <Stack.Screen name="StreamingPreferences" component={StreamingPreferences} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsers} />
      <Stack.Screen name="PasswordSettings" component={PasswordSettings} />
      <Stack.Screen name="EmailSettings" component={EmailSettings} />
      {/* Ad Creation Screens */}
      <Stack.Screen name="CreateAdFlow" component={CreateAdFlow} />
      <Stack.Screen name="AdTypeSelection" component={AdTypeSelection} />
      <Stack.Screen name="AdMediaUpload" component={AdMediaUpload} />
      <Stack.Screen name="AdTargeting" component={AdTargeting} />
      <Stack.Screen name="AdPricing" component={AdPricing} />
      <Stack.Screen name="AdPreview" component={AdPreview} />
      <Stack.Screen name="AdPayment" component={AdPayment} />
      <Stack.Screen name="AdSuccess" component={AdSuccess} />
      <Stack.Screen name="AdDashboard" component={AdDashboard} />
    </Stack.Navigator>
  );
};
export default StackNavigation;
