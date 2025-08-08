import messaging from '@react-native-firebase/messaging';
import {OneSignal, LogLevel} from 'react-native-onesignal';
import {PermissionsAndroid} from 'react-native';

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

const initOneSignal = async () => {
  //OneSignal Init Code
  OneSignal?.Debug?.setLogLevel(LogLevel.Debug);
  OneSignal.initialize('YOUR_APP_ID');
  //END OneSignal Init Code

  //Prompt for push on iOS
  //   OneSignal.promptForPushNotificationsWithUserResponse((response) => {
  //     console.log('Prompt response:', response);
  //   });

  //Method for handling notifications received while app in foreground
  //   OneSignal.setNotificationWillShowInForegroundHandler(
  //     (notificationReceivedEvent) => {
  //       console.log(
  //         'OneSignal: notification will show in foreground:',
  //         notificationReceivedEvent,
  //       );
  //       let notification = notificationReceivedEvent.getNotification();
  //       console.log('notification: ', notification);
  //       const data = notification.additionalData;
  //       console.log('additionalData: ', data);
  //       // Complete with null means don't show a notification.
  //       notificationReceivedEvent.complete(notification);
  //     },
  //   );

  //   Method for handling notifications opened
  OneSignal.setNotificationOpenedHandler(event => {
    if (event.action.actionId === 'answer') {
      RootNavigation.navigate('chats', {
        screen: 'videoCall',
        params: {
          recieverId: event.notification.additionalData.recieverId,
          recieverName: event.notification.additionalData.userChat.recieverName,
          answer: true,
          type: event.notification.additionalData.type,
        },
      });
    }
  });

  // OneSignal.setNotificationWillShowInForegroundHandler(
  //   (notificationReceivedEvent) => {
  //     let notification = notificationReceivedEvent.getNotification();
  //     // console.log('notification: ', notification);
  //     // const data = notification.additionalData;
  //     // console.log('additionalData: ', data);
  //     // //Silence notification by calling complete() with no argument
  //     RNCallKeep.displayIncomingCall(
  //       notification.androidNotificationId + '',
  //       'Soufiane',
  //       'soufi',
  //       'email',
  //       false,
  //     );
  //     notificationReceivedEvent.complete(notification);
  //   },
  // );
};

const setExternalId = id => {
  OneSignal.setExternalUserId(id);
};

const getExternalId = () => {
  OneSignal.getDeviceState().then(resp => {});
};

const initializeCallKeep = async () => {
  // let oldToken = await messaging().getToken();
  // console.log("oldToekn", oldToken)
  try {
    let setup = await RNCallKeep.setup({
      ios: {
        appName: 'notifeeme',
      },
      android: {
        alertTitle: 'Permissions required',
        alertDescription:
          'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'ok',
        additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_CONTACTS],
        selfManaged: false,
        foregroundService: {
          channelId: 'acu_incoming_call',
          channelName: 'Foreground service for my app',
          notificationTitle: 'My app is running on background',
        },
      },
    }).then(resp => {
      console.log({resp});
    });
    RNCallKeep.setAvailable(true);
  } catch (err) {
    console.error('initializeCallKeep error:', err.message);
  }

  // Add RNCallKit Events
  RNCallKeep.addEventListener('didReceiveStartCallAction', onNativeCall);
  RNCallKeep.addEventListener('answerCall', onAnswerCallAction);
  RNCallKeep.addEventListener('endCall', onEndCallAction);
  RNCallKeep.addEventListener(
    'didDisplayIncomingCall',
    onIncomingCallDisplayed,
  );
  // RNCallKeep.addEventListener('didPerformSetMutedCallAction', onToggleMute);
  // RNCallKeep.addEventListener('didPerformDTMFAction', onDTMF);
};

const onNativeCall = () => {};
const onAnswerCallAction = () => {
  RootNavigation.navigate('registration');
  console.log('answerCal');
  RNCallKeep.rejectCall();
  RNCallKeep.endCall();
  RNCallKeep.endAllCalls();
};
const onEndCallAction = () => {};
const onIncomingCallDisplayed = () => {};

export {
  requestUserPermission,
  fetchToken,
  initOneSignal,
  setExternalId,
  getExternalId,
  initializeCallKeep,
};
