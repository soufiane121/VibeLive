import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {getLocalData} from '../../src/Utils/LocalStorageHelper';
import {baseUrl} from '../../baseUrl';

export interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  source?: string;
  externalId?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  };
  eventType: string;
  ticketing: {
    isFree: boolean;
    price: number;
    ticketLink?: string;
    currency: string;
  };
  banner?: {
    url: string;
    publicId: string;
  };
  creator: {
    _id: string;
    username: string;
    displayName: string;
    profilePicture?: string;
  };
  promotionStatus: 'normal' | 'map' | 'top' | 'both';
  promotionExpiry?: string;
  rsvps: Array<{
    user: {
      _id: string;
      username: string;
      displayName: string;
      profilePicture?: string;
    };
    status: 'interested' | 'going';
    rsvpDate: string;
  }>;
  rsvpCount: number;
  isActive: boolean;
  tags: string[];
  capacity?: number;
  attendeeCount: number;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  isUpcoming?: boolean;
  isLive?: boolean;
  isPromotionActive?: boolean;
  userRSVPStatus?: 'interested' | 'going' | null;
  hasUserRSVP?: boolean;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  eventType: string;
  ticketing?: {
    isFree: boolean;
    price: number;
    ticketLink?: string;
    currency?: string;
  };
  banner?: {
    url: string;
    publicId: string;
  };
  tags?: string[];
  capacity?: number;
}

export interface EventsResponse {
  success: boolean;
  data: Event[];
  count: number;
}

export interface EventResponse {
  success: boolean;
  data: Event;
  message?: string;
}

export interface RSVPRequest {
  status: 'interested' | 'going';
}

export interface PromoteEventRequest {
  promotionType: 'map' | 'top' | 'both';
  duration?: number; // days
}

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/events`,
    prepareHeaders: async headers => {
      const token = await getLocalData({key: 'token'});
      if (token) {
        headers.set('Authorization', `${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Event', 'UserEvents', 'UserRSVPs'],
  endpoints: builder => ({
    // Get upcoming events
    getUpcomingEvents: builder.query<
      EventsResponse,
      {
        days?: number;
        limit?: number;
        eventType?: string;
        coordinates?: string;
        radius?: number;
        useDB?: boolean;
      }
    >({
      query: params => ({
        url: '/upcoming',
        params,
      }),
      providesTags: ['Event'],
    }),

    // Get events for map (promoted events)
    getMapEvents: builder.query<
      EventsResponse,
      {
        coordinates?: string;
        useDB?: boolean;
      }
    >({
      query: params => ({
        url: '/map',
        params,
      }),
      providesTags: ['Event'],
    }),

    // Get single event by ID
    getEventById: builder.query<EventResponse, string>({
      query: eventId => `/${eventId}`,
      providesTags: (result, error, eventId) => [{type: 'Event', id: eventId}],
    }),

    // Create new event
    createEvent: builder.mutation<EventResponse, CreateEventRequest>({
      query: eventData => ({
        url: '/',
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: ['Event', 'UserEvents'],
    }),

    // Update event
    updateEvent: builder.mutation<
      EventResponse,
      {eventId: string; eventData: Partial<CreateEventRequest>}
    >({
      query: ({eventId, eventData}) => ({
        url: `/${eventId}`,
        method: 'PUT',
        body: eventData,
      }),
      invalidatesTags: (result, error, {eventId}) => [
        {type: 'Event', id: eventId},
        'Event',
        'UserEvents',
      ],
    }),

    // Delete event
    deleteEvent: builder.mutation<{success: boolean; message: string}, string>({
      query: eventId => ({
        url: `/${eventId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event', 'UserEvents'],
    }),

    // RSVP to event
    rsvpEvent: builder.mutation<
      EventResponse,
      {eventId: string; status: 'interested' | 'going'}
    >({
      query: ({eventId, status}) => ({
        url: `/${eventId}/rsvp`,
        method: 'POST',
        body: {status},
      }),
      invalidatesTags: (result, error, {eventId}) => [
        {type: 'Event', id: eventId},
        'Event',
        'UserRSVPs',
      ],
    }),

    // Remove RSVP
    removeRSVP: builder.mutation<EventResponse, string>({
      query: eventId => ({
        url: `/${eventId}/rsvp`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, eventId) => [
        {type: 'Event', id: eventId},
        'Event',
        'UserRSVPs',
      ],
    }),

    // Promote event
    promoteEvent: builder.mutation<
      EventResponse,
      {eventId: string; promotionData: PromoteEventRequest}
    >({
      query: ({eventId, promotionData}) => ({
        url: `/${eventId}/promote`,
        method: 'POST',
        body: promotionData,
      }),
      invalidatesTags: (result, error, {eventId}) => [
        {type: 'Event', id: eventId},
        'Event',
        'UserEvents',
      ],
    }),

    // Get user's events
    getUserEvents: builder.query<
      EventsResponse,
      {status?: 'upcoming' | 'past' | 'all'}
    >({
      query: params => ({
        url: '/user/my-events',
        params,
      }),
      providesTags: ['UserEvents'],
    }),

    // Get user's RSVP'd events
    getUserRSVPs: builder.query<EventsResponse, void>({
      query: () => '/user/my-rsvps',
      providesTags: ['UserRSVPs'],
    }),
  }),
});

export const {
  useGetUpcomingEventsQuery,
  useLazyGetUpcomingEventsQuery,
  useGetMapEventsQuery,
  useLazyGetMapEventsQuery,
  useGetEventByIdQuery,
  useLazyGetEventByIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useRsvpEventMutation,
  useRemoveRSVPMutation,
  usePromoteEventMutation,
  useGetUserEventsQuery,
  useLazyGetUserEventsQuery,
  useGetUserRSVPsQuery,
  useLazyGetUserRSVPsQuery,
} = eventsApi;
