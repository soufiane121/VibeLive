import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../../src/Utils/LocalStorageHelper';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type ClaimStatus =
  | 'unclaimed'
  | 'pending_verification'
  | 'manual_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type VerificationPath =
  | 'google_business'
  | 'social_media'
  | 'business_license';

export type SubscriptionTier =
  | 'none'
  | 'analytics'
  | 'notifications'
  | 'premium';

export interface VenueSearchResult {
  _id: string;
  name: string;
  address?: {street?: string; city?: string; state?: string};
  category?: string;
  venueTypes?: string[];
  googlePlaceId?: string;
  claim?: {
    status: ClaimStatus;
    resubmissionCount?: number;
  };
  location?: {coordinates: number[]};
}

export interface ClaimSubmission {
  claimantName: string;
  claimantRole: string;
  claimantEmail: string;
  claimantPhone: string;
  path: VerificationPath;
  subscriptionTierSelected?: SubscriptionTier;
  // google_business
  googleBusinessUrl?: string;
  // social_media
  handle?: string;
  platform?: 'instagram' | 'tiktok';
  // business_license
  storageRef?: string;
  docType?: string;
}

export interface ClaimSubmitResponse {
  message: string;
  venue: {
    _id: string;
    name: string;
    claim: {
      status: ClaimStatus;
      path: VerificationPath;
      submittedAt: string;
      socialVerificationCode?: string;
      resubmissionCount: number;
    };
  };
}

export interface GoogleVerifyResponse {
  matched: boolean;
  claimStatus: ClaimStatus;
}

export interface SocialVerifyResponse {
  verified: boolean;
  maxAttemptsReached?: boolean;
  attemptsRemaining?: number;
  claimStatus: ClaimStatus;
}

export interface DocumentUploadResponse {
  message: string;
  claimStatus: ClaimStatus;
}

export interface ClaimStatusResponse {
  venue: {
    _id: string;
    name: string;
    address?: {street?: string; city?: string; state?: string};
    claim: {
      status: ClaimStatus;
      path: VerificationPath | null;
      submittedAt: string;
      rejectionReason?: string;
      resubmissionCount: number;
      trialStartedAt?: string;
      trialEndsAt?: string;
      subscriptionTierSelected?: string;
    };
  };
}

export interface NearbyVenue {
  _id: string;
  googlePlaceId?: string;
  name: string;
  venueTypes?: string[];
  squadVenueTypeTags?: string[];
  distance: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════════════════

export const venueClaimApi = createApi({
  reducerPath: 'venueClaimApi',
  tagTypes: ['ClaimStatus', 'VenueSearch', 'NearbyVenues'],
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
    // ── Search venues by name ────────────────────────────────────────
    searchVenues: builder.query<{venues: VenueSearchResult[]}, string>({
      query: (searchQuery: string) => ({
        url: `venue-claims/venues/search?q=${encodeURIComponent(searchQuery)}`,
        method: 'GET',
      }),
      providesTags: ['VenueSearch'],
    }),

    // ── Get claim status for a venue ─────────────────────────────────
    getClaimStatus: builder.query<ClaimStatusResponse, string>({
      query: (venueId: string) => ({
        url: `venue-claims/venues/${venueId}/claim-status`,
        method: 'GET',
      }),
      providesTags: (_result, _err, venueId) => [
        {type: 'ClaimStatus', id: venueId},
      ],
    }),

    // ── Submit a new claim ───────────────────────────────────────────
    submitClaim: builder.mutation<
      ClaimSubmitResponse,
      {venueId: string; body: ClaimSubmission}
    >({
      query: ({venueId, body}) => ({
        url: `venue-claims/venues/${venueId}/claim`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, {venueId}) => [
        {type: 'ClaimStatus', id: venueId},
        'VenueSearch',
      ],
    }),

    // ── Verify Google Business URL ───────────────────────────────────
    verifyGoogle: builder.mutation<
      GoogleVerifyResponse,
      {venueId: string; googleBusinessUrl: string}
    >({
      query: ({venueId, googleBusinessUrl}) => ({
        url: `venue-claims/venues/${venueId}/verify-google`,
        method: 'POST',
        body: {googleBusinessUrl},
      }),
      invalidatesTags: (_result, _err, {venueId}) => [
        {type: 'ClaimStatus', id: venueId},
      ],
    }),

    // ── Check social media bio verification ──────────────────────────
    verifySocial: builder.mutation<SocialVerifyResponse, string>({
      query: (venueId: string) => ({
        url: `venue-claims/venues/${venueId}/verify-social`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _err, venueId) => [
        {type: 'ClaimStatus', id: venueId},
      ],
    }),

    // ── Upload business license document ─────────────────────────────
    uploadDocument: builder.mutation<
      DocumentUploadResponse,
      {venueId: string; storageRef: string; docType: string}
    >({
      query: ({venueId, storageRef, docType}) => ({
        url: `venue-claims/venues/${venueId}/upload-document`,
        method: 'POST',
        body: {storageRef, docType},
      }),
      invalidatesTags: (_result, _err, {venueId}) => [
        {type: 'ClaimStatus', id: venueId},
      ],
    }),

    // ── Get nearby onboarded venues (for stream tagging) ─────────────
    getNearbyOnboardedVenues: builder.query<
      {venues: NearbyVenue[]},
      {lat: number; lng: number}
    >({
      query: ({lat, lng}) => ({
        url: `venue-claims/venues/nearby-onboarded?lat=${lat}&lng=${lng}`,
        method: 'GET',
      }),
      providesTags: ['NearbyVenues'],
    }),
  }),
});

export const {
  useSearchVenuesQuery,
  useLazySearchVenuesQuery,
  useGetClaimStatusQuery,
  useSubmitClaimMutation,
  useVerifyGoogleMutation,
  useVerifySocialMutation,
  useUploadDocumentMutation,
  useGetNearbyOnboardedVenuesQuery,
  useLazyGetNearbyOnboardedVenuesQuery,
} = venueClaimApi;
