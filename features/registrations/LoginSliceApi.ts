import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {baseUrl} from '../../baseUrl';
import {getLocalData, setLocalData} from '../../src/Utils/LocalStorageHelper';

interface Props {
  email: string;
  password: string;
}

// Define a service using a base URL and expected endpoints
export const loginApi = createApi({
  reducerPath: 'loginApi',
  tagTypes: ['Login'],
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl,
    prepareHeaders: async header => {
      const token = await getLocalData({key: 'token'});
      if (token) {
        header.set(
          'Authorization',
          `${token}`,
        );
      }
      return header;
    },
  }),
  endpoints: builder => ({
    login: builder.mutation({
      query: (body: Props) => ({
        url: 'users/login',
        body,
        method: 'POST',
      }),
    }),
    autoLogin: builder.mutation({
      query: (body) => ({
        url: 'users/auto-login',
        credentials: 'include',
        body,
        method: "POST"
      }),
      transformResponse: async response => {
        if (response?.data?.email) {
          await setLocalData({key: 'isAuthenticated', value: 'true'});
          await setLocalData({key: "token", value: response?.data?.email})
        }
        return response;
      },
    }),
    signUp: builder.mutation({
      query: (body) => ({
        url: 'users/sign-up',
        body,
        method: "POST"
      }),
      transformResponse: async response => {
        if (response?.data?.email) {
          await setLocalData({key: 'isAuthenticated', value: 'true'});
          await setLocalData({key: "token", value: response?.data?.email})
        }
        return response;
      },
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {useLoginMutation, useAutoLoginMutation, useSignUpMutation} = loginApi;
