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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';

interface SignUpScreenProps {
  onBack: () => void;
  onSignUp: (data: { email: string; password: string; username: string; phone?: string }) => void;
  isLoading?: boolean;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onBack,
  onSignUp,
  isLoading = false,
}) => {
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isEmailValid = email.length > 0 && email.includes('@');
  const isPasswordValid = password.length >= 6;
  const isUsernameValid = username.trim().length > 0;
  const isFormValid = isPasswordValid && isUsernameValid;

  const handleEmailNext = () => {
    if (isEmailValid) {
      setStep('details');
    }
  };

  const handleSignUp = () => {
    if (isFormValid) {
      onSignUp({ email, password, username, phone });
    }
  };

  if (step === 'email') {
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
            <Text style={styles.title}>Create an account</Text>

            {/* Email Input */}
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
                  onSubmitEditing={handleEmailNext}
                />
              </View>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[
                styles.nextButton,
                isEmailValid && styles.nextButtonActive,
              ]}
              onPress={handleEmailNext}
              disabled={!isEmailValid}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Details step
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
            onPress={() => setStep('email')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Title */}
          <Text style={styles.title}>Create an account</Text>

          {/* Email Display */}
          <Text style={styles.emailText}>{email}</Text>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.arrowIcon}>→</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password (Required)"
                placeholderTextColor="#999999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.arrowIcon}>→</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Name (Required)"
                placeholderTextColor="#999999"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.flagIcon}>🇸🇪</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor="#999999"
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
            </View>
          </View>

          {/* Terms Notice */}
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms and Conditions</Text>
          </Text>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.signUpButton,
              isFormValid && styles.signUpButtonActive,
            ]}
            onPress={handleSignUp}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Create account</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
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
    marginBottom: 24,
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
  arrowIcon: {
    fontSize: 24,
    color: theme.colors.text,
    marginRight: theme.spacing.md,
  },
  flagIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  input: {
    flex: 1,
    ...theme.typography.bodyM,
    color: theme.colors.text,
  },
  eyeIcon: {
    fontSize: 20,
  },
  termsText: {
    ...theme.typography.bodyXS,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.brand,
    fontWeight: '600',
  },
  nextButton: {
    height: 56,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radii.control,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  nextButtonActive: {
    backgroundColor: theme.colors.brand,
  },
  nextButtonText: {
    ...theme.typography.bodyM,
    fontWeight: '600',
    color: theme.colors.card,
  },
  signUpButton: {
    height: 56,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radii.control,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  signUpButtonActive: {
    backgroundColor: theme.colors.brand,
  },
  signUpButtonText: {
    ...theme.typography.bodyM,
    fontWeight: '600',
    color: theme.colors.card,
  },
});
