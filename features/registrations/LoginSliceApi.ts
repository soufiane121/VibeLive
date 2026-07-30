import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../../src/Services/AuthBaseQuery';
import {setLocalData} from '../../src/Utils/LocalStorageHelper';
import {TokenManager, type TokenPair} from '../../src/Services/TokenManager';
import {USE_DUAL_TOKEN_AUTH} from '../../src/Config/AppConfig';

interface Props {
  email: string;
  password: string;
}

// Define a service using a base URL and expected endpoints
export const loginApi = createApi({
  reducerPath: 'loginApi',
  tagTypes: ['Login'],
  baseQuery: authBaseQuery,
  endpoints: builder => ({
    login: builder.mutation({
      query: (body: Props) => ({
        url: 'users/login',
        body,
        method: 'POST',
      }),
    }),
    autoLogin: builder.mutation({
      query: body => ({
        url: 'users/auto-login',
        credentials: 'include',
        body,
        method: 'POST',
      }),
      transformResponse: async (response: any) => {
        if (response?.data?.email) {
          await setLocalData({key: 'isAuthenticated', value: 'true'});
          await setLocalData({key: 'token', value: response?.data?.email});
          if (USE_DUAL_TOKEN_AUTH && response.data.tokenPair) {
            await TokenManager.setTokens(response.data.tokenPair as TokenPair);
          }
        }
        return response;
      },
    }),
    signUp: builder.mutation({
      query: body => ({
        url: 'users/sign-up',
        body,
        method: 'POST',
      }),
      transformResponse: async (response: any) => {
        if (response?.data?.email) {
          await setLocalData({key: 'isAuthenticated', value: 'true'});
          await setLocalData({key: 'token', value: response?.data?.email});
          if (USE_DUAL_TOKEN_AUTH && response.data.tokenPair) {
            await TokenManager.setTokens(response.data.tokenPair as TokenPair);
          }
        }
        return response;
      },
    }),
    validateFields: builder.mutation({
      query: validationData => ({
        url: 'users/validate-fields',
        method: 'POST',
        body: validationData,
      }),
      transformErrorResponse: (response: any) => {
        return response.data || response;
      },
    }),
    singOut: builder.mutation({
      query: body => ({
        url: 'users/sign-out',
        method: 'POST',
        credentials: 'include',
        body,
      }),
    }),
    boostStream: builder.mutation({
      query: body => ({
        url: 'users/boost-stream',
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body,
      }),
    }),
    sendVerificationCode: builder.mutation({
      query: (body: {email: string}) => ({
        url: 'users/send-verification-code',
        method: 'POST',
        body,
      }),
    }),
    verifyEmailCode: builder.mutation({
      query: (body: {email: string; code: string}) => ({
        url: 'users/verify-code',
        method: 'POST',
        body,
      }),
    }),
    appleAuth: builder.mutation({
      query: (body: {
        identityToken: string | null;
        user: string;
        email: string | null;
        fullName: {givenName: string | null; familyName: string | null} | null;
        phone: string | null;
      }) => ({
        url: 'users/apple-auth',
        method: 'POST',
        body,
      }),
      transformResponse: async (response: any) => {
        if (response?.data?.email) {
          await setLocalData({key: 'isAuthenticated', value: 'true'});
          await setLocalData({key: 'token', value: response.data.email});
          if (USE_DUAL_TOKEN_AUTH && response.data.tokenPair) {
            await TokenManager.setTokens(response.data.tokenPair as TokenPair);
          }
        }
        return response;
      },
    }),
    refreshToken: builder.mutation<TokenPair, {refreshToken: string}>({
      query: body => ({
        url: 'users/token/refresh',
        method: 'POST',
        body,
      }),
    }),
    updateLocation: builder.mutation<void, {coordinates: [number, number]}>({
      query: body => ({
        url: 'users/location',
        method: 'PATCH',
        body,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {useLoginMutation, useAutoLoginMutation, useSignUpMutation, useSingOutMutation, useBoostStreamMutation, useValidateFieldsMutation, useSendVerificationCodeMutation, useVerifyEmailCodeMutation, useAppleAuthMutation} = loginApi;
