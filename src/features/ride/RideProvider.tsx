import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ride } from './types';
import { rideApi } from './api';

interface RideContextType {
  currentRide: Ride | null;
  isRiding: boolean;
  durationSeconds: number;
  currentCost: number;
  startRide: (scooterId: string) => Promise<void>;
  endRide: () => Promise<void>;
  isLoading: boolean;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider = ({ children }: { children: ReactNode }) => {
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
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
    setIsLoading(true);
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
    try {
      await rideApi.endRide(currentRide.id);
      setCurrentRide(null);
      setDurationSeconds(0);
    } catch (error) {
      console.error('Failed to end ride', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RideContext.Provider value={{
      currentRide,
      isRiding,
      durationSeconds,
      currentCost,
      startRide,
      endRide,
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
