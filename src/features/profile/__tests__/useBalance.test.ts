import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBalance } from '../useBalance';
import { userApi } from '../api';
import { useAuth } from '../../../auth';

jest.mock('../api', () => ({
  userApi: {
    getBalance: jest.fn(),
    fillup: jest.fn(),
  },
}));

jest.mock('../../../auth', () => ({
  useAuth: jest.fn(),
}));

const mockUserApi = userApi as jest.Mocked<typeof userApi>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useBalance', () => {
  const mockUser = { id: 'user-123', username: 'testuser' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'valid-token',
      isReady: true,
      isAuthenticated: true,
      isAuthorizing: false,
      login: jest.fn(),
      authenticateWithToken: jest.fn(),
      logout: jest.fn(),
    });
  });

  describe('Balance Loading', () => {
    it('loads balance on mount when user is authenticated', async () => {
      mockUserApi.getBalance.mockResolvedValue(150.50);

      const { result } = renderHook(() => useBalance());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.balance).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockUserApi.getBalance).toHaveBeenCalledWith('user-123');
      expect(result.current.balance).toBe(150.50);
      expect(result.current.error).toBeNull();
    });

    it('does not load balance when user is not logged in', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isReady: true,
        isAuthenticated: false,
        isAuthorizing: false,
        login: jest.fn(),
        authenticateWithToken: jest.fn(),
        logout: jest.fn(),
      });

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockUserApi.getBalance).not.toHaveBeenCalled();
      expect(result.current.balance).toBeNull();
    });

    it('handles API error gracefully', async () => {
      mockUserApi.getBalance.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.balance).toBeNull();
    });

    it('handles non-Error rejections', async () => {
      mockUserApi.getBalance.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Kunde inte hämta saldo');
    });
  });

  describe('Balance Refetch', () => {
    it('refetches balance when refetch is called', async () => {
      mockUserApi.getBalance
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(200);

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.balance).toBe(200);
      expect(mockUserApi.getBalance).toHaveBeenCalledTimes(2);
    });

    it('clears previous error on successful refetch', async () => {
      mockUserApi.getBalance
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(250);

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.balance).toBe(250);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Fillup', () => {
    it('successfully fills up balance', async () => {
      mockUserApi.getBalance.mockResolvedValue(100);
      mockUserApi.fillup.mockResolvedValue({ balance: 200, message: 'Success' });

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      await act(async () => {
        await result.current.fillup(100);
      });

      expect(mockUserApi.fillup).toHaveBeenCalledWith('user-123', 100);
      expect(result.current.balance).toBe(200);
      expect(result.current.error).toBeNull();
    });

    it('throws error when user is not logged in', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isReady: true,
        isAuthenticated: false,
        isAuthorizing: false,
        login: jest.fn(),
        authenticateWithToken: jest.fn(),
        logout: jest.fn(),
      });

      const { result } = renderHook(() => useBalance());

      await act(async () => {
        await expect(result.current.fillup(50)).rejects.toThrow('Ingen användare inloggad');
      });

      expect(mockUserApi.fillup).not.toHaveBeenCalled();
    });

    it('validates amount is greater than 0', async () => {
      mockUserApi.getBalance.mockResolvedValue(100);

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      await act(async () => {
        await expect(result.current.fillup(0)).rejects.toThrow('Beloppet måste vara större än 0');
      });

      await act(async () => {
        await expect(result.current.fillup(-10)).rejects.toThrow('Beloppet måste vara större än 0');
      });

      expect(mockUserApi.fillup).not.toHaveBeenCalled();
    });

    it('handles fillup API error', async () => {
      mockUserApi.getBalance.mockResolvedValue(100);
      mockUserApi.fillup.mockRejectedValue(new Error('Payment failed'));

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      await act(async () => {
        await expect(result.current.fillup(50)).rejects.toThrow('Payment failed');
      });

      expect(result.current.error).toBe('Payment failed');
      expect(result.current.balance).toBe(100); // Balance unchanged on error
    });

    it('sets error state for non-Error rejections', async () => {
      mockUserApi.getBalance.mockResolvedValue(100);
      mockUserApi.fillup.mockRejectedValue('Unknown fillup error');

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      await act(async () => {
        await expect(result.current.fillup(50)).rejects.toBeTruthy();
      });

      expect(result.current.error).toBe('Kunde inte fylla på saldo');
    });
  });

  describe('Loading State', () => {
    it('sets loading state during balance fetch', async () => {
      let resolveBalance: (value: number) => void;
      const balancePromise = new Promise<number>(resolve => {
        resolveBalance = resolve;
      });
      mockUserApi.getBalance.mockReturnValue(balancePromise);

      const { result } = renderHook(() => useBalance());

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveBalance!(300);
        await balancePromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets loading state during fillup', async () => {
      mockUserApi.getBalance.mockResolvedValue(100);
      
      let resolveFillup: (value: { balance: number }) => void;
      const fillupPromise = new Promise<{ balance: number }>(resolve => {
        resolveFillup = resolve;
      });
      mockUserApi.fillup.mockReturnValue(fillupPromise);

      const { result } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      let fillupPromiseRef: Promise<void>;
      act(() => {
        fillupPromiseRef = result.current.fillup(50);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveFillup!({ balance: 150 });
        await fillupPromise;
        await fillupPromiseRef!;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.balance).toBe(150);
    });
  });

  describe('User ID Changes', () => {
    it('reloads balance when user changes', async () => {
      mockUserApi.getBalance.mockResolvedValue(100);

      const { result, rerender } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      // Change user
      mockUseAuth.mockReturnValue({
        user: { id: 'user-456', username: 'newuser' },
        token: 'new-token',
        isReady: true,
        isAuthenticated: true,
        isAuthorizing: false,
        login: jest.fn(),
        authenticateWithToken: jest.fn(),
        logout: jest.fn(),
      });
      mockUserApi.getBalance.mockResolvedValue(500);

      rerender();

      await waitFor(() => {
        expect(result.current.balance).toBe(500);
      });

      expect(mockUserApi.getBalance).toHaveBeenCalledWith('user-456');
    });

    it('clears balance when user logs out', async () => {
      mockUserApi.getBalance.mockResolvedValue(100);

      const { result, rerender } = renderHook(() => useBalance());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      // User logs out
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isReady: true,
        isAuthenticated: false,
        isAuthorizing: false,
        login: jest.fn(),
        authenticateWithToken: jest.fn(),
        logout: jest.fn(),
      });

      rerender();

      await waitFor(() => {
        expect(result.current.balance).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });
  });
});
