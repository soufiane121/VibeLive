import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../../src/Utils/LocalStorageHelper';

// ── Types ───────────────────────────────────────────────────────────────────

export interface SquadArea {
  city?: string;
  neighborhood?: string;
  lat: number;
  lng: number;
  radius_km?: number;
}

export interface SquadMember {
  member_id: string;
  display_name: string;
  has_app: boolean;
  venue_type_tags: string[];
  timing_preference: string;
  joined_at: string;
  // V2
  is_default_profile?: boolean;
  join_reminder_sent?: boolean;
}

export interface VenueRecommendation {
  venue_id: string;
  venue_name: string;
  match_score: number;
  match_reasons: string[];
  current_status: {
    busyness_score?: number;
    vibe_score?: number;
    vibeshift_state?: string;
  };
  estimated_capacity_pct: number;
  distance_from_center: number | null;
  attraction_window_min: number | null;
  // V2: Data quality signals
  vibeshift_available?: boolean;
  vibeshift_confidence?: number | null;
  data_quality_label?: 'strong' | 'limited' | 'preference_only';
  data_quality_message?: string | null;
  // NEW: Venue tags and metadata
  // TODO:: it not be needed 
  venue_tags?: string[];
  category?: string;
  rating?: number;
  price_level?: number;
  address?: string;
}

export interface SquadRecommendation {
  recommendation_id: string;
  squad_id: string;
  round: number;
  generated_at: string;
  primary: VenueRecommendation;
  alternatives: VenueRecommendation[];
  status: 'pending' | 'vetoed' | 'confirmed' | 'expired';
}

export interface ConfirmedVenue {
  venue_id: string;
  venue_name: string;
  lat: number | null;
  lng: number | null;
  confirmed_at: string;
}

export interface SquadState {
  squad_id: string;
  squad_code: string;
  status: 'forming' | 'active' | 'confirmed' | 'expired' | 'cancelled';
  area: SquadArea;
  creator_display_name: string;
  member_count: number;
  members: SquadMember[];
  confirmed_venue: ConfirmedVenue | null;
  current_recommendation: SquadRecommendation | null;
  expires_at: string;
  created_at: string;
}

export interface CreateSquadResponse {
  squad_id: string;
  squad_code: string;
  invite_link: string;
  web_join_url: string;
  expires_at: string;
  status: string;
  guest_token: string;
  member_id: string;
}

export interface JoinSquadResponse {
  member_id: string;
  guest_token: string;
  squad_id: string;
  squad_code: string;
  current_member_count: number;
  creator_display_name: string;
  websocket_url: string;
  current_recommendation: SquadRecommendation | null;
}

export interface InviteMetadata {
  squad_code: string;
  creator_name: string;
  member_count: number;
  area: {city?: string; neighborhood?: string};
  status: string;
  is_active: boolean;
}

export interface VetoResponse {
  status: 'resolved' | 'creator_final_say';
  message?: string;
  new_recommendation?: SquadRecommendation;
  options?: VenueRecommendation[];
}

// ── API ─────────────────────────────────────────────────────────────────────

export const squadApi = createApi({
  reducerPath: 'squadApi',
  tagTypes: ['Squad', 'SquadInvite'],
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
    // Create a new squad (auth required)
    createSquad: builder.mutation<CreateSquadResponse, {area: SquadArea}>({
      query: body => ({
        url: 'api/squads',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Squad'],
    }),

    // Get squad state
    getSquad: builder.query<SquadState, string>({
      query: squadCode => ({
        url: `api/squads/${squadCode}`,
      }),
      providesTags: (_result, _error, code) => [{type: 'Squad', id: code}],
    }),

    // Join a squad (no auth required for guests)
    joinSquad: builder.mutation<
      JoinSquadResponse,
      {
        squad_code: string;
        display_name: string;
        venue_type_tags: string[];
        timing_preference?: string;
        location?: {lat: number; lng: number};
        conviction?: 'important_to_me' | 'flexible' | null;
      }
    >({
      query: ({squad_code, ...body}) => ({
        url: `api/squads/${squad_code}/join`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: 'Squad', id: arg.squad_code},
      ],
    }),

    // Trigger recommendation (creator only)
    triggerRecommendation: builder.mutation<
      {recommendation: SquadRecommendation},
      string
    >({
      query: squadCode => ({
        url: `api/squads/${squadCode}/recommend`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, code) => [{type: 'Squad', id: code}],
    }),

    // Cast a veto
    castVeto: builder.mutation<
      VetoResponse,
      {squad_code: string; reason: string; guest_token?: string}
    >({
      query: ({squad_code, ...body}) => ({
        url: `api/squads/${squad_code}/veto`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: 'Squad', id: arg.squad_code},
      ],
    }),

    // Confirm venue (creator only)
    confirmVenue: builder.mutation<
      {status: string; venue: ConfirmedVenue},
      {squad_code: string; venue_id?: string}
    >({
      query: ({squad_code, ...body}) => ({
        url: `api/squads/${squad_code}/confirm`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: 'Squad', id: arg.squad_code},
      ],
    }),

    // Cancel squad (creator only)
    cancelSquad: builder.mutation<{status: string; squad_code: string}, string>({
      query: squadCode => ({
        url: `api/squads/${squadCode}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, code) => [{type: 'Squad', id: code}],
    }),

    // Get invite metadata (for preview / deep link)
    getInviteMetadata: builder.query<InviteMetadata, string>({
      query: squadCode => ({
        url: `api/squads/${squadCode}/invite`,
      }),
      providesTags: (_result, _error, code) => [
        {type: 'SquadInvite', id: code},
      ],
    }),

    // Track conversion
    trackConversion: builder.mutation<
      {status: string; member_id: string},
      {squad_code: string; member_id: string}
    >({
      query: ({squad_code, ...body}) => ({
        url: `api/squads/${squad_code}/convert`,
        method: 'POST',
        body,
      }),
    }),

    // V2: Submit outcome feedback
    submitOutcome: builder.mutation<
      {status: string; rating: string},
      {squad_code: string; rating: 'positive' | 'negative'}
    >({
      query: ({squad_code, ...body}) => ({
        url: `api/squads/${squad_code}/outcome`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: 'Squad', id: arg.squad_code},
      ],
    }),
  }),
});

export const {
  useCreateSquadMutation,
  useGetSquadQuery,
  useJoinSquadMutation,
  useTriggerRecommendationMutation,
  useCastVetoMutation,
  useConfirmVenueMutation,
  useCancelSquadMutation,
  useGetInviteMetadataQuery,
  useTrackConversionMutation,
  useSubmitOutcomeMutation,
} = squadApi;
