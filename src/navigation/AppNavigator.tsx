import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
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
    <Text style={styles.menuButtonText}>Meny</Text>
  </TouchableOpacity>
);

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={({ navigation }) => ({
            title: 'Karta',
            headerRight: () => <HeaderRight onPress={() => navigation.navigate('Profile')} />,
          })}
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
    backgroundColor: theme.colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  menuButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
});
