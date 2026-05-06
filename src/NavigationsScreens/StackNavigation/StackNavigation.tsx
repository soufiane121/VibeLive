import {useEffect, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginContainer from '../../FeatureComponents/Auth/Login/LoginContainer';
import BottomNavigation from '../BottomTap/BottomNavigation';
import {
  useAutoLoginMutation,
  useSingOutMutation,
} from '../../../features/registrations/LoginSliceApi';
import {setCurrentUser} from '../../../features/registrations/CurrentUser';
import {useDispatch} from 'react-redux';
import {locationStore} from '../../CustomHooks/useGetLocation';
import StreamPlayer from '../../WatchStream/StreamPlayer';
import CarrouselContainer from '../../Carrousel/CarrouselContainer';
import SignUpContainer from '../../FeatureComponents/Auth/SignUp/SignUpContainer';
import EmailVerificationScreen from '../../FeatureComponents/Auth/EmailVerificationScreen';
// Onboarding Screens
import OnboardingAccountCreation from '../../FeatureComponents/Auth/Onboarding/OnboardingAccountCreation';
import OnboardingLocationAccess from '../../FeatureComponents/Auth/Onboarding/OnboardingLocationAccess';
import OnboardingInterests from '../../FeatureComponents/Auth/Onboarding/OnboardingInterests';
import OnboardingNotifications from '../../FeatureComponents/Auth/Onboarding/OnboardingNotifications';
// Forgot Password Screens
import ForgotPasswordScreen from '../../FeatureComponents/Auth/ForgotPassword/ForgotPasswordScreen';
import EmailSentScreen from '../../FeatureComponents/Auth/ForgotPassword/EmailSentScreen';
import ResetPasswordScreen from '../../FeatureComponents/Auth/ForgotPassword/ResetPasswordScreen';
import ResetSuccessScreen from '../../FeatureComponents/Auth/ForgotPassword/ResetSuccessScreen';
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
// Voting Screens
import VenueSelectionScreen from '../../FeatureComponents/Voting/VenueSelectionScreen';
import VenueOwnerDashboard from '../../FeatureComponents/Voting/VenueOwnerDashboard';
import VenueDetailsScreen from '../../FeatureComponents/Voting/VenueDetailsScreen';
import VotingPreferences from '../../FeatureComponents/Voting/VotingPreferences';
import VotingInitializer from '../../FeatureComponents/Voting/VotingInitializer';
// Squad Screens
import SquadJoinScreen from '../../FeatureComponents/Squad/SquadJoinScreen';
// Settings main screen (moved from bottom nav to stack)
import Settings from '../../Settings/Settings';
// Venue Claim Screens — claim flow moved to web, redirect screen replaces in-app screens
import VenueClaimWebRedirect from '../../FeatureComponents/VenueClaim/VenueClaimWebRedirect';
import VenueClaimStatusScreen from '../../FeatureComponents/VenueClaim/VenueClaimStatusScreen';
import VenueTaggingScreen from '../../FeatureComponents/VenueClaim/VenueTaggingScreen';
import LocationSimulatorTest from '../../FeatureComponents/Testing/LocationSimulatorTest';
// Account Screens
import EditProfile from '../../Account/EditProfile';
import MyInterests from '../../Account/MyInterests';
import BuyMinutes from '../../Account/BuyMinutes';
import TransactionHistory from '../../Account/TransactionHistory';
// Settings Screens
import NotificationSettingsNew from '../../Settings/NotificationSettingsNew';
import PrivacySettingsNew from '../../Settings/PrivacySettingsNew';

const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const dispatch = useDispatch();
  const [autoLoginFetch, {data, isSuccess, isError}] = useAutoLoginMutation();
  const [fetchSignOut] = useSingOutMutation();
  const [authChecked, setAuthChecked] = useState(false);
  // const [singOutFetch] = useSingOutMutation();

  useEffect(() => {
    if (!data) {
      fetchAutoLogin();
    }
    // handleSignOut();
  }, [data]);

  useEffect(() => {
    if (isSuccess || isError) {
      setAuthChecked(true);
    }
  }, [isSuccess, isError]);

  // If data already exists from a previous session, auth is known
  useEffect(() => {
    if (data) {
      setAuthChecked(true);
    }
  }, [data]);

  const handleSignOut = async () => {
    try {
      await fetchSignOut({});
    } catch (error) {}
  };

  const fetchAutoLogin = async () => {
    try {
      const coords = locationStore.getCoordinates();
      const res = await autoLoginFetch({coordinates: coords}).unwrap();
      if (res?.data?._id) {
        dispatch(setCurrentUser(res?.data));
      }
    } catch (error) {
      // Alert.alert(error as string);
    }
  };

  if (!authChecked) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0B0E14',
        }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <>
      <VotingInitializer />
      <Stack.Navigator
        initialRouteName={isSuccess && data?.data?._id ? 'Bottom' : 'Login'}
        screenOptions={{
          animation: 'fade',
          headerBackVisible: false,
          headerShown: false,
        }}>
        <Stack.Screen name="Login" component={LoginContainer} />
        <Stack.Screen
          name="sign-up"
          component={SignUpContainer}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="EmailVerification"
          component={EmailVerificationScreen}
          options={{headerShown: false}}
        />
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
        {/* Voting Screens */}
        <Stack.Screen name="VenueSelection" component={VenueSelectionScreen} />
        <Stack.Screen
          name="VenueOwnerDashboard"
          component={VenueOwnerDashboard}
        />
        <Stack.Screen name="VenueDetails" component={VenueDetailsScreen} />
        <Stack.Screen name="VotingPreferences" component={VotingPreferences} />
        {/* Squad Screens */}
        <Stack.Screen name="SquadJoin" component={SquadJoinScreen} />
        {/* Settings main screen (accessible from Profile) */}
        <Stack.Screen name="Settings" component={Settings} />
        {/* Account Screens */}
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="MyInterests" component={MyInterests} />
        <Stack.Screen name="BuyMinutes" component={BuyMinutes} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistory} />
        <Stack.Screen name="NotificationSettingsNew" component={NotificationSettingsNew} />
        <Stack.Screen name="PrivacySettingsNew" component={PrivacySettingsNew} />
        {/* Venue Claim Screens — claim flow redirects to web */}
        <Stack.Screen name="VenueSearch" component={VenueClaimWebRedirect} />
        <Stack.Screen
          name="VenueClaimStatus"
          component={VenueClaimStatusScreen}
        />
        <Stack.Screen name="VenueTagging" component={VenueTaggingScreen} />
        {/* Forgot Password Screens */}
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="EmailSent" component={EmailSentScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ResetSuccess" component={ResetSuccessScreen} />
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
        <Stack.Screen
          name="LocationSimulatorTest"
          component={LocationSimulatorTest}
        />
      </Stack.Navigator>
    </>
  );
};
export default StackNavigation;
