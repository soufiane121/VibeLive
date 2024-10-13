import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MapContainer from '../../FeatureComponents/Map/MapContainer';
import {mapIcon} from '../../UIComponents/Icons';
import {Text, View} from 'react-native';
import tw from '../../../tw';

function HomeScreen() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Home!</Text>
    </View>
  );
}

const BottomTap = createBottomTabNavigator();

export default function BottomNavigation() {
  return (
    <BottomTap.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#292929',
          // opacity: 0.9,
          // borderBlockColor: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarIconStyle: {
          fontSize: 12,
          alignSelf: 'center',
          textAlignVertical: 'center',
          textAlign: 'center',
          // marginTop: 10,
        },
      }}>
      <BottomTap.Screen
        name="Map"
        component={MapContainer}
        options={{
          tabBarIcon: mapIcon,
          title: 'Map',
          // tabBarIconStyle: tw`primaryIconColor`,
          tabBarActiveTintColor: '#faf8ff',
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
      <BottomTap.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarActiveTintColor: '#faf8ff',
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
    </BottomTap.Navigator>
  );
}
