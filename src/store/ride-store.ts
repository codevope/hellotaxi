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
  | 'rating'
  | 'requesting'
  | 'in-progress';

interface RideState {
  status: RideStatus;
  activeRide: Ride | null;
  assignedDriver: Driver | null;
  chatMessages: ChatMessage[];
  isSupportChatOpen: boolean;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  routeInfo: RouteInfo | null;
  driverLocation: Location | null; // <-- NEW
}

interface RideActions {
  // Setters
  setStatus: (status: RideStatus) => void;
  setActiveRide: (ride: Ride | null) => void;
  setAssignedDriver: (driver: Driver | null) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setPickupLocation: (location: Location | null) => void;
  setDropoffLocation: (location: Location | null) => void;
  setRouteInfo: (info: RouteInfo | null) => void;
  setDriverLocation: (location: Location | null) => void; // <-- NEW

  // Complex Actions
  toggleSupportChat: () => void;
  startSearch: () => void;
  startNegotiation: () => void;
  assignDriver: (driver: Driver) => void;
  updateRideStatus: (newStatus: RideStatus) => void;
  completeRideForRating: (driver: Driver) => void;
  startRequesting: () => void;
  resetRide: () => void;

  // Driver actions
  completeRide: () => void; // For driver to finish
  setDriverAsOnRide: () => void;
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
  driverLocation: null, // <-- NEW
};

export const useRideStore = create<RideState & RideActions>((set, get) => ({
  ...initialState,

  // Setters
  setStatus: (status) => set({ status }),
  setActiveRide: (ride) => set({ activeRide: ride }),
  setAssignedDriver: (driver) => set({ assignedDriver: driver }),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  setPickupLocation: (location) => set({ pickupLocation: location }),
  setDropoffLocation: (location) => set({ dropoffLocation: location }),
  setDriverLocation: (location) => set({ driverLocation: location }), // <-- NEW
  setRouteInfo: (info) => {
    set({ routeInfo: info, status: info ? 'calculated' : 'idle' });
  },

  // Complex Actions
  toggleSupportChat: () => set((state) => ({ isSupportChatOpen: !state.isSupportChatOpen })),
  startSearch: () => set({ status: 'searching' }),
  startNegotiation: () => set({ status: 'negotiating' }),
  assignDriver: (driver) => set({ status: 'assigned', assignedDriver: driver }),
  updateRideStatus: (newStatus) => set({ status: newStatus }),
  completeRideForRating: (driver) => set({ status: 'rating', assignedDriver: driver }),
  startRequesting: () => set({ status: 'requesting' }),
  resetRide: () => set({ ...initialState }),

  // Driver actions
  completeRide: () => set({ status: 'rating' }), // Driver action to put passenger in rating state
  setDriverAsOnRide: () => set({ status: 'in-progress' }),
}));
