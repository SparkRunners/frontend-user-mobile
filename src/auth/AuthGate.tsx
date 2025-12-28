import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthProvider';
import { theme } from '../theme';
import type { OAuthProviderName } from './types';

interface AuthGateProps {
  children: React.ReactNode;
}

interface LoginOption {
  provider: OAuthProviderName;
  label: string;
  subtitle: string;
  variant: 'light' | 'dark';
  icon: string;
}

const LOGIN_OPTIONS: LoginOption[] = [
  {
    provider: 'google',
    label: 'Fortsätt med Google',
    subtitle: 'Använd ditt Google-konto',
    variant: 'light',
    icon: 'G',
  },
  {
    provider: 'github',
    label: 'Fortsätt med GitHub',
    subtitle: 'Använd ditt GitHub-konto',
    variant: 'dark',
    icon: 'GH',
  },
];

type AuthTab = 'oauth' | 'email';
type EmailMode = 'login' | 'register';

const AUTH_TABS: Array<{ key: AuthTab; label: string }> = [
  { key: 'oauth', label: 'Socialt' },
  { key: 'email', label: 'E-post' },
];

const EMAIL_MODE_TABS: Array<{ key: EmailMode; label: string }> = [
  { key: 'login', label: 'Logga in' },
  { key: 'register', label: 'Skapa konto' },
];

const EMAIL_FORM_INITIAL_STATE = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

type EmailFormState = typeof EMAIL_FORM_INITIAL_STATE;

