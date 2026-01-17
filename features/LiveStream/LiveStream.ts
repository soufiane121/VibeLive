import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {baseUrl} from '../../baseUrl';
import {getLocalData, setLocalData} from '../../src/Utils/LocalStorageHelper';

interface Props {
  email: string;
  password: string;
}

// Define a service using a base URL and expected endpoints
export const liveStream = createApi({
  reducerPath: 'liveStream',
  tagTypes: ['LiveStream'],
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl,
    prepareHeaders: async header => {
      let token = await getLocalData({key: 'token'});
      if (token) {
        header.set('Authorization', `${token}`);
      }
      return header;
    },
  }),
  endpoints: builder => ({
    startStreaming: builder.mutation({
      query: body => ({
        url: '/users/start-streaming',
        method: 'POST',
        body,
      }),
    }),
    addFollow: builder.mutation({
      query: body => ({
        url: 'users/add-follow',
        method: 'POST',
        body,
      }),
    }),
    removeFollow: builder.mutation({
      query: body => ({
        url: 'users/remove-follow',
        method: 'POST', 
        body,
      }),
    }),
    getAllMapPoints: builder.mutation({
      query: body => ({
        url: 'users/getAllPoints',
        method: 'POST',
        body,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {useStartStreamingMutation, useGetAllMapPointsMutation, useAddFollowMutation, useRemoveFollowMutation} = liveStream;
