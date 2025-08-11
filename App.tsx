/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// import './gesture-handler';
import React, { useEffect } from 'react';
import {SafeAreaView, useColorScheme} from 'react-native';
import Main from './src/Main';
import {Provider} from 'react-redux';
import {store} from './redux/store';
import LiveStreamContainer from './src/LiveStream/LiveStreamContainer';
import RadarMap from './radarMap-not_in-use';
import { initOneSignal } from './notifications/IniNotification';
import { AnalyticsProvider } from './src/Providers/AnalyticsProvider';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  useEffect(() => {
    handleInitOneSignal();
  }, [])

  const handleInitOneSignal =async  ()=> {
    await initOneSignal();
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
