import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';

interface WelcomeScreenProps {
  onLogin: () => void;
  onSignUp: () => void;
  onSkip?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onLogin,
  onSignUp,
  onSkip,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🛴</Text>
          </View>
          <Text style={styles.appName}>SparkRunner</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSignUp}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Create account</Text>
          </TouchableOpacity>

          {onSkip && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Take a tour</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 120,
    paddingBottom: theme.spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: theme.colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoEmoji: {
    fontSize: 64,
  },
  appName: {
    ...theme.typography.titleXL,
    color: theme.colors.text,
    letterSpacing: 1,
    marginTop: theme.spacing.sm,
  },
  actionButtons: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    height: 56,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.control,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  primaryButtonText: {
    ...theme.typography.bodyM,
    fontWeight: '600',
    color: theme.colors.card,
  },
  secondaryButton: {
    height: 56,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.control,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.brand,
    ...theme.shadows.small,
  },
  secondaryButtonText: {
    ...theme.typography.bodyM,
    fontWeight: '600',
    color: theme.colors.brand,
  },
  skipButton: {
    height: 56,
    borderRadius: theme.radii.control,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skipButtonText: {
    ...theme.typography.bodyM,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
});
