import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../../src/Utils/LocalStorageHelper';

export interface VenueAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface BusinessHour {
  day: number;
  open: string;
  close: string;
}

export interface VenueData {
  id: string;
  name: string;
  category: string;
  vibeScore: number;
  hotVotes: number;
  deadVotes: number;
  totalVotes: number;
  coordinates: [number, number];
  isBoosted: boolean;
  boostMultiplier: number;
  lastVoteAt: string | null;
  distance?: number;
  // Venue detail fields
  address?: VenueAddress | null;
  phone?: string | null;
  website?: string | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  priceLevel?: number | null;
  venueDescription?: string | null;
  businessHours?: BusinessHour[];
  coverPhotoUrl?: string | null;
}

export interface VoteResult {
  success: boolean;
  action?: 'created' | 'updated';
  voteType?: string;
  voteId?: string;
  nightDate?: string;
  reason?: string;
  previousVote?: string;
  newVote?: string;
}

export interface VoteVelocity {
  rate: number;
  trend: 'stable' | 'heating_up' | 'cooling_down' | 'warm' | 'cool';
  count: number;
  hotCount: number;
  deadCount: number;
}

export interface VenueVibeData {
  venue: {
    id: string;
    name: string;
    category: string;
    currentVibeScore: number;
    hotVotes: number;
    deadVotes: number;
    totalVotesTonight: number;
    lastVoteAt: string | null;
    isBoosted: boolean;
  };
  recentVotes: Array<{type: string; at: string; source: string}>;
  velocity: VoteVelocity;
}

export interface VibeShiftData {
  id: string;
  from: {id: string; name: string; vibeScore: number};
  to: {id: string; name: string; vibeScore: number};
  shiftType: string;
  confidence: number;
  detectedAt: string;
}

export interface DashboardData {
  venue: {
    id: string;
    name: string;
    category: string;
    currentVibeScore: number;
    hotVotes: number;
    deadVotes: number;
    totalVotesTonight: number;
    lastVoteAt: string | null;
    promotionBoost: any;
    totalLifetimeVotes: number;
  };
  tonight: {
    votes: Array<{voteType: string; createdAt: string; source: string}>;
    velocity: VoteVelocity;
    hourlyBreakdown: Array<{_id: number; hot: number; dead: number; total: number}>;
  };
  weeklyStats: {
    totalVotes: number;
    history: Array<any>;
  };
  vibeShifts: Array<any>;
}

export interface VotingPreferences {
  enabled: boolean;
  notificationRadius: number;
  maxNotificationsPerNight: number;
  cooldownMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  permanentOptOut: boolean;
}

export interface OfflineVote {
  clientId: string;
  venueId: string;
  voteType: 'hot' | 'dead';
  queuedAt: string;
}

