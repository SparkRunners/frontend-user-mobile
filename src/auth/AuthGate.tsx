import React from 'react';
import {
  ActivityIndicator,
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

export const AuthGate = ({ children }: AuthGateProps) => {
  const { isReady, isAuthenticated, isAuthorizing, user, login, logout } = useAuth();
  const insets = useSafeAreaInsets();

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
