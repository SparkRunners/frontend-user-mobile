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
import { GoogleIcon, GitHubIcon, AppleIcon } from '../components/SocialIcons';
import type { OAuthProviderName } from '../types';

interface SignInScreenProps {
  onBack: () => void;
  onEmailNext: (email: string) => void;
  onSocialLogin: (provider: OAuthProviderName) => void;
  isLoading?: boolean;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onBack,
  onEmailNext,
  onSocialLogin,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');

  const isEmailValid = email.length > 0 && email.includes('@');

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
          <Text style={styles.title}>Sign in</Text>

          {/* Email Input with Arrow */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.arrowIcon}>→</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
                placeholderTextColor="#999999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => isEmailValid && onEmailNext(email)}
              />
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or connect with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Icons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => onSocialLogin('google')}
              disabled={isLoading}
            >
              <GoogleIcon size={28} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.githubButton]}
              onPress={() => onSocialLogin('github')}
              disabled={isLoading}
            >
              <GitHubIcon size={28} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              disabled={isLoading}
            >
              <AppleIcon size={28} />
            </TouchableOpacity>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isEmailValid && styles.nextButtonDisabled,
            ]}
            onPress={() => onEmailNext(email)}
            disabled={!isEmailValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
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
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 40,
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
  arrowIcon: {
    fontSize: 24,
    color: theme.colors.text,
    marginRight: theme.spacing.md,
  },
  input: {
    flex: 1,
    ...theme.typography.bodyM,
    color: theme.colors.text,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    ...theme.typography.bodyS,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.md,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    marginBottom: 40,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  googleButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  githubButton: {
    backgroundColor: '#24292e',
  },
  appleButton: {
    backgroundColor: theme.colors.text,
  },
  nextButton: {
    height: 56,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.control,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  nextButtonDisabled: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  nextButtonText: {
    ...theme.typography.bodyM,
    fontWeight: '600',
    color: theme.colors.card,
  },
});
