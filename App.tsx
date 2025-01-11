/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// import './gesture-handler';
import React from 'react';
import {SafeAreaView, useColorScheme} from 'react-native';
import Main from './src/Main';
import {Provider} from 'react-redux';
import {store} from './redux/store';
import LiveStreamContainer from './src/LiveStream/LiveStreamContainer';
import RadarMap from './radarMap';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <Main />
      {/* <LiveStreamContainer /> */}
      {/* <RadarMap  /> */}
    </Provider>
  );
}

export default App;
