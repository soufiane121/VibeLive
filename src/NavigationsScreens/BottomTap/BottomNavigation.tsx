import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StyleSheet, View, Platform} from 'react-native';
import MapContainer from '../../FeatureComponents/Map/MapContainer';
import {
  LiveStreamIcon,
  mapIcon,
  ProfileIcon,
  SquadIcon,
  EventsIcon,
} from '../../UIComponents/Icons';
import SwitcherContainer from '../../LiveStream/SwitcherContainer';
import SquadScreen from '../../FeatureComponents/Squad/SquadScreen';
import Profile from '../../Account/Profile';
import EventsListScreen from '../../FeatureComponents/Events/EventsListScreen';
import {GlobalColors} from '../../styles/GlobalColors';
import LocationPermissionWall from '../../FeatureComponents/Permissions/LocationPermissionWall';

const colors = GlobalColors.BottomNavigation;

const BottomTap = createBottomTabNavigator();

const RAISED_SIZE = 56;

function RaisedIcon({focused, icon}: {focused: boolean; icon: React.ReactNode}) {
  if (!focused) return <>{icon}</>;
  return (
    <View style={styles.raisedWrap}>
      <View style={styles.raisedOuter}>
        <View style={styles.raisedInner}>{icon}</View>
      </View>
    </View>
  );
}

export default function BottomNavigation() {
  return (
    <LocationPermissionWall>
      <BottomTap.Navigator
        initialRouteName="Bottom"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: styles.label,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
        }}>
        <BottomTap.Screen
          name="Map"
          component={MapContainer}
          options={{
            tabBarIcon: ({focused, color}: {focused: boolean; color: string}) => (
              <RaisedIcon
                focused={focused}
                icon={mapIcon({color: focused ? colors.centerButtonIcon : color, size: focused ? 24 : 22})}
              />
            ),
            title: 'Map',
          }}
        />
        <BottomTap.Screen
          name="Events"
          component={EventsListScreen}
          options={{
            tabBarIcon: ({focused, color}: {focused: boolean; color: string}) => (
              <RaisedIcon
                focused={focused}
                icon={<EventsIcon color={focused ? colors.centerButtonIcon : color} size={focused ? 24 : 22} />}
              />
            ),
            title: 'Events',
          }}
        />
        <BottomTap.Screen
          name="Live"
          component={SwitcherContainer}
          options={{
            tabBarIcon: ({focused, color}: {focused: boolean; color: string}) => (
              <RaisedIcon
                focused={focused}
                icon={<LiveStreamIcon color={focused ? colors.centerButtonIcon : color} size={focused ? 24 : 22} />}
              />
            ),
            title: 'GO Live',
          }}
        />
        <BottomTap.Screen
          name="Squad"
          component={SquadScreen}
          options={{
            tabBarIcon: ({focused, color}: {focused: boolean; color: string}) => (
              <RaisedIcon
                focused={focused}
                icon={<SquadIcon color={focused ? colors.centerButtonIcon : color} size={focused ? 24 : 22} />}
              />
            ),
            title: 'Squad',
          }}
        />
        <BottomTap.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({focused, color}: {focused: boolean; color: string}) => (
              <RaisedIcon
                focused={focused}
                icon={<ProfileIcon color={focused ? colors.centerButtonIcon : color} size={focused ? 24 : 22} />}
              />
            ),
            title: 'Profile',
          }}
        />
      </BottomTap.Navigator>
    </LocationPermissionWall>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    // position: 'absolute',
    // bottom: Platform.OS === 'ios' ? 24 : 16,
    // left: 16,
    // right: 16,
    backgroundColor: colors.background,
    // borderRadius: 24,
    height: 64,
    borderTopWidth: 0,
    paddingBottom: 0,
    paddingTop: 0,
    elevation: 16,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.18,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  raisedWrap: {
    position: 'relative',
    top: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  raisedOuter: {
    width: RAISED_SIZE + 8,
    height: RAISED_SIZE + 8,
    borderRadius: (RAISED_SIZE + 8) / 2,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.centerButtonShadow,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.6,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  raisedInner: {
    width: RAISED_SIZE,
    height: RAISED_SIZE,
    borderRadius: RAISED_SIZE / 2,
    backgroundColor: colors.centerButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
