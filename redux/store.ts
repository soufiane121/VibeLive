import {CurrentUser} from './../features/registrations/CurrentUser';
import {configureStore} from '@reduxjs/toolkit';
import {loginSlice} from '../features/registrations/LoginSlice';
import {loginApi} from '../features/registrations/LoginSliceApi';
import {liveStream} from '../features/LiveStream/LiveStream';

export const store = configureStore({
  reducer: {
    currentUser: CurrentUser.reducer,
    // login: loginSlice,
    [loginApi.reducerPath]: loginApi.reducer,
    [liveStream.reducerPath]: liveStream.reducer,
  },
  // adding the api middleware enables caching, invalidation, polling and other features of `rtk-query`
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat([loginApi.middleware, liveStream.middleware]),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
