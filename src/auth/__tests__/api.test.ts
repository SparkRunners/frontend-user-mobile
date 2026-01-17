import { loginWithEmail, registerWithEmail } from '../api';
import { authApiClient } from '../../api/httpClient';
import { AxiosError } from 'axios';

jest.mock('../../api/httpClient', () => ({
  authApiClient: {
    post: jest.fn(),
  },
}));

const mockAuthApi = authApiClient as jest.Mocked<typeof authApiClient>;

describe('auth api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginWithEmail', () => {
    it('successfully logs in with email and password', async () => {
      mockAuthApi.post.mockResolvedValue({
        data: { token: 'jwt-token-12345' },
      });

      const result = await loginWithEmail({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockAuthApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({ token: 'jwt-token-12345' });
    });

    it('throws normalized error when API returns error message', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: { error: 'Invalid credentials' },
        },
        message: 'Request failed',
      } as AxiosError;

      mockAuthApi.post.mockRejectedValue(axiosError);

      await expect(
        loginWithEmail({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('falls back to axios error message when no error field', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {},
        },
        message: 'Network Error',
      } as AxiosError;

      mockAuthApi.post.mockRejectedValue(axiosError);

      await expect(
        loginWithEmail({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Network Error');
    });

    it('handles non-axios errors', async () => {
      mockAuthApi.post.mockRejectedValue(new Error('Custom error'));

      await expect(
        loginWithEmail({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Custom error');
    });

    it('handles unknown error types with default message', async () => {
      mockAuthApi.post.mockRejectedValue('String error');

      await expect(
        loginWithEmail({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Något gick fel, försök igen');
    });

    it('works with different email formats', async () => {
      mockAuthApi.post.mockResolvedValue({
        data: { token: 'valid-token' },
      });

      await loginWithEmail({
        email: 'user.name+tag@example.co.uk',
        password: 'pass',
      });

      expect(mockAuthApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'user.name+tag@example.co.uk',
        password: 'pass',
      });
    });
  });

  describe('registerWithEmail', () => {
    it('successfully registers with required fields', async () => {
      mockAuthApi.post.mockResolvedValue({
        data: {
          id: 'new-user-123',
          username: 'newuser',
          email: 'new@example.com',
        },
      });

      const result = await registerWithEmail({
        username: 'newuser',
        email: 'new@example.com',
        password: 'securepassword',
      });

      expect(mockAuthApi.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'new@example.com',
        password: 'securepassword',
      });
      expect(result).toEqual({
        id: 'new-user-123',
        username: 'newuser',
        email: 'new@example.com',
      });
    });

    it('includes optional role field when provided', async () => {
      mockAuthApi.post.mockResolvedValue({
        data: {
          id: 'admin-user',
          username: 'adminuser',
          email: 'admin@example.com',
          role: ['admin', 'user'],
        },
      });

      const result = await registerWithEmail({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'adminpass',
        role: ['admin', 'user'],
      });

      expect(mockAuthApi.post).toHaveBeenCalledWith('/auth/register', {
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'adminpass',
        role: ['admin', 'user'],
      });
      expect(result.role).toEqual(['admin', 'user']);
    });

    it('throws normalized error for duplicate email', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: { error: 'Email already exists' },
        },
        message: 'Request failed',
      } as AxiosError;

      mockAuthApi.post.mockRejectedValue(axiosError);

      await expect(
        registerWithEmail({
          username: 'testuser',
          email: 'existing@example.com',
          password: 'password',
        }),
      ).rejects.toThrow('Email already exists');
    });

    it('throws normalized error for invalid payload', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: { error: 'Username must be at least 3 characters' },
        },
        message: 'Bad Request',
      } as AxiosError;

      mockAuthApi.post.mockRejectedValue(axiosError);

      await expect(
        registerWithEmail({
          username: 'ab',
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow('Username must be at least 3 characters');
    });

    it('handles network errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
        message: 'Network timeout',
      } as AxiosError;

      mockAuthApi.post.mockRejectedValue(axiosError);

      await expect(
        registerWithEmail({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow('Network timeout');
    });

    it('handles non-axios errors', async () => {
      mockAuthApi.post.mockRejectedValue(new Error('Server error'));

      await expect(
        registerWithEmail({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow('Server error');
    });

    it('handles unknown error types', async () => {
      mockAuthApi.post.mockRejectedValue({ some: 'unknown error' });

      await expect(
        registerWithEmail({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow('Något gick fel, försök igen');
    });

    it('works with complex passwords', async () => {
      mockAuthApi.post.mockResolvedValue({
        data: {
          id: 'user-id',
          username: 'secureuser',
          email: 'secure@example.com',
        },
      });

      await registerWithEmail({
        username: 'secureuser',
        email: 'secure@example.com',
        password: 'C0mpl3x!P@ssw0rd#2024',
      });

      expect(mockAuthApi.post).toHaveBeenCalledWith('/auth/register', {
        username: 'secureuser',
        email: 'secure@example.com',
        password: 'C0mpl3x!P@ssw0rd#2024',
      });
    });
  });

  describe('Error Normalization', () => {
    it('extracts error message from nested response structure', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: 'Detailed error message',
            code: 400,
          },
        },
        message: 'Generic message',
      } as AxiosError;

      mockAuthApi.post.mockRejectedValue(axiosError);

      await expect(
        loginWithEmail({ email: 'test@test.com', password: 'pass' }),
      ).rejects.toThrow('Detailed error message');
    });

    it('preserves Error instances', async () => {
      const customError = new Error('Custom Error Instance');
      mockAuthApi.post.mockRejectedValue(customError);

      await expect(
        loginWithEmail({ email: 'test@test.com', password: 'pass' }),
      ).rejects.toThrow('Custom Error Instance');
    });

    it('handles axios errors without response', async () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Connection refused',
      } as AxiosError;

      mockAuthApi.post.mockRejectedValue(axiosError);

      await expect(
        registerWithEmail({
          username: 'test',
          email: 'test@test.com',
          password: 'pass',
        }),
      ).rejects.toThrow('Connection refused');
    });
  });
});
