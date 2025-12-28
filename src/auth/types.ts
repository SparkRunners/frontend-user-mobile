import type { JwtPayload } from 'jwt-decode';

export type OAuthProviderName = 'google' | 'github';

export interface AuthUser {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
}

export interface AuthUser {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  issuedAt?: number;
  expiresAt?: number;
  payload?: AuthJwtPayload;
}
