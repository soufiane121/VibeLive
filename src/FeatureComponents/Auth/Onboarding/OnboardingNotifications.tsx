import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {GlobalColors} from '../../../styles/GlobalColors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Button from '../../UIComponents/Button';
import {useSignUpMutation} from '../../../../features/registrations/LoginSliceApi';
import {useDispatch} from 'react-redux';
import {setCurrentUser} from '../../../../features/registrations/CurrentUser';

interface OnboardingNotificationsProps {
  navigation: any;
  route: any;
}

const OnboardingNotifications: React.FC<OnboardingNotificationsProps> = ({
  navigation,
  route,
}) => {
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [postSignUp, {isLoading: isSignUpLoading}] = useSignUpMutation();
  const dispatch = useDispatch();

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'VibeLive wants to send you notifications about hot events near you.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasNotificationPermission(isGranted);
        
        if (!isGranted) {
          Alert.alert(
            'Notifications Blocked',
            'You\'re missing out on hot events and breaking news! Enable notifications in your device settings to stay in the loop.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: () => Linking.openSettings()},
            ]
          );
        }
      } else {
        // iOS - notifications are handled through system prompts
        setHasNotificationPermission(true);
      }
    } catch (error) {
      console.log('Notification permission request error:', error);
      Alert.alert('Error', 'Failed to request notification permission');
    } finally {
      setIsLoading(false);
    }
  };

  const validateAndCompleteSignUp = async () => {
    const signupData = route.params?.signupData || {};
    
    // Validation: Check if all required data is present
    if (!signupData.firstName || !signupData.lastName || !signupData.age) {
      Alert.alert(
        'Missing Information',
        'Some required information is missing. Please go back and complete all steps.',
        [
          {text: 'Go Back', onPress: () => navigation.goBack()},
        ]
      );
      return;
    }

    if (!signupData.userName || !signupData.email || !signupData.password) {
      Alert.alert(
        'Account Information Missing',
        'Your account information is incomplete. Please restart the signup process.',
        [
          {text: 'OK', onPress: () => navigation.navigate('SignUp')},
        ]
      );
      return;
    }

    completeSignUp();
  };

  const completeSignUp = async () => {
    setIsSigningUp(true);
    try {
      const signupData = route.params?.signupData || {};
      const userData = {
        userName: signupData.userName || '',
        email: signupData.email || '',
        password: signupData.password || '',
        phoneNumber: signupData.phoneNumber || '',
        coordinates: signupData.coordinates || [0, 0],
        firstName: signupData.firstName || '',
        lastName: signupData.lastName || '',
        age: signupData.age || 18,
        interests: signupData.interests || [],
        interestCategories: signupData.interestCategories || [],
        locationPermission: signupData.locationPermission || false,
        notificationPermission: hasNotificationPermission,
      };

      const res = await postSignUp(userData).unwrap();
      dispatch(setCurrentUser(res.data));
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{name: 'Bottom'}],
      });
    } catch (error) {
      console.log('Signup error:', error?.data);
      Alert.alert('Signup Error', 'Failed to create account. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Notifications?',
      'You\'ll miss out on:\n• Breaking: Hot events near you\n• Live alerts when friends go live\n• Last-minute invites to exclusive events\n\nAre you sure?',
      [
        {text: 'Go Back', style: 'cancel'},
        {text: 'Skip Anyway', onPress: completeSignUp, style: 'destructive'},
      ]
    );
  };

  const isNotificationGranted = hasNotificationPermission;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={GlobalColors.Settings.text} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: '100%'}]} />
        </View>
        <Text style={styles.progressText}>Step 4 of 4</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Icon 
              name="bell-ring" 
              size={60} 
              color={GlobalColors.Settings.accent} 
            />
            <View style={styles.pulseRing} />
          </View>
        </View>

        <Text style={styles.title}>Never miss the action</Text>
        <Text style={styles.subtitle}>
          Get notified when something hot is happening near you
        </Text>

        {/* FOMO Alerts */}
        <View style={styles.fomoContainer}>
          <View style={styles.fomoAlert}>
            <Icon name="lightning-bolt" size={20} color={GlobalColors.Settings.accent} />
            <Text style={styles.fomoText}>
              <Text style={styles.fomoHighlight}>Breaking:</Text> Hot Event Alert - 47 people just joined a party 0.3 miles away
            </Text>
          </View>
          <View style={styles.fomoAlert}>
            <Icon name="account-group" size={20} color={GlobalColors.Settings.accent} />
            <Text style={styles.fomoText}>
              <Text style={styles.fomoHighlight}>Live Now:</Text> Sarah_NYC just went live at the rooftop bar you love
            </Text>
          </View>
          <View style={styles.fomoAlert}>
            <Icon name="star" size={20} color={GlobalColors.Settings.accent} />
            <Text style={styles.fomoText}>
              <Text style={styles.fomoHighlight}>Exclusive:</Text> VIP invite to tonight's underground music event
            </Text>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>You'll get notified about:</Text>
          <View style={styles.benefit}>
            <Icon name="fire" size={18} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>Breaking events happening right now</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="video" size={18} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>Friends going live nearby</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="ticket" size={18} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>Last-minute invites & exclusive events</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="heart" size={18} color={GlobalColors.Settings.accent} />
            <Text style={styles.benefitText}>Events matching your interests</Text>
          </View>
        </View>

        {/* Success State */}
        {isNotificationGranted && (
          <View style={styles.successContainer}>
            <Icon name="check-circle" size={24} color={GlobalColors.Common.successIcon} />
            <Text style={styles.successText}>You're all set! Welcome to VibeLive</Text>
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {!isNotificationGranted ? (
          <>
            <TouchableOpacity
              style={[styles.enableButton, isLoading && styles.enableButtonDisabled]}
              onPress={requestNotificationPermission}
              disabled={isLoading}>
              <Text style={styles.enableButtonText}>
                {isLoading ? "Requesting Permission..." : "Enable Notifications"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip and finish setup</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.completeButton, isSigningUp && styles.completeButtonDisabled]}
            onPress={validateAndCompleteSignUp}
            disabled={isSigningUp || isSignUpLoading}>
            <Text style={styles.completeButtonText}>
              {isSigningUp ? "Creating Your Account..." : "Complete Setup"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyContainer}>
        <Icon name="shield-check" size={16} color={GlobalColors.Settings.textMuted} />
        <Text style={styles.privacyText}>
          You can customize notification preferences anytime in settings
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Settings.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: GlobalColors.Settings.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GlobalColors.Settings.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: GlobalColors.Settings.textMuted,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GlobalColors.Settings.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GlobalColors.Settings.accent + '20',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: GlobalColors.Settings.accent + '30',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GlobalColors.Settings.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: GlobalColors.Settings.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  fomoContainer: {
    width: '100%',
    marginBottom: 24,
  },
  fomoAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: GlobalColors.Settings.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: GlobalColors.Settings.accent,
  },
  fomoText: {
    flex: 1,
    fontSize: 14,
    color: GlobalColors.Settings.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  fomoHighlight: {
    fontWeight: 'bold',
    color: GlobalColors.Settings.accent,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalColors.Settings.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  benefitText: {
    fontSize: 14,
    color: GlobalColors.Settings.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalColors.Settings.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    fontSize: 16,
    color: GlobalColors.Common.successText,
    marginLeft: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingTop: 20,
  },
  enableButton: {
    backgroundColor: GlobalColors.Settings.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  enableButtonDisabled: {
    backgroundColor: GlobalColors.Settings.border,
  },
  enableButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalColors.Settings.background,
  },
  completeButton: {
    backgroundColor: GlobalColors.Settings.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: GlobalColors.Settings.border,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalColors.Settings.background,
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: GlobalColors.Settings.textMuted,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: 12,
    color: GlobalColors.Settings.textMuted,
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
    lineHeight: 16,
  },
});

export default OnboardingNotifications;
