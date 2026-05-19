/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {getMessaging, setBackgroundMessageHandler} from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';
import {handleBackgroundMessage} from './src/Services/FCMNotificationService';

// Import BackgroundLocationService early to ensure TaskManager.defineTask is called
import './src/Services/BackgroundLocationService';

// Register FCM background message handler — must be outside React components
setBackgroundMessageHandler(getMessaging(), handleBackgroundMessage);

AppRegistry.registerComponent(appName, () => App);
