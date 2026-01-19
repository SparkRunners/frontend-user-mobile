import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapScreen } from '../features/map';
import { ProfileScreen } from '../features/profile';
import { theme } from '../theme';
import { enableScreens } from 'react-native-screens';

enableScreens();

export type RootStackParamList = {
  Map: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Define HeaderRight component outside of render
const HeaderRight = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuButton}>
    <View style={styles.menuIconCircle} />
  </TouchableOpacity>
);

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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.brand,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
});
