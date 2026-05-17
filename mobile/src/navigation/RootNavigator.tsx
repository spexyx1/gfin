import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthScreen } from '../screens/AuthScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { ChatThreadScreen } from '../screens/ChatThreadScreen';
import { CartScreen } from '../screens/CartScreen';
import { SellerDashboardScreen } from '../screens/SellerDashboardScreen';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ headerShown: true, headerTitle: '', headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background } }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ headerShown: true, headerTitle: 'Order Details', headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background } }}
          />
          <Stack.Screen
            name="ChatThread"
            component={ChatThreadScreen}
            options={{ headerShown: true, headerTitle: '', headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background } }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ headerShown: true, headerTitle: 'Cart', headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background }, presentation: 'modal' }}
          />
          <Stack.Screen
            name="SellerDashboard"
            component={SellerDashboardScreen}
            options={{ headerShown: true, headerTitle: 'Seller Dashboard', headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background } }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
