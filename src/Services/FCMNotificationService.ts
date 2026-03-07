import {
  FirebaseMessagingTypes,
  getMessaging,
  getToken as fcmGetToken,
  deleteToken as fcmDeleteToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh as fcmOnTokenRefresh,
  getInitialNotification,
  requestPermission as fcmRequestPermission,
  hasPermission as fcmHasPermission,
  subscribeToTopic as fcmSubscribeToTopic,
  unsubscribeFromTopic as fcmUnsubscribeFromTopic,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import votingNotificationHandler, {
  VenueNotificationData,
} from './VotingNotificationHandler';

const FCM_TOKEN_KEY = '@vibelive_fcm_token';

const VOTING_NOTIFICATION_TYPES = [
  'single_venue_vote',
  'multi_venue_vote',
  'vibe_shift_alert',
  'digest',
];

interface FCMNotificationData {
  [key: string]: string;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize FCM: request permission, register handlers, fetch token.
 * Call this once at app startup (e.g. in App.tsx useEffect).
 */
const initFCM = async (): Promise<void> => {
  try {
    const permissionGranted = await requestPermission();
    if (!permissionGranted) {
      console.log('[FCM] Permission not granted — notifications disabled');
      return;
    }

    registerMessageHandlers();
    await refreshToken();

    console.log('[FCM] Initialized successfully');
  } catch (error: any) {
    console.error('[FCM] Initialization error:', error.message);
  }
};

// =============================================================================
// PERMISSION
// =============================================================================

const requestPermission = async (): Promise<boolean> => {
  try {
    const msg = getMessaging();
    const authStatus = await fcmRequestPermission(msg);
    const granted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    console.log('[FCM] Permission status:', granted ? 'granted' : 'denied');
    await AsyncStorage.setItem('notificationPermission', String(granted));
    return granted;
  } catch (error: any) {
    console.error('[FCM] Permission request error:', error.message);
    return false;
  }
};

const hasPermission = async (): Promise<boolean> => {
  try {
    const msg = getMessaging();
    const authStatus = await fcmHasPermission(msg);
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error: any) {
    console.error('[FCM] hasPermission error:', error.message);
    return false;
  }
};

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

const refreshToken = async (): Promise<string | null> => {
  try {
    const msg = getMessaging();
    const newToken = await fcmGetToken(msg);
    const oldToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

    if (newToken && newToken !== oldToken) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      console.log('[FCM] Token refreshed');
    }

    return newToken;
  } catch (error: any) {
    console.error('[FCM] Token refresh error:', error.message);
    return null;
  }
};

const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (token) return token;
    return refreshToken();
  } catch (error: any) {
    console.error('[FCM] getToken error:', error.message);
    return null;
  }
};

const deleteToken = async (): Promise<void> => {
  try {
    const msg = getMessaging();
    await fcmDeleteToken(msg);
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    console.log('[FCM] Token deleted');
  } catch (error: any) {
    console.error('[FCM] deleteToken error:', error.message);
  }
};

const onTokenRefresh = (callback: (token: string) => void): (() => void) => {
  const msg = getMessaging();
  return fcmOnTokenRefresh(msg, callback);
};

// =============================================================================
// MESSAGE HANDLERS
// =============================================================================

/**
 * Register foreground and background message handlers.
 * For background/quit-state: setBackgroundMessageHandler must be called
 * outside of any React component (typically in index.js).
 */
const registerMessageHandlers = (): void => {
  const msg = getMessaging();

  // Foreground messages
  onMessage(msg, handleForegroundMessage);

  // Notification opened (app was in background, user tapped notification)
  onNotificationOpenedApp(msg, handleNotificationOpen);

  // Check if app was opened from a killed state via notification
  getInitialNotification(msg)
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('[FCM] App opened from quit state via notification');
        handleNotificationOpen(remoteMessage);
      }
    });

  // Token refresh listener
  fcmOnTokenRefresh(msg, async newToken => {
    await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
    console.log('[FCM] Token auto-refreshed');
  });
};

