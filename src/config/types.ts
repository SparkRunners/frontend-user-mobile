export type AppEnvironment = 'mock' | 'dev' | 'prod';

export interface ServiceEndpointConfig {
  baseUrl: string;
  timeoutMs?: number;
}

export interface SimulationConfig {
  enabled: boolean;
  socketUrl: string;
}

export interface OAuthProviderConfig {
  clientId: string;
  redirectUri: string;
}

export interface OAuthConfig {
  frontendRedirectUrl: string;
  frontendLoginUrl: string;
  google: OAuthProviderConfig;
  github: OAuthProviderConfig;
}

export interface RuntimeConfig {
  env: AppEnvironment;
  services: {
    scooterApi: ServiceEndpointConfig;
    authApi: ServiceEndpointConfig;
  };
  simulation: SimulationConfig;
  oauth: OAuthConfig;
}
