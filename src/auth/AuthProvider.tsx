import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking } from 'react-native';
import jwtDecode from 'jwt-decode';
import Toast from 'react-native-toast-message';
import { runtimeConfig } from '../config';
import { authTokenStore, registerUnauthorizedHandler } from '../api/httpClient';
import { tokenStorage } from './tokenStorage';
import type { AuthJwtPayload, AuthUser, OAuthProviderName } from './types';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
  isAuthorizing: boolean;
  isAuthenticated: boolean;
  login: (provider: OAuthProviderName) => Promise<void>;
  logout: (options?: { silent?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const decodeToken = (token: string): AuthUser | null => {
  try {
    const payload = jwtDecode<AuthJwtPayload>(token);
    return {
      id: payload.id ?? payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      issuedAt: payload.iat ? payload.iat * 1000 : undefined,
      expiresAt: payload.exp ? payload.exp * 1000 : undefined,
      payload,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[auth] Failed to decode JWT:', error);
    }
    return null;
  }
};

const providerAuthorizePaths: Record<OAuthProviderName, string> = {
  google: '/auth/google',
  github: '/auth/github',
  apple: '/auth/apple',
};

const buildOAuthAuthorizeUrl = (provider: OAuthProviderName) => {
  const baseUrl = runtimeConfig.services.authApi.baseUrl;
  if (!baseUrl) {
    throw new Error('AUTH_API_BASE_URL is not configured, cannot start login flow');
  }
  const path = providerAuthorizePaths[provider];
  if (!path) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
  const trimmedBase = baseUrl.replace(/\/$/, '');
  const url = `${trimmedBase}${path}`;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}client=mobile`;
};

const normalizePathname = (value: string) => value.replace(/\/$/, '') || '/';

const isSameDeepLinkTarget = (incomingUrl: string, expectedUrl?: string) => {
  if (!expectedUrl) {
    return false;
  }
  try {
    const incoming = new URL(incomingUrl);
    const expected = new URL(expectedUrl);
    return (
      incoming.protocol === expected.protocol &&
      incoming.host === expected.host &&
      normalizePathname(incoming.pathname) === normalizePathname(expected.pathname)
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[auth] Failed to parse deep link:', error);
    }
    return false;
  }
};

type OAuthDeepLinkResult =
  | { kind: 'success'; token: string | null }
  | { kind: 'error'; code: string | null };

const parseOAuthDeepLink = (url: string): OAuthDeepLinkResult | null => {
  if (isSameDeepLinkTarget(url, runtimeConfig.oauth.frontendRedirectUrl)) {
    try {
      const parsed = new URL(url);
      const token = parsed.searchParams.get('token');
      return { kind: 'success', token };
    } catch (error) {
      if (__DEV__) {
        console.warn('[auth] Failed to parse OAuth callback:', error);
      }
      return null;
    }
  }

  if (isSameDeepLinkTarget(url, runtimeConfig.oauth.frontendLoginUrl)) {
    try {
      const parsed = new URL(url);
      const code = parsed.searchParams.get('error');
      return { kind: 'error', code };
    } catch (error) {
      if (__DEV__) {
        console.warn('[auth] Failed to parse login error callback:', error);
      }
      return null;
    }
  }

  return null;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const isMountedRef = useRef(true);
  const lastHandledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateTokenState = useCallback(
    async (nextToken: string | null, options?: { persist?: boolean }) => {
      authTokenStore.set(nextToken);
      const shouldPersist = options?.persist ?? true;
      if (shouldPersist) {
        if (nextToken) {
          await tokenStorage.save(nextToken);
        } else {
          await tokenStorage.clear();
        }
      }
      if (isMountedRef.current) {
        setToken(nextToken);
        setUser(nextToken ? decodeToken(nextToken) : null);
      }
    },
    [],
  );

  const logout = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        await updateTokenState(null);
        if (!options?.silent) {
          Toast.show({ type: 'info', text1: 'Signed out' });
        }
      } finally {
        if (isMountedRef.current) {
          setIsAuthorizing(false);
        }
      }
    },
    [updateTokenState],
  );

  const handleDeepLink = useCallback(
    async (url?: string | null) => {
      if (!url || lastHandledUrlRef.current === url) {
        return;
      }
      const result = parseOAuthDeepLink(url);
      if (!result) {
        return;
      }
      lastHandledUrlRef.current = url;
      setIsAuthorizing(false);

      if (result.kind === 'error') {
        Toast.show({
          type: 'error',
          text1: 'Sign-in failed',
          text2: result.code ? `OAuth error: ${result.code}` : 'OAuth sign-in failed',
        });
        return;
      }

      if (!result.token) {
        Toast.show({
          type: 'error',
          text1: 'Sign-in failed',
          text2: 'Access token not found',
        });
        return;
      }

      try {
        await updateTokenState(result.token);
        Toast.show({ type: 'success', text1: 'Signed in successfully' });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Failed to save session',
          text2: error instanceof Error ? error.message : 'Please try again',
        });
      }
    },
    [updateTokenState],
  );

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const storedToken = await tokenStorage.load();
        if (cancelled) {
          return;
        }
        if (storedToken) {
          await updateTokenState(storedToken, { persist: false });
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load saved session',
          text2: error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [updateTokenState]);

  useEffect(() => {
    Linking.getInitialURL().then(handleDeepLink).catch(() => undefined);
    const subscription = Linking.addEventListener('url', event => {
      handleDeepLink(event.url);
    });
    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  const login = useCallback(
    async (provider: OAuthProviderName) => {
      if (isAuthorizing) {
        return;
      }
      setIsAuthorizing(true);
      try {
        const url = buildOAuthAuthorizeUrl(provider);
        await Linking.openURL(url);
      } catch (error) {
        setIsAuthorizing(false);
        Toast.show({
          type: 'error',
          text1: 'Unable to open login page',
          text2: error instanceof Error ? error.message : 'Please try again later',
        });
      }
    },
    [isAuthorizing],
  );

  useEffect(() => {
    const handler = () => {
      logout({ silent: true }).finally(() => {
        Toast.show({ type: 'error', text1: 'Session expired' });
      });
    };
    registerUnauthorizedHandler(handler);
    return () => registerUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      isReady,
      isAuthorizing,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user, isReady, isAuthorizing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider />');
  }
  return context;
};
