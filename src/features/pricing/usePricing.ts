import { useMemo } from 'react';
import { mockPricing } from './mockPricing';
import type { PricingInfo } from './types';

interface UsePricingResult {
  pricing: PricingInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<PricingInfo | null>;
}

export const usePricing = (): UsePricingResult => {
  const value = useMemo<UsePricingResult>(() => ({
    pricing: mockPricing,
    isLoading: false,
    error: null,
    refetch: async () => mockPricing,
  }), []);

  return value;
};