/**
 * Foreground message handler.
 * For voting notifications: let the system notification display (FCM data-only
 * messages don't show a banner, but notification messages do).
 * The voting handler is notified for logging only — no Alert.
 */
const handleForegroundMessage = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> => {
  const data = remoteMessage.data as FCMNotificationData | undefined;

  console.log('[FCM] Foreground message:', data?.type || 'unknown');

  if (data?.type && VOTING_NOTIFICATION_TYPES.includes(data.type)) {
    // Silent logging only — the push notification banner with action buttons
    // is already displayed by the system. No Alert, no in-app UI.
    votingNotificationHandler.handleNotificationReceived(
      data as unknown as VenueNotificationData,
    );
    return;
  }

  // Non-voting foreground messages: log for now
  console.log(
    '[FCM] Non-voting foreground message:',
    remoteMessage.notification?.title,
  );
};

/**
 * Called when user taps a notification (app was in background or quit).
 * Extract action from data payload and route through VotingNotificationHandler.
 */
const handleNotificationOpen = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): void => {
  const data = remoteMessage.data as FCMNotificationData | undefined;

  // FCM notification actions are delivered via the data payload.
  // Android: the `clickAction` field or custom `actionId` in data
  // iOS: the category action identifier is passed via data
  const actionId = data?.actionId || '';

  console.log(
    '[FCM] Notification opened — actionId:',
    actionId,
    'type:',
    data?.type,
  );

  if (data?.type && VOTING_NOTIFICATION_TYPES.includes(data.type)) {
    votingNotificationHandler.handleNotificationAction(
      actionId,
      data as unknown as VenueNotificationData,
    );
    return;
  }

  // Non-voting notification tapped — general routing
  if (data) {
    handleGeneralNotificationAction(data);
  }
};

/**
 * Background message handler.
 * Must be registered in index.js via:
 *   setBackgroundMessageHandler(getMessaging(), handleBackgroundMessage);
 * Exported for that purpose.
 */
const handleBackgroundMessage = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> => {
  const data = remoteMessage.data as FCMNotificationData | undefined;
  console.log('[FCM] Background message:', data?.type || 'unknown');

  // Background voting messages: the notification with action buttons is
  // already displayed by the system. When user taps an action,
  // handleNotificationOpen will fire. Nothing to do here.
};

// =============================================================================
// GENERAL (NON-VOTING) NOTIFICATION ROUTING
// =============================================================================

const handleGeneralNotificationAction = (data: FCMNotificationData): void => {
  console.log('[FCM] General notification action:', data.action);

  switch (data.action) {
    case 'open_chat':
      break;
    case 'open_profile':
      break;
    case 'video_call':
      break;
    default:
      console.log('[FCM] Unhandled action:', data.action);
  }
};

// =============================================================================
// TOPIC SUBSCRIPTIONS
// =============================================================================

const subscribeToTopic = async (topic: string): Promise<void> => {
  try {
    const msg = getMessaging();
    await fcmSubscribeToTopic(msg, topic);
    console.log(`[FCM] Subscribed to topic: ${topic}`);
  } catch (error: any) {
    console.error(`[FCM] Subscribe to topic error:`, error.message);
  }
};

const unsubscribeFromTopic = async (topic: string): Promise<void> => {
  try {
    const msg = getMessaging();
    await fcmUnsubscribeFromTopic(msg, topic);
    console.log(`[FCM] Unsubscribed from topic: ${topic}`);
  } catch (error: any) {
    console.error(`[FCM] Unsubscribe from topic error:`, error.message);
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  initFCM,
  requestPermission,
  hasPermission,
  refreshToken,
  getToken,
  deleteToken,
  onTokenRefresh,
  registerMessageHandlers,
  handleBackgroundMessage,
  subscribeToTopic,
  unsubscribeFromTopic,
};

export default initFCM;
