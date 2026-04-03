/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// import './gesture-handler';
import React, { useEffect } from 'react';
import { useColorScheme} from 'react-native';
import Main from './src/Main';
import {Provider} from 'react-redux';
import {store} from './redux/store';
import { initFCM } from './src/Services/FCMNotificationService';
import { AnalyticsProvider } from './src/Providers/AnalyticsProvider';
import { setLocalData } from './src/Utils/LocalStorageHelper';
import Constants from 'expo-constants';


function App() {
  console.log({Constants}, "------------------");
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    initFCM();
    handleInitTheme()
  }, [])

  const handleInitTheme = async () => {
    await setLocalData({key: 'isDarkMode', value: isDarkMode.toString()});
  }
  const handleInitOneSignal =async  ()=> {
    // await initOneSignal();
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
