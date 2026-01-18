import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ride } from './types';
import { rideApi } from './api';

interface RideContextType {
  currentRide: Ride | null;
  lastRide: Ride | null;
  isRiding: boolean;
  durationSeconds: number;
  currentCost: number;
  startRide: (scooterId: string) => Promise<void>;
  endRide: () => Promise<void>;
  clearLastRide: () => void;
  isLoading: boolean;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider = ({ children }: { children: ReactNode }) => {
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [lastRide, setLastRide] = useState<Ride | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Constants for pricing
  const UNLOCK_FEE = 10;
  const PRICE_PER_MINUTE = 2.5;

  const isRiding = !!currentRide;
  const currentCost = currentRide 
    ? UNLOCK_FEE + (Math.ceil(durationSeconds / 60) * PRICE_PER_MINUTE)
    : 0;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRiding) {
      interval = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRiding]);

  const startRide = async (scooterId: string) => {
    if (!scooterId) {
      throw new Error('Scooter-id saknas. Försök att läsa QR-koden igen.');
    }
    if (currentRide || isLoading) {
      throw new Error('Du har redan en pågående resa. Avsluta den innan du låser upp en ny.');
    }
    setIsLoading(true);
    setLastRide(null);
    try {
      const ride = await rideApi.startRide(scooterId);
      setCurrentRide(ride);
      setDurationSeconds(0);
    } catch (error) {
      console.error('Failed to start ride', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const endRide = async () => {
    if (!currentRide) return;
    setIsLoading(true);
    const completedAt = new Date().toISOString();
    const fallbackRide: Ride = {
      ...currentRide,
      status: 'completed',
      endTime: completedAt,
      durationSeconds,
      cost: currentCost,
    };
    try {
      const completedRide = await rideApi.endRide(currentRide.scooterId, fallbackRide);
      // Use frontend calculated duration if backend returns 0 (due to rounding)
      // But always trust backend for cost calculation
      const finalRide = {
        ...completedRide,
        durationSeconds: completedRide.durationSeconds > 0 ? completedRide.durationSeconds : durationSeconds,
      };
      setLastRide(finalRide);
      setCurrentRide(null);
      setDurationSeconds(0);
    } catch (error) {
      console.error('Failed to end ride', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearLastRide = () => {
    setLastRide(null);
  };

  return (
    <RideContext.Provider value={{
      currentRide,
      lastRide,
      isRiding,
      durationSeconds,
      currentCost,
      startRide,
      endRide,
      clearLastRide,
      isLoading
    }}>
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (context === undefined) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};
