import { PricingInfo } from './types';

export const mockPricing: PricingInfo = {
  city: 'Stockholm',
  currency: 'kr',
  baseFare: 10,
  perMinute: 2.5,
  note: 'Priser kan variera mellan zoner. Aktuell stad: Stockholm.',
  updatedAt: new Date().toISOString(),
};
