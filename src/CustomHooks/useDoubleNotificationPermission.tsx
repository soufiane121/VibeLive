import {useState} from 'react';
import {Alert, Platform} from 'react-native';
import {
  getMessaging,
  hasPermission as fcmHasPermission,
  requestPermission as fcmRequestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

export const useDoubleNotificationPermission = () => {
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [granted, setGranted] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      setGranted(true);
      return true;
    }

    const msg = getMessaging();
    let authStatus = await fcmHasPermission(msg) || await fcmRequestPermission(msg);

    if (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    ) {
      setGranted(true);
      return true;
    }

    if (!permissionAsked) {
      setPermissionAsked(true);
      Alert.alert(
        'Notification Permission',
        'We need notification permission to keep you updated. Please allow notifications.',
        [
          {
            text: 'Ask Again',
            onPress: async () => {
              await requestPermission();
            },
          },
        ],
        {cancelable: false},
      );
      return false;
    } else {
      // Ask the second time
      authStatus = await fcmRequestPermission(msg);
      if (
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL
      ) {
        setGranted(true);
        return true;
      } else {
        Alert.alert(
          'Permission Required',
          'You need to allow notifications to continue.',
          [{text: 'OK'}],
        );
        return false;
      }
    }
  };

  return {requestPermission, granted};
};
