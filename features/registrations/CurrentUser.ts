// import { CurrentUser } from './CurrentUser';
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

export type CurrentUserTypes = {
    location: {
      type: string;
      coordinates: number[];
    };
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    password: string;
    createdAt: string;
    // Enhanced settings fields
    profilePicture?: string;
    bio?: string;
    followers?: string[];
    following?: string[];
    highlights?: any[];
    // Notification preferences
    notificationSettings?: {
      pushNotifications: boolean;
      emailNotifications: boolean;
      liveStreamAlerts: boolean;
      followNotifications: boolean;
      commentNotifications: boolean;
    };
    // Privacy settings
    privacySettings?: {
      profileVisibility: 'public' | 'private' | 'friends';
      locationSharing: boolean;
      showOnlineStatus: boolean;
      allowDirectMessages: boolean;
    };
    // Streaming preferences
    streamingPreferences?: {
      defaultCategory: string;
      autoRecord: boolean;
      chatModeration: 'open' | 'followers' | 'disabled';
      qualityPreference: 'auto' | 'high' | 'medium' | 'low';
    };
    // Account settings
    accountSettings?: {
      twoFactorEnabled: boolean;
      emailVerified: boolean;
      phoneVerified: boolean;
      dataDownloadRequested?: string; // ISO date string
    };
    // Venue operator status (populated at login/auto-login)
    operatorVenue?: {
      _id: string;
      name: string;
      address: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      };
      location: {
        coordinates: [number, number];
      };
    } | null;
};

interface CurrentUserInterface {
  currentUser: CurrentUserTypes;
}

const initialState: CurrentUserInterface = {
  currentUser: {
    location: {
      type: 'Point',
      coordinates: [],
    },
    _id:"",
    firstName: '',
    lastName: '',
    email: "",userName: '',
    password: '',
    createdAt: '',
  },
};

export const CurrentUser = createSlice({
  name: 'currentUser',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<CurrentUserTypes>) => {
       state.currentUser = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {setCurrentUser} = CurrentUser.actions;

export default CurrentUser.reducer;
