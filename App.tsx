/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {SafeAreaView, useColorScheme} from 'react-native';
import Main from './src/Main';


function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    // <SafeAreaView className="flex-1 bg-slate-700">
      <Main />
    // </SafeAreaView>
  );
}

export default App;
