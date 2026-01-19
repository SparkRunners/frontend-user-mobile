import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapScreen } from '../features/map';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { TripHistoryScreen } from '../features/profile/TripHistoryScreen';
import { BalanceScreen } from '../features/profile/BalanceScreen';
import { AccountScreen } from '../features/profile/AccountScreen';
import { enableScreens } from 'react-native-screens';

enableScreens();

export type RootStackParamList = {
  Map: undefined;
  Profile: undefined;
  TripHistory: undefined;
  Balance: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Min sida' }}
        />
        <Stack.Screen
          name="TripHistory"
          component={TripHistoryScreen}
          options={{ title: 'Resehistorik' }}
        />
        <Stack.Screen
          name="Balance"
          component={BalanceScreen}
          options={{ title: 'Mitt saldo' }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{ title: 'Mitt konto' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
