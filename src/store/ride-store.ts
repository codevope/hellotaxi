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
  | 'requesting';

interface RideState {
  status: RideStatus;
  activeRide: Ride | null;
  assignedDriver: Driver | null;
  chatMessages: ChatMessage[];
  isSupportChatOpen: boolean;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  routeInfo: RouteInfo | null;
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

  // Complex Actions
  toggleSupportChat: () => void;
  startSearch: () => void;
  startNegotiation: () => void;
  assignDriver: (driver: Driver) => void;
  updateRideStatus: (newStatus: 'assigned') => void;
  completeRide: () => void;
  completeRideForRating: (driver: Driver) => void;
  startRequesting: () => void;
  resetRide: () => void;

  // Driver actions
  setDriverAsOnRide: () => void;
  setDriverAsAvailable: () => void;
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
  setRouteInfo: (info) => {
    set({ routeInfo: info, status: info ? 'calculated' : 'idle' });
  },

  // Complex Actions
  toggleSupportChat: () => set((state) => ({ isSupportChatOpen: !state.isSupportChatOpen })),
  startSearch: () => set({ status: 'searching' }),
  startNegotiation: () => set({ status: 'negotiating' }),
  assignDriver: (driver) => set({ status: 'assigned', assignedDriver: driver }),
  updateRideStatus: (newStatus) => set({ status: newStatus }),
  completeRide: () => set({ status: 'rating' }),
  completeRideForRating: (driver) => set({ status: 'rating', assignedDriver: driver }),
  startRequesting: () => set({ status: 'requesting' }),
  resetRide: () => set({ ...initialState }),

  // Driver actions
  setDriverAsOnRide: () => set({ status: 'in-progress' }),
  setDriverAsAvailable: () => set({ status: 'idle' }),
}));
