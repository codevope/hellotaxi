import { create } from 'zustand';
import type { Ride, Driver, User } from '@/lib/types';

type IncomingRequest = Ride & { passenger: User };

interface DriverRideState {
  isAvailable: boolean;
  incomingRequest: IncomingRequest | null;
  activeRide: (Ride & { passenger: User; driver: Driver }) | null;
  isCountering: boolean; 
}

interface DriverRideActions {
  setAvailability: (isAvailable: boolean) => void;
  setIncomingRequest: (request: IncomingRequest | null) => void;
  setActiveRide: (ride: (Ride & { passenger: User; driver: Driver }) | null) => void;
  setIsCountering: (isCountering: boolean) => void;
  resetDriverState: () => void;
}

const initialState: DriverRideState = {
  isAvailable: false,
  incomingRequest: null,
  activeRide: null,
  isCountering: false,
};

export const useDriverRideStore = create<DriverRideState & DriverRideActions>((set) => ({
  ...initialState,
  setAvailability: (isAvailable) => set({ isAvailable }),
  setIncomingRequest: (request) => set({ incomingRequest: request }),
  setActiveRide: (ride) => set({ activeRide: ride }),
  setIsCountering: (isCountering) => set({ isCountering }),
  resetDriverState: () => set(initialState),
}));
