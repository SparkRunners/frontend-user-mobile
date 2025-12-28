export type AppEnvironment = 'mock' | 'dev' | 'prod';

export interface ServiceEndpointConfig {
  baseUrl: string;
  timeoutMs?: number;
}

export interface OAuthProviderConfig {
  clientId: string;
  redirectUri: string;
}

export interface OAuthConfig {
  frontendRedirectUrl: string;
  google: OAuthProviderConfig;
  github: OAuthProviderConfig;
}

export interface RuntimeConfig {
  env: AppEnvironment;
  services: {
    scooterApi: ServiceEndpointConfig;
    authApi: ServiceEndpointConfig;
  };
  oauth: OAuthConfig;
}
