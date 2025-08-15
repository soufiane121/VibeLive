import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../../baseUrl';

// Ad Data Interface
export interface AdData {
  _id?: string;
  adType: 'map_marker' | 'story_carousel';
  mediaType: 'image' | 'video';
  mediaUrl: string;
  eventTitle: string;
  eventDescription: string;
  targeting: {
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
    radius: number;
    interestTags: string[];
  };
  dailyBudget: number;
  duration: number;
  primeTimeBoost: boolean;
  totalBudget?: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Ad Reach Estimate Interface
interface AdReachEstimate {
  dailyReach: number;
  totalReach: number;
  userDensity: number;
  cpm: number;
  estimatedCost: number;
}

// Ad Payment Interface
interface AdPayment {
  amount: number;
  currency: string;
  paymentMethodId: string;
  adId?: string;
}

// Define ads API using RTK Query
export const adsApi = createApi({
  reducerPath: 'adsApi',
  tagTypes: ['Ads'],
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/ads`,
    prepareHeaders: (headers) => {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Estimate ad reach
    estimateAdReach: builder.mutation<AdReachEstimate, Partial<AdData>>({
      query: (adData) => ({
        url: '/estimate-reach',
        method: 'POST',
        body: adData,
      }),
    }),
    
    // Create new ad
    createAd: builder.mutation<AdData, Partial<AdData>>({
      query: (adData) => ({
        url: '/create',
        method: 'POST',
        body: adData,
      }),
      invalidatesTags: ['Ads'],
    }),
    
    // Get user's ads
    getUserAds: builder.query<AdData[], void>({
      query: () => '/user-ads',
      providesTags: ['Ads'],
    }),
    
    // Pause an ad
    pauseAd: builder.mutation<AdData, string>({
      query: (adId) => ({
        url: `/pause/${adId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Ads'],
    }),
    
    // Resume an ad
    resumeAd: builder.mutation<AdData, string>({
      query: (adId) => ({
        url: `/resume/${adId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Ads'],
    }),
    
    // Update ad analytics
    updateAdAnalytics: builder.mutation<AdData, { adId: string; impressions?: number; clicks?: number; conversions?: number }>({
      query: ({ adId, ...analyticsData }) => ({
        url: `/update-analytics/${adId}`,
        method: 'PUT',
        body: analyticsData,
      }),
      invalidatesTags: ['Ads'],
    }),
    
    // Process ad payment
    processAdPayment: builder.mutation<any, AdPayment>({
      query: (paymentData) => ({
        url: '/process-payment',
        method: 'POST',
        body: paymentData,
      }),
    }),
    
    // Validate ad payment
    validateAdPayment: builder.mutation<any, { paymentIntentId: string }>({
      query: (validationData) => ({
        url: '/validate-payment',
        method: 'POST',
        body: validationData,
      }),
      invalidatesTags: ['Ads'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useEstimateAdReachMutation,
  useCreateAdMutation,
  useGetUserAdsQuery,
  usePauseAdMutation,
  useResumeAdMutation,
  useUpdateAdAnalyticsMutation,
  useProcessAdPaymentMutation,
  useValidateAdPaymentMutation,
} = adsApi;
