import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MapContainer from '../../FeatureComponents/Map/MapContainer';
import {
  LiveStreamIcon,
  mapIcon,
  ProfileIcon,
  SettingsIcon,
  EventsIcon,
} from '../../UIComponents/Icons';
import {Text, View} from 'react-native';
import tw from '../../../tw';
import LiveStreamContainer from '../../LiveStream/LiveStreamContainer';
import SwitcherContainer from '../../LiveStream/SwitcherContainer';
import Settings from '../../Settings/Settings';
import Profile from '../../Account/Profile';
import EventsListScreen from '../../FeatureComponents/Events/EventsListScreen';
import {GlobalColors} from '../../styles/GlobalColors';

const colors = GlobalColors.BottomNavigation;

const BottomTap = createBottomTabNavigator();

export default function BottomNavigation() {
  // <LiveStreamContainer
  return (
    <BottomTap.Navigator
      initialRouteName="Bottom"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
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
        },
      }}>
      <BottomTap.Screen
        name="Map"
        component={MapContainer}
        options={{
          tabBarIcon: mapIcon,
          title: 'Map',
          // tabBarIconStyle: tw`primaryIconColor`,
          tabBarActiveTintColor: colors.tabActive,
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
      <BottomTap.Screen
        name="Live"
        // component={LiveStreamContainer}
        component={SwitcherContainer}
        options={{
          tabBarIcon: LiveStreamIcon,
          title: 'GO Live',
          tabBarActiveTintColor: colors.tabActive,
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
      <BottomTap.Screen
        name="Events"
        component={EventsListScreen}
        options={{
          tabBarIcon: EventsIcon,
          title: 'Events',
          tabBarActiveTintColor: colors.tabActive,
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
      <BottomTap.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ProfileIcon,
          title: 'Profile',
          tabBarActiveTintColor: colors.tabActive,
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
      <BottomTap.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarIcon: SettingsIcon,
          title: 'Settings',
          tabBarActiveTintColor: colors.tabActive,
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
    </BottomTap.Navigator>
  );
}
