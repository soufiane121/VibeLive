/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  useColorScheme,
  Text,
  View
} from 'react-native';
import Mapbox from '@rnmapbox/maps';

// Mapbox.setAccessToken(
//   'sk.eyJ1IjoidGVzdC0xMjEiLCJhIjoiY20xd3drYzVhMHJ3azJqb2ttZmJjYTY1ZCJ9.k03054nYYuW8sQtJkU522w',
// );


type SectionProps = PropsWithChildren<{
  title: string;
}>;


function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';


  return (
    <Mapbox.MapView
      className=" flex-1 bg-yellow-50 "
      zoomEnabled
      styleURL="mapbox://styles/mapbox/dark-v11">
      <Mapbox.UserLocation visible animated showsUserHeadingIndicator />
    </Mapbox.MapView>
  );
}


export default App;
