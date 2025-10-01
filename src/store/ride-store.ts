
import { create } from 'zustand';
import type { Ride, Driver, DriverWithVehicleInfo, ChatMessage, Location } from '@/lib/types';
import type { RouteInfo } from '@/hooks/use-eta-calculator';

export type RideStoreStatus =
  | 'idle' // The form is ready to be filled.
  | 'calculating' // Calculating the route and initial fare.
  | 'calculated' // Calculation is done, showing ETA and fare.
  | 'confirmed' // User confirmed the ride, showing trip details before searching.
  | 'searching' // Searching for a driver after ride is created.
  | 'counter-offered' // Driver sent a counter-offer.
  | 'assigned' // Driver has been found and is on the way or with the passenger.
  | 'rating'; // Ride is complete, waiting for user to rate the driver.

interface RideState {
  status: RideStoreStatus;
  activeRide: Ride | null;
  assignedDriver: DriverWithVehicleInfo | null;
  chatMessages: ChatMessage[];
  isSupportChatOpen: boolean;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  routeInfo: RouteInfo | null;
  driverLocation: Location | null;
  counterOfferValue: number | null;
}

interface RideActions {
  setStatus: (status: RideStoreStatus) => void;
  setActiveRide: (ride: Ride | null) => void;
  setAssignedDriver: (driver: DriverWithVehicleInfo | null) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setPickupLocation: (location: Location | null) => void;
  setDropoffLocation: (location: Location | null) => void;
  setRouteInfo: (info: RouteInfo | null) => void;
  setDriverLocation: (location: Location | null) => void;
  setCounterOffer: (value: number | null) => void;
  toggleSupportChat: () => void;
  assignDriver: (driver: DriverWithVehicleInfo) => void;
  completeRideForRating: (driver: DriverWithVehicleInfo) => void;
  resetRide: () => void;
  resetAll: () => void;
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
    console.log('💰 Setting counter offer:', value);
    if (value !== null) {
      set({ status: 'counter-offered', counterOfferValue: value });
    } else {
      // If clearing counter offer, check if we should go back to a different state
      const currentState = get();
      if (currentState.activeRide) {
        const newStatus = currentState.activeRide.status === 'searching' ? 'searching' : 'assigned';
        set({ counterOfferValue: null, status: newStatus });
      } else {
        set({ counterOfferValue: null, status: 'idle' });
      }
    }
  },
  setRouteInfo: (info) => {
    console.log('📍 Setting route info:', !!info);
    const currentState = get();
    // Only change status to calculated/idle if not in a more advanced state
    if (!['searching', 'assigned', 'rating', 'counter-offered'].includes(currentState.status)) {
      set({ routeInfo: info, status: info ? 'calculated' : 'idle' });
    } else {
      set({ routeInfo: info });
    }
  },

  toggleSupportChat: () => set((state) => ({ isSupportChatOpen: !state.isSupportChatOpen })),
  // Remove startNegotiation - no longer needed
  assignDriver: (driver) => set({ status: 'assigned', assignedDriver: driver }),
  completeRideForRating: (driver) => set({ status: 'rating', assignedDriver: driver }),
  
  resetRide: () => {
    console.log('🔄 Resetting ride state');
    // Keep pickup and dropoff locations for convenience
    const { pickupLocation, dropoffLocation } = get();
    set({ ...initialState, pickupLocation, dropoffLocation });
  },
  
  resetAll: () => {
    console.log('🔄 Resetting all ride state including locations');
    set(initialState);
  },
}));
