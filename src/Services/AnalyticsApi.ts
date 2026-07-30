import { createApi } from '@reduxjs/toolkit/query/react';
import { authBaseQuery } from './AuthBaseQuery';

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
  baseQuery: authBaseQuery,
  endpoints: (builder) => ({
    // Track session start
    trackSessionStart: builder.mutation<void, SessionStartRequest>({
      query: (sessionData) => ({
        url: '/analytics/track-session-start',
        method: 'POST',
        body: sessionData,
      }),
    }),

    // Track session end
    trackSessionEnd: builder.mutation<void, SessionEndRequest>({
      query: (sessionData) => ({
        url: '/analytics/track-session-end',
        method: 'POST',
        body: sessionData,
      }),
    }),

    // Track single event
    trackEvent: builder.mutation<void, AnalyticsEvent>({
      query: (eventData) => ({
        url: '/analytics/track-event',
        method: 'POST',
        body: eventData,
      }),
    }),

    // Track batch events
    trackEventsBatch: builder.mutation<void, BatchEventsRequest>({
      query: (batchData) => ({
        url: '/analytics/track-events-batch',
        method: 'POST',
        body: batchData,
      }),
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