export const votingApi = createApi({
  reducerPath: 'votingApi',
  tagTypes: ['Venues', 'VenueDetail', 'Heatmap', 'Dashboard', 'Preferences', 'VibeShifts', 'Notifications'],
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl,
    prepareHeaders: async header => {
      const token = await getLocalData({key: 'token'});
      if (token) {
        header.set('Authorization', `${token}`);
      }
      header.set('ngrok-skip-browser-warning', 'true');
      return header;
    },
  }),
  endpoints: builder => ({
    // Vote endpoints
    castVote: builder.mutation<VoteResult, {venueId: string; voteType: 'hot' | 'dead'; source?: string}>({
      query: body => ({
        url: 'voting/vote',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: 'VenueDetail', id: arg.venueId},
        'Heatmap',
        'Venues',
      ],
    }),

    voteFromNotification: builder.mutation<VoteResult, {venueId: string; voteType: 'hot' | 'dead'; notificationId?: string}>({
      query: body => ({
        url: 'voting/vote-from-notification',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Heatmap', 'Venues'],
    }),

    correctVenue: builder.mutation<VoteResult, {wrongVenueId: string; correctVenueId: string; voteType: 'hot' | 'dead'}>({
      query: body => ({
        url: 'voting/correct-venue',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Heatmap', 'Venues'],
    }),

    syncOfflineVotes: builder.mutation<{synced: number; failed: number; results: any[]}, {votes: OfflineVote[]}>({
      query: body => ({
        url: 'voting/sync-offline-votes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Heatmap', 'Venues'],
    }),

    // Location update
    sendLocationUpdate: builder.mutation<any, {latitude: number; longitude: number; accuracy?: number; timestamp?: number; batteryLevel?: number}>({
      query: body => ({
        url: 'voting/location-update',
        method: 'POST',
        body,
      }),
    }),

    // Venue endpoints
    getNearbyVenues: builder.query<{venues: VenueData[]; count: number}, {latitude: number; longitude: number; radius?: number}>({
      query: ({latitude, longitude, radius}) => ({
        url: `voting/venues/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius || 2}`,
      }),
      providesTags: ['Venues'],
    }),

    getVenueDetail: builder.query<VenueVibeData, string>({
      query: venueId => ({
        url: `voting/venues/${venueId}`,
      }),
      providesTags: (_result, _error, id) => [{type: 'VenueDetail', id}],
    }),

    getVenueHistory: builder.query<any, {venueId: string; days?: number}>({
      query: ({venueId, days}) => ({
        url: `voting/venues/${venueId}/history?days=${days || 30}`,
      }),
    }),

    // Heatmap
    getHeatmap: builder.query<{heatmap: VenueData[]; updatedAt: string}, {latitude: number; longitude: number; radius?: number}>({
      query: ({latitude, longitude, radius}) => ({
        url: `voting/heatmap?latitude=${latitude}&longitude=${longitude}&radius=${radius || 2}`,
      }),
      providesTags: ['Heatmap'],
    }),

    // Vibe shifts
    getVibeShifts: builder.query<{shifts: VibeShiftData[]; count: number}, void>({
      query: () => ({
        url: 'voting/vibe-shifts',
      }),
      providesTags: ['VibeShifts'],
    }),

    // Dashboard
    getVenueDashboard: builder.query<DashboardData, string>({
      query: venueId => ({
        url: `voting/dashboard/${venueId}`,
      }),
      providesTags: (_result, _error, id) => [{type: 'Dashboard', id}],
    }),

    purchaseVenueBoost: builder.mutation<any, {venueId: string; tier: string; durationHours: number; paymentId?: string}>({
      query: ({venueId, ...body}) => ({
        url: `voting/dashboard/${venueId}/purchase-boost`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [{type: 'Dashboard', id: arg.venueId}],
    }),

    claimVenue: builder.mutation<any, string>({
      query: venueId => ({
        url: `voting/dashboard/${venueId}/claim`,
        method: 'POST',
      }),
    }),

    // Preferences
    getVotingPreferences: builder.query<{preferences: VotingPreferences}, void>({
      query: () => ({
        url: 'voting/preferences',
      }),
      providesTags: ['Preferences'],
    }),

    updateVotingPreferences: builder.mutation<{success: boolean; preferences: VotingPreferences}, Partial<VotingPreferences>>({
      query: body => ({
        url: 'voting/preferences',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Preferences'],
    }),

    // FCM Token
    registerFcmToken: builder.mutation<{success: boolean}, {token: string}>({
      query: body => ({
        url: 'voting/fcm-token',
        method: 'POST',
        body,
      }),
    }),

    // Notification history
    getNotificationHistory: builder.query<any, {limit?: number}>({
      query: ({limit}) => ({
        url: `voting/notifications?limit=${limit || 20}`,
      }),
      providesTags: ['Notifications'],
    }),
  }),
});

export const {
  useCastVoteMutation,
  useVoteFromNotificationMutation,
  useCorrectVenueMutation,
  useSyncOfflineVotesMutation,
  useSendLocationUpdateMutation,
  useGetNearbyVenuesQuery,
  useGetVenueDetailQuery,
  useGetVenueHistoryQuery,
  useGetHeatmapQuery,
  useGetVibeShiftsQuery,
  useGetVenueDashboardQuery,
  usePurchaseVenueBoostMutation,
  useClaimVenueMutation,
  useGetVotingPreferencesQuery,
  useUpdateVotingPreferencesMutation,
  useRegisterFcmTokenMutation,
  useGetNotificationHistoryQuery,
} = votingApi;
