import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { MainTabParamList } from './types';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { SocialScreen } from '../screens/SocialScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../config/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ focused, name }: { focused: boolean; name: string }) {
  const iconColor = focused ? colors.primary : colors.textMuted;
  const labels: Record<string, string> = {
    Marketplace: 'M',
    Social: 'S',
    Messages: 'C',
    Wallet: 'W',
    Profile: 'P',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconActive]}>
      <View style={[styles.iconDot, { backgroundColor: iconColor }]} />
    </View>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} name={route.name} />
        ),
      })}
    >
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{ tabBarLabel: 'Shop' }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={{ tabBarLabel: 'Social' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ tabBarLabel: 'Wallet' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconActive: {
    backgroundColor: colors.primaryMuted,
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
