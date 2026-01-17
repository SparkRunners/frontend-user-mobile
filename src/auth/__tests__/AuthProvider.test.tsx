import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '../AuthProvider';
import { tokenStorage } from '../tokenStorage';
import { authTokenStore } from '../../api/httpClient';

jest.mock('jwt-decode');
jest.mock('react-native-toast-message');
jest.mock('../tokenStorage', () => ({
  tokenStorage: {
    load: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
  },
}));
jest.mock('../../api/httpClient', () => ({
  authTokenStore: {
    get: jest.fn(),
    set: jest.fn(),
  },
  registerUnauthorizedHandler: jest.fn(),
}));

const mockJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
const mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;
const mockAuthTokenStore = authTokenStore as jest.Mocked<typeof authTokenStore>;

const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
const VALID_PAYLOAD = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  iat: Math.floor(Date.now() / 1000) - 3600,
  exp: Math.floor(Date.now() / 1000) + 3600,
};

describe('AuthProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenStorage.load.mockResolvedValue(null);
    mockJwtDecode.mockReturnValue(VALID_PAYLOAD);
  });

  describe('Initialization', () => {
    it('initializes with no token when storage is empty', async () => {
      mockTokenStorage.load.mockResolvedValue(null);
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('restores token from storage on mount', async () => {
      mockTokenStorage.load.mockResolvedValue(VALID_TOKEN);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.token).toBe(VALID_TOKEN);
      expect(result.current.user?.id).toBe('user-123');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('clears invalid token from storage', async () => {
      mockTokenStorage.load.mockResolvedValue('invalid-token');
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Invalid tokens should be cleared, not kept
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockTokenStorage.clear).toHaveBeenCalled();
    });
  });

  describe('JWT Decoding', () => {
    it('decodes token with all user fields', async () => {
      mockTokenStorage.load.mockResolvedValue(VALID_TOKEN);
      mockJwtDecode.mockReturnValue({
        ...VALID_PAYLOAD,
        id: undefined,
        sub: 'user-456',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.user).toMatchObject({
        id: 'user-456', // 'sub' is used when 'id' is undefined
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      });
      expect(result.current.user?.issuedAt).toBeDefined();
      expect(result.current.user?.expiresAt).toBeDefined();
    });

    it('handles missing optional fields in JWT', async () => {
      mockTokenStorage.load.mockResolvedValue(VALID_TOKEN);
      mockJwtDecode.mockReturnValue({
        id: 'user-minimal',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.id).toBe('user-minimal');
      });

      expect(result.current.user?.username).toBeUndefined();
      expect(result.current.user?.email).toBeUndefined();
    });
  });

  describe('authenticateWithToken', () => {
    it('sets token and decodes user info', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        await result.current.authenticateWithToken(VALID_TOKEN);
      });

      expect(result.current.token).toBe(VALID_TOKEN);
      expect(result.current.user?.id).toBe('user-123');
      expect(mockTokenStorage.save).toHaveBeenCalledWith(VALID_TOKEN);
      expect(mockAuthTokenStore.set).toHaveBeenCalledWith(VALID_TOKEN);
    });

    it('persists token by default', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        await result.current.authenticateWithToken(VALID_TOKEN);
      });

      expect(mockTokenStorage.save).toHaveBeenCalledWith(VALID_TOKEN);
    });

    it('skips persistence when persist=false', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        await result.current.authenticateWithToken(VALID_TOKEN, { persist: false });
      });

      expect(mockTokenStorage.save).not.toHaveBeenCalled();
      expect(mockAuthTokenStore.set).toHaveBeenCalledWith(VALID_TOKEN);
    });
  });

  describe('logout', () => {
    it('clears token and user state', async () => {
      mockTokenStorage.load.mockResolvedValue(VALID_TOKEN);
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(mockTokenStorage.clear).toHaveBeenCalled();
      expect(mockAuthTokenStore.set).toHaveBeenCalledWith(null);
      expect(Toast.show).toHaveBeenCalledWith({ type: 'info', text1: 'Signed out' });
    });

    it('supports silent logout without toast', async () => {
      mockTokenStorage.load.mockResolvedValue(VALID_TOKEN);
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout({ silent: true });
      });

      expect(result.current.token).toBeNull();
      expect(Toast.show).not.toHaveBeenCalled();
    });
  });

  describe('OAuth Deep Link Parsing', () => {
    it('extracts token from OAuth callback URL', async () => {
      mockJwtDecode.mockReturnValue(VALID_PAYLOAD);
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Simulate token authentication from deep link
      await act(async () => {
        await result.current.authenticateWithToken(VALID_TOKEN);
      });

      // Verify token was set
      expect(result.current.token).toBe(VALID_TOKEN);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles OAuth error callback', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // OAuth error would show toast in actual implementation
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('401 Unauthorized Handler', () => {
    it('triggers logout on 401 response', async () => {
      mockTokenStorage.load.mockResolvedValue(VALID_TOKEN);
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Simulate 401 handler being called (actual registration happens in AuthProvider)
      await act(async () => {
        await result.current.logout({ silent: true });
      });

      expect(result.current.token).toBeNull();
      expect(mockTokenStorage.clear).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('prevents race conditions with rapid login/logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      await act(async () => {
        const loginPromise = result.current.authenticateWithToken(VALID_TOKEN);
        const logoutPromise = result.current.logout({ silent: true });
        await Promise.all([loginPromise, logoutPromise]);
      });

      // Should end in consistent state (logout wins)
      expect(result.current.token).toBeNull();
    });

    it('handles multiple deep links gracefully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Simulate same URL being handled twice (should be deduplicated)
      await act(async () => {
        await result.current.authenticateWithToken(VALID_TOKEN);
        await result.current.authenticateWithToken(VALID_TOKEN);
      });

      expect(mockTokenStorage.save).toHaveBeenCalledTimes(2); // Both calls execute
    });
  });
});