export const AuthGate = ({ children }: AuthGateProps) => {
  const { isReady, isAuthenticated, isAuthorizing, user, login, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AuthTab>('oauth');
  const [emailMode, setEmailMode] = useState<EmailMode>('login');
  const [emailForm, setEmailForm] = useState<EmailFormState>(EMAIL_FORM_INITIAL_STATE);
  const [touchedFields, setTouchedFields] = useState<Record<keyof EmailFormState, boolean>>({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const emailErrors = useMemo(() => {
    const errors: Partial<EmailFormState> = {};
    const trimmedEmail = emailForm.email.trim();
    if (!trimmedEmail || !/^[^@]+@[^@]+\.[^@]+$/.test(trimmedEmail)) {
      errors.email = 'Ogiltig e-postadress';
    }
    if (!emailForm.password || emailForm.password.length < 8) {
      errors.password = 'Minst 8 tecken';
    }
    if (emailMode === 'register') {
      if (!emailForm.username.trim()) {
        errors.username = 'Ange ett namn';
      }
      if (!emailForm.confirmPassword) {
        errors.confirmPassword = 'Bekräfta lösenordet';
      } else if (emailForm.confirmPassword !== emailForm.password) {
        errors.confirmPassword = 'Lösenorden matchar inte';
      }
    }
    return errors;
  }, [emailForm, emailMode]);

  const isEmailFormValid = useMemo(
    () => Object.keys(emailErrors).length === 0,
    [emailErrors],
  );

  const shouldShowError = (field: keyof EmailFormState) =>
    Boolean(emailErrors[field]) && (touchedFields[field] || emailSubmitted);

  const handleFieldChange = (field: keyof EmailFormState, value: string) => {
    setEmailForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldBlur = (field: keyof EmailFormState) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleEmailSubmit = () => {
    setEmailSubmitted(true);
    if (!isEmailFormValid) {
      Toast.show({ type: 'error', text1: 'Kolla fälten igen' });
      return;
    }
    Toast.show({
      type: 'info',
      text1: emailMode === 'login' ? 'E-postinloggning kommer snart' : 'Registrering kommer snart',
      text2: 'REST-koppling läggs till i nästa steg',
    });
  };

  const handleGuestAccess = () => {
    Toast.show({ type: 'info', text1: 'Gästläge kommer snart' });
  };

  if (!isReady) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + theme.spacing.xl }] }>
        <ActivityIndicator color={theme.colors.brand} size="large" />
        <Text style={styles.loadingLabel}>Preparing your session...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.unauthenticatedWrapper, { paddingBottom: insets.bottom + theme.spacing.xl }] }>
        <View style={styles.heroIconContainer}>
          <View style={styles.heroIconBackdrop}>
            <Text style={styles.heroIconGlyph}>🛴</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Välkommen</Text>
        <Text style={styles.heroSubtitle}>Logga in för att fortsätta</Text>
        <View style={styles.tabGroup}>
          {AUTH_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[styles.tabButtonLabel, activeTab === tab.key && styles.tabButtonLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {activeTab === 'oauth' ? (
          <View style={styles.loginCard}>
            {LOGIN_OPTIONS.map(option => (
              <LoginButton
                key={option.provider}
                option={option}
                disabled={isAuthorizing}
                onPress={() => login(option.provider)}
              />
            ))}
            {isAuthorizing && (
              <View style={styles.authorizingBanner}>
                <ActivityIndicator color={theme.colors.brand} size="small" />
                <Text style={styles.authorizingLabel}>Fortsätt i webbläsaren för att slutföra inloggningen...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.loginCard}>
            <View style={styles.modeSwitcher}>
              {EMAIL_MODE_TABS.map(mode => (
                <TouchableOpacity
                  key={mode.key}
                  style={[styles.modeButton, emailMode === mode.key && styles.modeButtonActive]}
                  onPress={() => {
                    setEmailMode(mode.key);
                    setEmailSubmitted(false);
                  }}
                >
                  <Text
                    style={[styles.modeButtonLabel, emailMode === mode.key && styles.modeButtonLabelActive]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {emailMode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>För- och efternamn</Text>
                <TextInput
                  value={emailForm.username}
                  onChangeText={value => handleFieldChange('username', value)}
                  onBlur={() => handleFieldBlur('username')}
                  placeholder="Spark Rider"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.inputField, shouldShowError('username') && styles.inputFieldError]}
                  textContentType="name"
                  autoCapitalize="words"
                />
                {shouldShowError('username') && (
                  <Text style={styles.inputErrorText}>{emailErrors.username}</Text>
                )}
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-post</Text>
              <TextInput
                value={emailForm.email}
                onChangeText={value => handleFieldChange('email', value)}
                onBlur={() => handleFieldBlur('email')}
                placeholder="din@epost.se"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.inputField, shouldShowError('email') && styles.inputFieldError]}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />
              {shouldShowError('email') && (
                <Text style={styles.inputErrorText}>{emailErrors.email}</Text>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lösenord</Text>
              <TextInput
                value={emailForm.password}
                onChangeText={value => handleFieldChange('password', value)}
                onBlur={() => handleFieldBlur('password')}
                placeholder="Minst 8 tecken"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.inputField, shouldShowError('password') && styles.inputFieldError]}
                secureTextEntry
                autoCapitalize="none"
                textContentType={emailMode === 'login' ? 'password' : 'newPassword'}
              />
              {shouldShowError('password') && (
                <Text style={styles.inputErrorText}>{emailErrors.password}</Text>
              )}
            </View>
            {emailMode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bekräfta lösenord</Text>
                <TextInput
                  value={emailForm.confirmPassword}
                  onChangeText={value => handleFieldChange('confirmPassword', value)}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  placeholder="Upprepa lösenordet"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.inputField, shouldShowError('confirmPassword') && styles.inputFieldError]}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                />
                {shouldShowError('confirmPassword') && (
                  <Text style={styles.inputErrorText}>{emailErrors.confirmPassword}</Text>
                )}
              </View>
            )}
            <TouchableOpacity
              style={[styles.submitButton, !isEmailFormValid && styles.submitButtonDisabled]}
              onPress={handleEmailSubmit}
              disabled={!isEmailFormValid}
            >
              <Text style={styles.submitButtonLabel}>
                {emailMode === 'login' ? 'Logga in' : 'Skapa konto'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={handleGuestAccess} style={styles.skipLink}>
          <Text style={styles.skipLinkLabel}>Fortsätt utan konto</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.authenticatedWrapper, { paddingBottom: insets.bottom + theme.spacing.lg }] }>
      <View style={styles.profileCard}>
        <View>
          <Text style={styles.profileGreeting}>Hej igen 👋</Text>
          <Text style={styles.profileName}>{user?.username ?? 'Spark Rider'}</Text>
          <Text style={styles.profileMeta}>{user?.email ?? 'Ingen e-post kopplad'}</Text>
          {user?.role && <Text style={styles.profileBadge}>{user.role}</Text>}
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={() => logout()}>
          <Text style={styles.signOutLabel}>Logga ut</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.childrenContainer}>{children}</View>
    </View>
  );
};

