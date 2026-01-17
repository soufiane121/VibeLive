import {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginContainer from '../../FeatureComponents/Auth/Login/LoginContainer';
import BottomNavigation from '../BottomTap/BottomNavigation';
import {
  useAutoLoginMutation,
  useSingOutMutation,
} from '../../../features/registrations/LoginSliceApi';
import {setCurrentUser} from '../../../features/registrations/CurrentUser';
import {useDispatch} from 'react-redux';
import useGetLocation from '../../CustomHooks/useGetLocation';
import StreamPlayer from '../../WatchStream/StreamPlayer';
import CarrouselContainer from '../../Carrousel/CarrouselContainer';
import SignUpContainer from '../../FeatureComponents/Auth/SignUp/SignUpContainer';
// Onboarding Screens
import OnboardingAccountCreation from '../../FeatureComponents/Auth/Onboarding/OnboardingAccountCreation';
import OnboardingLocationAccess from '../../FeatureComponents/Auth/Onboarding/OnboardingLocationAccess';
import OnboardingInterests from '../../FeatureComponents/Auth/Onboarding/OnboardingInterests';
import OnboardingNotifications from '../../FeatureComponents/Auth/Onboarding/OnboardingNotifications';
// Settings Screens
import NotificationSettings from '../../Settings/NotificationSettings';
import PrivacySettings from '../../Settings/PrivacySettings';
import StreamingPreferences from '../../Settings/StreamingPreferences';
import BlockedUsers from '../../Settings/BlockedUsers';
import PasswordSettings from '../../Settings/PasswordSettings';
import EmailSettings from '../../Settings/EmailSettings';
// Events Screens
import EventDetailsScreen from '../../FeatureComponents/Events/EventDetailsScreen';
import EventCreationFlow from '../../FeatureComponents/Events/EventCreationFlow';
// LiveStream Screens
import SubcategorySelection from '../../LiveStream/SubcategorySelection';
const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const dispatch = useDispatch();
  const {coordinates} = useGetLocation();
  const [autoLoginFetch, {data, isSuccess}] = useAutoLoginMutation();
  const [fetchSignOut] = useSingOutMutation();
  // const [singOutFetch] = useSingOutMutation();

  useEffect(() => {
    if (!data) {
      fetchAutoLogin();
    }
    // handleSignOut();
  }, [data]);

  const handleSignOut = async () => {
    try {
      await fetchSignOut({});
    } catch (error) {}
  };

  const fetchAutoLogin = async () => {
    try {
      const res = await autoLoginFetch({coordinates}).unwrap();
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
      {!isSuccess && !data?.['_id'] && (
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
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
      />
      <Stack.Screen name="PrivacySettings" component={PrivacySettings} />
      <Stack.Screen
        name="StreamingPreferences"
        component={StreamingPreferences}
      />
      <Stack.Screen name="BlockedUsers" component={BlockedUsers} />
      <Stack.Screen name="PasswordSettings" component={PasswordSettings} />
      <Stack.Screen name="EmailSettings" component={EmailSettings} />
      {/* Events Screens */}
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="EventCreationFlow" component={EventCreationFlow} />
      {/* LiveStream Screens */}
      <Stack.Screen
        name="SubcategorySelection"
        component={SubcategorySelection}
      />
      {/* Onboarding Screens */}
      <Stack.Screen
        name="OnboardingAccountCreation"
        component={OnboardingAccountCreation}
      />
      <Stack.Screen
        name="OnboardingLocationAccess"
        component={OnboardingLocationAccess}
      />
      <Stack.Screen
        name="OnboardingInterests"
        component={OnboardingInterests}
      />
      <Stack.Screen
        name="OnboardingNotifications"
        component={OnboardingNotifications}
      />
    </Stack.Navigator>
  );
};
export default StackNavigation;
