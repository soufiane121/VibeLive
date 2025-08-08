import messaging from '@react-native-firebase/messaging';
import {OneSignal, LogLevel, OSNotification, NotificationClickEvent} from 'react-native-onesignal';
import {ONE_SIGNAL_APP_ID} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, Platform} from 'react-native';

// Types for better TypeScript support
interface NotificationData {
  [key: string]: any;
}

interface UserData {
  userId?: string;
  email?: string;
  tags?: {[key: string]: string | number | boolean};
}

// Removed NotificationPermissionResponse interface as it's not needed



const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  messaging().onMessage(onMessageReceived);
  messaging().setBackgroundMessageHandler(onMessageReceived);
};

const onMessageReceived = async (message: any) => {
  console.log(JSON.stringify(message, null, 3));
  const {from, ttl} = message;
};

const fetchToken = async () => {
//   let newToken = await messaging().getToken();
//   let oldToken = await AsyncStorage.getItem('fcmToken');
//   console.log({oldToken, newToken});
//   if (oldToken !== newToken) {
//     await AsyncStorage.setItem('fcmToken', newToken);
//   }
};

const initOneSignal = async (): Promise<void> => {
  try {
    // OneSignal Init Code
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize(ONE_SIGNAL_APP_ID);
    
    console.log('OneSignal initialized successfully');
    
    // Setup notification handlers
    setupNotificationHandlers();
    
    // Request permission for notifications
    await requestNotificationPermission();
    
  } catch (error) {
    console.error('Error initializing OneSignal:', error);
  }
};

// Setup notification event handlers
const setupNotificationHandlers = (): void => {
  // Handle notifications received while app is in foreground
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', handleForegroundNotification);
  
  // Handle notification clicks/opens
  OneSignal.Notifications.addEventListener('click', handleNotificationClick);
  
  // Handle permission changes
  OneSignal.Notifications.addEventListener('permissionChange', handlePermissionChange);
};

// Handle notifications when app is in foreground
const handleForegroundNotification = (event: any): void => {
  console.log('OneSignal: notification will show in foreground:', event);
  
  const notification = event.notification;
  const data = notification.additionalData;
  
  console.log('Notification data:', data);
  
  // You can customize the notification display here
  // For example, show a custom in-app notification
  if (data?.showInApp) {
    showCustomInAppNotification(notification);
    // Prevent the notification from displaying
    event.preventDefault();
  } else {
    // Allow the notification to display normally
    // event.notification.display();
  }
};

// Handle notification clicks
const handleNotificationClick = (event: NotificationClickEvent): void => {
  console.log('OneSignal: notification clicked:', event);
  
  const notification = event.notification;
  const data = notification.additionalData;
  
  // Handle different notification types
  if (data) {
    handleNotificationAction(data);
  }
};

// Handle permission changes
const handlePermissionChange = (granted: boolean): void => {
  console.log('OneSignal: permission changed:', granted);
  // Store permission status
  AsyncStorage.setItem('notificationPermission', granted.toString());
};

// Custom in-app notification display
const showCustomInAppNotification = (notification: OSNotification): void => {
  Alert.alert(
    notification.title || 'Notification',
    notification.body || '',
    [
      {
        text: 'Dismiss',
        style: 'cancel',
      },
      {
        text: 'View',
        onPress: () => {
          if (notification.additionalData) {
            handleNotificationAction(notification.additionalData);
          }
        },
      },
    ]
  );
};

// Handle notification actions based on data
const handleNotificationAction = (data: NotificationData): void => {
  console.log('Handling notification action:', data);
  
  // Example: Handle different action types
  switch (data.action) {
    case 'open_chat':
      // Navigate to chat screen
      // RootNavigation.navigate('Chat', { chatId: data.chatId });
      break;
    case 'open_profile':
      // Navigate to profile screen
      // RootNavigation.navigate('Profile', { userId: data.userId });
      break;
    case 'video_call':
      // Handle video call
      // RootNavigation.navigate('VideoCall', { callId: data.callId });
      break;
    default:
      // Default action
      console.log('Unknown notification action:', data.action);
  }
};

// Request notification permission
const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const response = await OneSignal.Notifications.requestPermission(true);
    console.log('Notification permission response:', response);
    return response;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Set external user ID
