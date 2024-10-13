import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import BottomNavigation from './NavigationsScreens/BottomTap/BottomNavigation.tsx';
import {SafeAreaView} from 'react-native';

const Main = () => {
  return (
      <NavigationContainer>
        <BottomNavigation />
      </NavigationContainer>
  );
};

export default Main;
