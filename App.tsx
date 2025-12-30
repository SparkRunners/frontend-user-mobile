/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthGate, AuthProvider } from './src/auth';
import { MapScreen } from './src/features/map';
import { RideProvider } from './src/features/ride';
import { runtimeConfig } from './src/config';
import { theme } from './src/theme';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AuthProvider>
      <RideProvider>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <AuthGate>
            <AppContent />
          </AuthGate>
          <Toast />
        </SafeAreaProvider>
      </RideProvider>
    </AuthProvider>
  );
}

function AppContent() {
  return (
    <View style={styles.container}>
      <MapScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default App;
