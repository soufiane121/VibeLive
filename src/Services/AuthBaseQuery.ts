import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import {baseUrl} from '../../baseUrl';
import {TokenManager} from './TokenManager';
import {USE_DUAL_TOKEN_AUTH} from '../Config/AppConfig';
import {getLocalData} from '../Utils/LocalStorageHelper';

// ═══════════════════════════════════════════════════════════════════════════
// AuthBaseQuery — Centralized RTK Query base query with 401 interceptor
// ═══════════════════════════════════════════════════════════════════════════
// Replaces per-slice prepareHeaders. Provides:
// 1. Automatic access token injection
// 2. Proactive token refresh before expiry
// 3. 401 retry: on unauthorized response, refreshes token and retries once
// 4. Backward-compatible: honors USE_DUAL_TOKEN_AUTH flag

const createPrepareHeaders = () => async (headers: Headers) => {
  let token: string | null = null;

  if (USE_DUAL_TOKEN_AUTH) {
    token = await TokenManager.getValidAccessToken();
  } else {
    token = (await getLocalData({key: 'token'})) as string | null;
  }

  if (token) {
    headers.set('Authorization', `${token}`);
  }

  headers.set('ngrok-skip-browser-warning', 'true');

  return headers;
};

export function createAuthBaseQuery(
  urlSuffix: string = '',
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const rawQuery = fetchBaseQuery({
    baseUrl: urlSuffix ? `${baseUrl}${urlSuffix}` : baseUrl,
    prepareHeaders: createPrepareHeaders(),
  });

  return async (args, api, extraOptions) => {
    let result = await rawQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401 && USE_DUAL_TOKEN_AUTH) {
      const newToken = await TokenManager.refreshAccessToken();

      if (newToken) {
        result = await rawQuery(args, api, extraOptions);
      }
    }

    return result;
  };
}

export const authBaseQuery = createAuthBaseQuery();
