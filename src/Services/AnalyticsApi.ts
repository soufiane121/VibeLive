import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../../baseUrl';
import { getLocalData } from '../Utils/LocalStorageHelper';

// Analytics Event Interface
interface AnalyticsEvent {
  eventType: string;
  eventCategory: string;
  eventData: Record<string, any>;
  timestamp: string;
}

// Device Info Interface
interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  screenSize: string;
  networkType: string;
  deviceId: string;
}

// Session Start Request
interface SessionStartRequest {
  sessionId: string;
  deviceInfo: DeviceInfo;
  coordinates?: [number, number];
}

// Session End Request
interface SessionEndRequest {
  sessionId: string;
  sessionDuration: number;
  totalWatchTime: number;
  streamsWatched: number;
}

// Batch Events Request
interface BatchEventsRequest {
  events: AnalyticsEvent[];
  sessionId: string;
  deviceInfo: DeviceInfo;
}

// Define analytics API using RTK Query
export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  tagTypes: ['Analytics'],
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl,
    prepareHeaders: async (headers) => {
      const token = await getLocalData({ key: 'token' });
      if (token) {
        headers.set('Authorization', `${token}`);
      }
      // Add ngrok header to bypass browser warning
      headers.set('ngrok-skip-browser-warning', 'true');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Track session start
    trackSessionStart: builder.mutation<void, SessionStartRequest>({
      query: (sessionData) => ({
        url: '/analytics/track-session-start',
        method: 'POST',
        body: sessionData,
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Track session end
    trackSessionEnd: builder.mutation<void, SessionEndRequest>({
      query: (sessionData) => ({
        url: '/analytics/track-session-end',
        method: 'POST',
        body: sessionData,
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Track single event
    trackEvent: builder.mutation<void, AnalyticsEvent>({
      query: (eventData) => ({
        url: '/analytics/track-event',
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Track batch events
    trackEventsBatch: builder.mutation<void, BatchEventsRequest>({
      query: (batchData) => ({
        url: '/analytics/track-events-batch',
        method: 'POST',
        body: batchData,
      }),
      invalidatesTags: ['Analytics'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useTrackSessionStartMutation,
  useTrackSessionEndMutation,
  useTrackEventMutation,
  useTrackEventsBatchMutation,
} = analyticsApi;

// Export the reducer
export default analyticsApi;
