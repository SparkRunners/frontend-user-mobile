import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';

interface PasswordScreenProps {
  email: string;
  onBack: () => void;
  onLogin: (password: string) => void;
  isLoading?: boolean;
}

export const PasswordScreen: React.FC<PasswordScreenProps> = ({
  email,
  onBack,
  onLogin,
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordValid = password.length >= 6;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>Enter password</Text>

          {/* Email Display */}
          <Text style={styles.emailText}>{email}</Text>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#999999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => isPasswordValid && onLogin(password)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isPasswordValid && styles.loginButtonActive,
            ]}
            onPress={() => onLogin(password)}
            disabled={!isPasswordValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.card,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 40,
  },
  title: {
    ...theme.typography.titleXL,
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  emailText: {
    ...theme.typography.bodyM,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.text,
    borderRadius: theme.radii.control,
    paddingHorizontal: theme.spacing.lg,
    height: 64,
    backgroundColor: theme.colors.card,
  },
  input: {
    flex: 1,
    ...theme.typography.bodyM,
    color: theme.colors.text,
  },
  eyeIcon: {
    fontSize: 20,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  forgotText: {
    ...theme.typography.bodyS,
    color: theme.colors.brand,
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radii.control,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  loginButtonActive: {
    backgroundColor: theme.colors.brand,
  },
  loginButtonText: {
    ...theme.typography.bodyM,
    fontWeight: '600',
    color: theme.colors.card,
  },
});
