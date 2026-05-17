import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/config/theme';

const linking = {
  prefixes: ['ghettofinance://', 'https://ghetto.finance'],
  config: {
    screens: {
      Main: {
        screens: {
          Marketplace: 'marketplace',
          Social: 'social',
          Messages: 'messages',
          Wallet: 'wallet',
          Profile: 'profile',
        },
      },
      ProductDetail: 'product/:productId',
      OrderDetail: 'order/:orderId',
      ChatThread: 'chat/:userId',
    },
  },
};

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
          translucent={false}
        />
        <NavigationContainer
          linking={linking}
          theme={{
            dark: true,
            colors: {
              primary: colors.primary,
              background: colors.background,
              card: colors.surface,
              text: colors.text,
              border: colors.border,
              notification: colors.primary,
            },
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
