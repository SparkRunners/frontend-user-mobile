import type { AppEnvironment, RuntimeConfig } from './types';
import {
  APP_ENV,
  AUTH_API_BASE_URL,
  FRONTEND_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URI,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  SCOOTER_API_BASE_URL,
} from '@env';

const FALLBACK_ENV: AppEnvironment = 'mock';
const DEFAULT_TIMEOUT_MS = 15_000;

const coerceEnv = (value?: string): AppEnvironment => {
  const normalized = (value ?? '').toLowerCase() as AppEnvironment;
  return ['mock', 'dev', 'prod'].includes(normalized)
    ? normalized
    : FALLBACK_ENV;
};

const ensureValue = (value: string | undefined, label: string) => {
  if (!value && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[config] 环境变量 ${label} 尚未配置，相关接口可能无法访问`);
  }
  return value ?? '';
};

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

const resolvedEnv = coerceEnv(APP_ENV);

const frontendBaseUrl = (() => {
  const value = ensureValue(FRONTEND_URL, 'FRONTEND_URL');
  return value ? trimTrailingSlash(value) : '';
})();

export const runtimeConfig: RuntimeConfig = {
  env: resolvedEnv,
  services: {
    scooterApi: {
      baseUrl: ensureValue(SCOOTER_API_BASE_URL, 'SCOOTER_API_BASE_URL'),
      timeoutMs: DEFAULT_TIMEOUT_MS,
    },
    authApi: {
      baseUrl: ensureValue(AUTH_API_BASE_URL, 'AUTH_API_BASE_URL'),
      timeoutMs: DEFAULT_TIMEOUT_MS,
    },
  },
  oauth: {
    frontendRedirectUrl: frontendBaseUrl
      ? `${frontendBaseUrl}/oauth-callback`
      : '',
    frontendLoginUrl: frontendBaseUrl ? `${frontendBaseUrl}/login` : '',
    google: {
      clientId: ensureValue(GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
      redirectUri: ensureValue(GOOGLE_REDIRECT_URI, 'GOOGLE_REDIRECT_URI'),
    },
    github: {
      clientId: ensureValue(GITHUB_CLIENT_ID, 'GITHUB_CLIENT_ID'),
      redirectUri: ensureValue(GITHUB_REDIRECT_URI, 'GITHUB_REDIRECT_URI'),
    },
  },
};
