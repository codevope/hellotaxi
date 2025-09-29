
import { create } from 'zustand';
import type { Ride, Driver, ChatMessage, Location } from '@/lib/types';
import type { RouteInfo } from '@/hooks/use-eta-calculator';

export type RideStatus =
  | 'idle'
  | 'calculating'
  | 'calculated'
  | 'negotiating'
  | 'searching'
  | 'assigned'
  | 'rating';

interface RideState {
  status: RideStatus;
  activeRide: Ride | null;
  assignedDriver: Driver | null;
  chatMessages: ChatMessage[];
  isSupportChatOpen: boolean;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  routeInfo: RouteInfo | null;
  driverLocation: Location | null;
  counterOfferValue: number | null;
}

interface RideActions {
  setStatus: (status: RideStatus) => void;
  setActiveRide: (ride: Ride | null) => void;
  setAssignedDriver: (driver: Driver | null) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setPickupLocation: (location: Location | null) => void;
  setDropoffLocation: (location: Location | null) => void;
  setRouteInfo: (info: RouteInfo | null) => void;
  setDriverLocation: (location: Location | null) => void;
  setCounterOffer: (value: number | null) => void;
  toggleSupportChat: () => void;
  startNegotiation: () => void;
  assignDriver: (driver: Driver) => void;
  completeRideForRating: (driver: Driver) => void;
  resetRide: () => void;
}

const initialState: RideState = {
  status: 'idle',
  activeRide: null,
  assignedDriver: null,
  chatMessages: [],
  isSupportChatOpen: false,
  pickupLocation: null,
  dropoffLocation: null,
  routeInfo: null,
  driverLocation: null,
  counterOfferValue: null,
};

export const useRideStore = create<RideState & RideActions>((set, get) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setActiveRide: (ride) => set({ activeRide: ride }),
  setAssignedDriver: (driver) => set({ assignedDriver: driver }),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  setPickupLocation: (location) => set({ pickupLocation: location }),
  setDropoffLocation: (location) => set({ dropoffLocation: location }),
  setDriverLocation: (location) => set({ driverLocation: location }),
  setCounterOffer: (value) => {
    set({ status: 'negotiating', counterOfferValue: value });
  },
  setRouteInfo: (info) => {
    set({ routeInfo: info, status: info ? 'calculated' : 'idle' });
  },

  toggleSupportChat: () => set((state) => ({ isSupportChatOpen: !state.isSupportChatOpen })),
  startNegotiation: () => set({ status: 'negotiating', counterOfferValue: null }),
  assignDriver: (driver) => set({ status: 'assigned', assignedDriver: driver }),
  completeRideForRating: (driver) => set({ status: 'rating', assignedDriver: driver }),
  
  resetRide: () => {
    // Keep pickup and dropoff locations for convenience
    const { pickupLocation, dropoffLocation } = get();
    set({ ...initialState, pickupLocation, dropoffLocation });
  },
}));
