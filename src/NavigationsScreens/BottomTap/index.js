import React from 'react'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

const BottomTap = createBottomTabNavigator();

export default function index() {
  return (
    <BottomTap.Navigator>
    <BottomTap.Screen />
    </BottomTap.Navigator>

  )
}
