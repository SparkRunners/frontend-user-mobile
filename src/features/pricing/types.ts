export interface PricingInfo {
  city: string;
  currency: string;
  baseFare: number; // unlock/base fee
  perMinute: number;
  note?: string;
  updatedAt?: string;
}