const LoginButton = ({
  option,
  onPress,
  disabled,
}: {
  option: LoginOption;
  onPress: () => void;
  disabled: boolean;
}) => {
  const isDark = option.variant === 'dark';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.loginButton,
        isDark ? styles.loginButtonDark : styles.loginButtonLight,
        disabled && styles.loginButtonDisabled,
      ]}
    >
      <View style={[styles.loginIcon, isDark ? styles.loginIconDark : styles.loginIconLight]}>
        <Text style={isDark ? styles.loginIconTextDark : styles.loginIconTextLight}>{option.icon}</Text>
      </View>
      <View style={styles.loginCopy}>
        <Text style={isDark ? styles.loginLabelDark : styles.loginLabelLight}>{option.label}</Text>
        <Text style={styles.loginSubtitle}>{option.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  loadingLabel: {
    ...theme.typography.bodyM,
    color: theme.colors.textMuted,
  },
  unauthenticatedWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 88,
    height: 88,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  heroIconBackdrop: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconGlyph: {
    fontSize: 32,
  },
  heroTitle: {
    ...theme.typography.titleL,
    color: theme.colors.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...theme.typography.bodyS,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.control,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.control,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.brandMuted,
  },
  tabButtonLabel: {
    ...theme.typography.bodyS,
    color: theme.colors.textMuted,
  },
  tabButtonLabelActive: {
    color: theme.colors.brand,
    fontWeight: '600',
  },
  loginCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.soft,
    width: '100%',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.control,
    borderWidth: 1,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonLight: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  loginButtonDark: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  loginIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  loginIconLight: {
    backgroundColor: theme.colors.background,
  },
  loginIconDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  loginIconTextLight: {
    ...theme.typography.bodyM,
    color: theme.colors.text,
    fontWeight: '700',
  },
  loginIconTextDark: {
    ...theme.typography.bodyM,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loginCopy: {
    flex: 1,
  },
  loginLabelLight: {
    ...theme.typography.bodyM,
    color: theme.colors.text,
  },
  loginLabelDark: {
    ...theme.typography.bodyM,
    color: '#FFFFFF',
  },
  loginSubtitle: {
    ...theme.typography.bodyS,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  authorizingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.control,
    backgroundColor: theme.colors.brandMuted,
  },
  authorizingLabel: {
    ...theme.typography.bodyS,
    color: theme.colors.brand,
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.control,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.control,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: theme.colors.brandMuted,
  },
  modeButtonLabel: {
    ...theme.typography.bodyS,
    color: theme.colors.textMuted,
  },
  modeButtonLabelActive: {
    color: theme.colors.brand,
    fontWeight: '600',
  },
  inputGroup: {
    width: '100%',
    gap: 4,
  },
  inputLabel: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.textMuted,
  },
  inputField: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.control,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    ...theme.typography.bodyS,
  },
  inputFieldError: {
    borderColor: theme.colors.danger,
  },
  inputErrorText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.control,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.iconDisabled,
  },
  submitButtonLabel: {
    ...theme.typography.bodyM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  skipLink: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  skipLinkLabel: {
    ...theme.typography.bodyS,
    color: theme.colors.textMuted,
  },
  authenticatedWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  profileCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  profileGreeting: {
    ...theme.typography.bodyS,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  profileName: {
    ...theme.typography.titleM,
    color: theme.colors.text,
  },
  profileMeta: {
    ...theme.typography.bodyS,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  profileBadge: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.badges.success.background,
    color: theme.badges.success.foreground,
    ...theme.typography.caption,
  },
  signOutButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.control,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  signOutLabel: {
    ...theme.typography.bodyS,
    color: theme.colors.text,
  },
  childrenContainer: {
    flex: 1,
  },
});
