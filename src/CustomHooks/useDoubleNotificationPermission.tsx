import {useState} from 'react';
import {Alert, Platform} from 'react-native';
import {
  getMessaging,
  hasPermission as fcmHasPermission,
  requestPermission as fcmRequestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import useTranslation from '../Hooks/useTranslation';

export const useDoubleNotificationPermission = () => {
  const { t } = useTranslation();
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
        t('notifications.permissionTitle'),
        t('notifications.permissionMessage'),
        [
          {
            text: t('notifications.askAgain'),
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
          t('notifications.permissionRequired'),
          t('notifications.permissionRequiredMessage'),
          [{text: t('common.ok')}],
        );
        return false;
      }
    }
  };

  return {requestPermission, granted};
};
