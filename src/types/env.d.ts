declare module '@env' {
  export const APP_ENV: 'mock' | 'dev' | 'prod';
  export const AUTH_API_BASE_URL: string;
  export const FRONTEND_URL: string;
  export const GOOGLE_CLIENT_ID: string;
  export const GOOGLE_CLIENT_SECRET: string;
  export const GOOGLE_REDIRECT_URI: string;
  export const GITHUB_CLIENT_ID: string;
  export const GITHUB_CLIENT_SECRET: string;
  export const GITHUB_REDIRECT_URI: string;
  export const SCOOTER_API_BASE_URL: string;
  export const USE_SIMULATION: string;
  export const SIMULATION_SOCKET_URL: string;
}
