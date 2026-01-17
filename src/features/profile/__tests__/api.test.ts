import { userApi } from '../api';
import { scooterApiClient } from '../../../api/httpClient';

jest.mock('../../../api/httpClient', () => ({
  scooterApiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockScooterApi = scooterApiClient as jest.Mocked<typeof scooterApiClient>;

describe('userApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProfile', () => {
    it('successfully retrieves user profile', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          balance: 150.50,
          role: 'customer',
        },
      });

      const profile = await userApi.getProfile('user-123');

      expect(mockScooterApi.get).toHaveBeenCalledWith('/users/user-123');
      expect(profile).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        balance: 150.50,
        role: 'customer',
      });
    });

    it('handles profile wrapped in user object', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          user: {
            id: 'user-456',
            username: 'anotheruser',
            email: 'another@example.com',
          },
        },
      });

      const profile = await userApi.getProfile('user-456');

      expect(profile).toEqual({
        id: 'user-456',
        username: 'anotheruser',
        email: 'another@example.com',
      });
    });

    it('uses _id as fallback when id is not present', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          _id: 'user-mongo-id',
          username: 'mongouser',
        },
      });

      const profile = await userApi.getProfile('user-mongo-id');

      expect(profile.id).toBe('user-mongo-id');
    });

    it('handles optional fields gracefully', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          id: 'minimal-user',
        },
      });

      const profile = await userApi.getProfile('minimal-user');

      expect(profile).toEqual({
        id: 'minimal-user',
        username: undefined,
        email: undefined,
        balance: undefined,
        role: undefined,
      });
    });

    it('throws error when profile response is invalid', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: { invalidField: 'no id present' },
      });

      await expect(userApi.getProfile('user-123')).rejects.toThrow(
        'Kunde inte hämta användarprofil',
      );
    });

    it('throws error when response data is null', async () => {
      mockScooterApi.get.mockResolvedValue({ data: null });

      await expect(userApi.getProfile('user-123')).rejects.toThrow(
        'Kunde inte hämta användarprofil',
      );
    });

    it('handles API errors', async () => {
      mockScooterApi.get.mockRejectedValue(new Error('Network error'));

      await expect(userApi.getProfile('user-123')).rejects.toThrow(
        'Kunde inte hämta användarprofil',
      );

      expect(console.error).toHaveBeenCalledWith(
        '[userApi] Failed to get profile:',
        expect.any(Error),
      );
    });
  });

  describe('getBalance', () => {
    it('retrieves balance as direct number', async () => {
      mockScooterApi.get.mockResolvedValue({ data: 250.75 });

      const balance = await userApi.getBalance('user-123');

      expect(mockScooterApi.get).toHaveBeenCalledWith('/users/user-123/balance');
      expect(balance).toBe(250.75);
    });

    it('extracts balance from object with balance field', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: { balance: 100.00 },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(100.00);
    });

    it('extracts balance from object with newBalance field', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: { newBalance: 300.50 },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(300.50);
    });

    it('extracts balance from nested user.balance', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          user: { balance: 175.25 },
        },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(175.25);
    });

    it('extracts balance from nested user.newBalance', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          user: { newBalance: 425.00 },
        },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(425.00);
    });

    it('extracts balance from nested data.balance', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          data: { balance: 550.00 },
        },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(550.00);
    });

    it('extracts balance from nested data.newBalance', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          data: { newBalance: 75.50 },
        },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(75.50);
    });

    it('returns 0 when balance cannot be extracted', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: { someField: 'no balance' },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(0);
      expect(console.warn).toHaveBeenCalledWith(
        '[userApi] Could not extract balance from response:',
        expect.anything(),
      );
    });

    it('handles API errors', async () => {
      mockScooterApi.get.mockRejectedValue(new Error('Network error'));

      await expect(userApi.getBalance('user-123')).rejects.toThrow(
        'Kunde inte hämta saldo',
      );

      expect(console.error).toHaveBeenCalledWith(
        '[userApi] Failed to get balance:',
        expect.any(Error),
      );
    });
  });

  describe('fillup', () => {
    it('successfully fills up balance', async () => {
      mockScooterApi.post.mockResolvedValue({
        data: {
          balance: 500.00,
          message: 'Balance updated successfully',
        },
      });

      const result = await userApi.fillup('user-123', 100);

      expect(mockScooterApi.post).toHaveBeenCalledWith('/users/user-123/fillup', {
        amount: 100,
      });
      expect(result).toEqual({
        balance: 500.00,
        message: 'Balance updated successfully',
      });
    });

    it('extracts balance from various response formats', async () => {
      mockScooterApi.post.mockResolvedValue({
        data: { newBalance: 600.00 },
      });

      const result = await userApi.fillup('user-123', 50);

      expect(result.balance).toBe(600.00);
    });

    it('handles fillup without message field', async () => {
      mockScooterApi.post.mockResolvedValue({
        data: { balance: 450.00 },
      });

      const result = await userApi.fillup('user-123', 75);

      expect(result).toEqual({
        balance: 450.00,
        message: undefined,
      });
    });

    it('logs fillup response and extracted balance', async () => {
      const responseData = { balance: 350.00, message: 'Success' };
      mockScooterApi.post.mockResolvedValue({ data: responseData });

      await userApi.fillup('user-123', 25);

      expect(console.log).toHaveBeenCalledWith(
        '[userApi] Fillup response:',
        responseData,
      );
      expect(console.log).toHaveBeenCalledWith(
        '[userApi] Extracted balance:',
        350.00,
      );
    });

    it('handles API errors', async () => {
      mockScooterApi.post.mockRejectedValue(new Error('Payment failed'));

      await expect(userApi.fillup('user-123', 100)).rejects.toThrow(
        'Kunde inte fylla på saldo',
      );

      expect(console.error).toHaveBeenCalledWith(
        '[userApi] Failed to fillup:',
        expect.any(Error),
      );
    });

    it('works with different user IDs and amounts', async () => {
      mockScooterApi.post.mockResolvedValue({
        data: { balance: 1000.00 },
      });

      await userApi.fillup('different-user-id', 250);

      expect(mockScooterApi.post).toHaveBeenCalledWith(
        '/users/different-user-id/fillup',
        { amount: 250 },
      );
    });

    it('returns balance 0 if extraction fails', async () => {
      mockScooterApi.post.mockResolvedValue({
        data: { unexpectedField: 'no balance' },
      });

      const result = await userApi.fillup('user-123', 50);

      expect(result.balance).toBe(0);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Balance Extraction Priority', () => {
    it('prefers balance over newBalance at top level', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          balance: 100,
          newBalance: 200,
        },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(100);
    });

    it('prefers user.balance over data.balance', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          user: { balance: 150 },
          data: { balance: 250 },
        },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(150);
    });

    it('checks data.balance when top-level and user.balance are not available', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          data: { balance: 350 },
        },
      });

      const balance = await userApi.getBalance('user-123');

      expect(balance).toBe(350);
    });
  });
});
