import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthProvider';
import { WelcomeScreen, SignInScreen, PasswordScreen, SignUpScreen } from './screens';
import { loginWithEmail as loginWithEmailApi, registerWithEmail as registerWithEmailApi } from './api';
import { theme } from '../theme';
import type { OAuthProviderName } from './types';

interface AuthGateProps {
  children: React.ReactNode;
}

type AuthScreen = 'welcome' | 'signin' | 'signup' | 'password';

export const AuthGate = ({ children }: AuthGateProps) => {
  const { isReady, isAuthenticated, isAuthorizing, login, authenticateWithToken } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  if (!isReady || isAuthorizing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleOAuthLogin = async (provider: OAuthProviderName) => {
    setIsLoading(true);
    try {
      await login(provider);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailNext = (inputEmail: string) => {
    setEmail(inputEmail);
    setCurrentScreen('password');
  };

  const handlePasswordLogin = async (password: string) => {
    setIsLoading(true);
    try {
      const response = await loginWithEmailApi({ email, password });
      await authenticateWithToken(response.token, { persist: true });
      Toast.show({
        type: 'success',
        text1: 'Login successful',
        text2: 'Welcome back!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: error instanceof Error ? error.message : 'Invalid credentials',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: { email: string; password: string; username: string; phone?: string }) => {
    setIsLoading(true);
    try {
      await registerWithEmailApi({
        email: data.email,
        password: data.password,
        username: data.username,
      });
      // Auto login after successful registration
      const loginResponse = await loginWithEmailApi({ email: data.email, password: data.password });
      await authenticateWithToken(loginResponse.token, { persist: true });
      Toast.show({
        type: 'success',
        text1: 'Account created',
        text2: 'Welcome to SparkRunner!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Sign up failed',
        text2: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (currentScreen === 'welcome') {
    return (
      <WelcomeScreen
        onLogin={() => setCurrentScreen('signin')}
        onSignUp={() => setCurrentScreen('signup')}
        onSkip={() => Toast.show({ type: 'info', text1: 'Tour coming soon' })}
      />
    );
  }

  if (currentScreen === 'signin') {
    return (
      <SignInScreen
        onBack={() => setCurrentScreen('welcome')}
        onEmailNext={handleEmailNext}
        onSocialLogin={handleOAuthLogin}
        isLoading={isLoading}
      />
    );
  }

  if (currentScreen === 'password') {
    return (
      <PasswordScreen
        email={email}
        onBack={() => setCurrentScreen('signin')}
        onLogin={handlePasswordLogin}
        isLoading={isLoading}
      />
    );
  }

  if (currentScreen === 'signup') {
    return (
      <SignUpScreen
        onBack={() => setCurrentScreen('welcome')}
        onSignUp={handleSignUp}
        isLoading={isLoading}
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
