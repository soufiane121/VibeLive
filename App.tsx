/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// import './gesture-handler';
import React, { useEffect, useState } from 'react';
import { useColorScheme, View, ActivityIndicator} from 'react-native';
import Main from './src/Main';
import {Provider} from 'react-redux';
import {store} from './redux/store';
import { initFCM } from './src/Services/FCMNotificationService';
import { AnalyticsProvider } from './src/Providers/AnalyticsProvider';
import { setLocalData } from './src/Utils/LocalStorageHelper';
import i18n, {i18nInit} from './src/i18n/i18n';


function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initFCM();
    handleInitTheme()

    i18nInit.then(() => {
      console.log('i18nInit resolved, language:', i18n.language);
      console.log('Translation exists:', i18n.exists('event.readyToGoLive'));
      setI18nReady(true);
    });
  }, [])

  const handleInitTheme = async () => {
    await setLocalData({key: 'isDarkMode', value: isDarkMode.toString()});
  }
  const handleInitOneSignal =async  ()=> {
    // await initOneSignal();
  }
  
if (!i18nReady) {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" />
    </View>
  );
}
  return (
    <Provider store={store}>
      <AnalyticsProvider>
        <Main />
        {/* <LiveStreamContainer /> */}
        {/* <RadarMap  /> */}
      </AnalyticsProvider>
    </Provider>
  );
}

export default App;