const setExternalId = async (userId: string): Promise<void> => {
  try {
    await OneSignal.login(userId);
    console.log('External user ID set:', userId);
  } catch (error) {
    console.error('Error setting external user ID:', error);
  }
};

// Get external user ID
const getExternalId = async (): Promise<string | null> => {
  try {
    const deviceState = await OneSignal.User.getOnesignalId();
    console.log('OneSignal ID:', deviceState);
    return deviceState;
  } catch (error) {
    console.error('Error getting external user ID:', error);
    return null;
  }
};

// Set user data (email, tags, etc.)
const setUserData = async (userData: UserData): Promise<void> => {
  try {
    if (userData.email) {
      OneSignal.User.addEmail(userData.email);
    }
    
    if (userData.tags) {
      OneSignal.User.addTags(userData.tags);
    }
    
    console.log('User data set:', userData);
  } catch (error) {
    console.error('Error setting user data:', error);
  }
};

// Remove user data
const removeUserData = async (): Promise<void> => {
  try {
    await OneSignal.logout();
    console.log('User data removed');
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

// Send tags
const sendTags = async (tags: {[key: string]: string | number | boolean}): Promise<void> => {
  try {
    OneSignal.User.addTags(tags);
    console.log('Tags sent:', tags);
  } catch (error) {
    console.error('Error sending tags:', error);
  }
};

// Remove tags
const removeTags = async (tagKeys: string[]): Promise<void> => {
  try {
    OneSignal.User.removeTags(tagKeys);
    console.log('Tags removed:', tagKeys);
  } catch (error) {
    console.error('Error removing tags:', error);
  }
};

// Get notification permission status
const getNotificationPermissionStatus = async (): Promise<boolean> => {
  try {
    const hasPermission = await OneSignal.Notifications.hasPermission();
    console.log('Notification permission status:', hasPermission);
    return hasPermission;
  } catch (error) {
    console.error('Error getting notification permission status:', error);
    return false;
  }
};

// Send notification to specific user (server-side function)
const sendNotificationToUser = async (
  userId: string,
  title: string,
  message: string,
  data?: NotificationData
): Promise<boolean> => {
  try {
    // This would typically be done from your backend
    // Here's an example of how you might structure the API call
    const notificationData = {
      app_id: ONE_SIGNAL_APP_ID,
      include_external_user_ids: [userId],
      headings: { en: title },
      contents: { en: message },
      data: data || {},
    };
    
    console.log('Notification would be sent:', notificationData);
    // You would make an API call to OneSignal's REST API here
    // const response = await fetch('https://onesignal.com/api/v1/notifications', {...});
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Clear all notifications
const clearAllNotifications = (): void => {
  try {
    OneSignal.Notifications.clearAll();
    console.log('All notifications cleared');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

// Get subscription status
const getSubscriptionStatus = async (): Promise<boolean> => {
  try {
    const pushSubscription = OneSignal.User.pushSubscription;
    const isSubscribed = pushSubscription.getOptedIn();
    console.log('Subscription status:', isSubscribed);
    return isSubscribed;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return false;
  }
};

// Opt in to notifications
const optInToNotifications = async (): Promise<void> => {
  try {
    OneSignal.User.pushSubscription.optIn();
    console.log('Opted in to notifications');
  } catch (error) {
    console.error('Error opting in to notifications:', error);
  }
};

// Opt out of notifications
const optOutOfNotifications = async (): Promise<void> => {
  try {
    OneSignal.User.pushSubscription.optOut();
    console.log('Opted out of notifications');
  } catch (error) {
    console.error('Error opting out of notifications:', error);
  }
};


export {
  // Firebase functions (existing)
  requestUserPermission,
  fetchToken,
  
  // OneSignal core functions
  initOneSignal,
  setupNotificationHandlers,
  
  // Permission functions
  requestNotificationPermission,
  getNotificationPermissionStatus,
  
  // User management functions
  setExternalId,
  getExternalId,
  setUserData,
  removeUserData,
  
  // Tag management functions
  sendTags,
  removeTags,
  
  // Notification functions
  sendNotificationToUser,
  clearAllNotifications,
  
  // Subscription management
  getSubscriptionStatus,
  optInToNotifications,
  optOutOfNotifications,
  
  // Event handlers
  handleForegroundNotification,
  handleNotificationClick,
  handlePermissionChange,
  handleNotificationAction,
  showCustomInAppNotification,
};
