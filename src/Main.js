import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackNavigation from './NavigationsScreens/StackNavigation/StackNavigation.tsx';



const Main = () => {
  return (
      <NavigationContainer >
        <StackNavigation />
      </NavigationContainer>
  );
};

export default Main;
