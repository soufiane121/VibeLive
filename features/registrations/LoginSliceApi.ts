import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {baseUrl} from '../../baseUrl';

interface Props {
  email: string;
  password: string;
}
// Define a service using a base URL and expected endpoints
export const loginApi = createApi({
  reducerPath: 'loginApi',
  tagTypes: ['Login'],
  baseQuery: fetchBaseQuery({baseUrl: baseUrl}),
  endpoints: builder => ({
    login: builder.mutation({
      query: (body: Props) => ({
        url: 'users/login',
        body,
        method: 'POST',
        credentials: 'include',
      }),
    }),
}),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {useLoginMutation} = loginApi;
