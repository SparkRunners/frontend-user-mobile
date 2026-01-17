import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth';
import { userApi } from './api';

interface UseBalanceResult {
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fillup: (amount: number) => Promise<void>;
}

export const useBalance = (): UseBalanceResult => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    if (!user?.id) {
      setBalance(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedBalance = await userApi.getBalance(user.id);
      setBalance(fetchedBalance);
    } catch (err) {
      console.error('[useBalance] Failed to load balance:', err);
      setError(err instanceof Error ? err.message : 'Kunde inte hämta saldo');
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fillup = useCallback(async (amount: number) => {
    if (!user?.id) {
      throw new Error('Ingen användare inloggad');
    }

    if (amount <= 0) {
      throw new Error('Beloppet måste vara större än 0');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await userApi.fillup(user.id, amount);
      setBalance(result.balance);
    } catch (err) {
      console.error('[useBalance] Failed to fillup:', err);
      const message = err instanceof Error ? err.message : 'Kunde inte fylla på saldo';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  return {
    balance,
    isLoading,
    error,
    refetch: loadBalance,
    fillup,
  };
};
