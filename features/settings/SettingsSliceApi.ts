import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../../src/Utils/LocalStorageHelper';

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  liveStreamAlerts: boolean;
  followNotifications: boolean;
  commentNotifications: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  locationSharing: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
}

export interface StreamingPreferences {
  defaultCategory: string;
  autoRecord: boolean;
  chatModeration: 'open' | 'followers' | 'disabled';
  qualityPreference: 'auto' | 'high' | 'medium' | 'low';
}

export interface AccountSettings {
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  dataDownloadRequested?: string;
  lastPasswordChange: string;
}

export interface BlockedUser {
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    userName: string;
    profilePicture?: string;
  };
  blockedAt: string;
  reason: string;
}

export interface UserSettings {
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  streamingPreferences: StreamingPreferences;
  accountSettings: AccountSettings;
  blockedUsers: BlockedUser[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePicture?: string;
}

export interface BlockUserRequest {
  userId: string;
  reason: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  password: string;
}

export interface VerifyEmailRequest {
  verificationCode: string;
}

// Define a service using a base URL and expected endpoints
export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  tagTypes: ['Settings', 'BlockedUsers', 'UserProfile'],
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/settings`,
    prepareHeaders: async (headers) => {
      const token = await getLocalData({key: 'token'});
      if (token) {
        headers.set('Authorization', `${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Get user settings
    getUserSettings: builder.query<UserSettings, void>({
      query: () => ({
        url: '',
        method: 'GET',
      }),
      providesTags: ['Settings'],
    }),

    // Update notification settings
    updateNotificationSettings: builder.mutation<{success: boolean; message: string}, NotificationSettings>({
      query: (settings) => ({
        url: '/notifications',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Settings'],
    }),

    // Update privacy settings
    updatePrivacySettings: builder.mutation<{success: boolean; message: string}, PrivacySettings>({
      query: (settings) => ({
        url: '/privacy',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Settings'],
    }),

    // Update streaming preferences
    updateStreamingPreferences: builder.mutation<{success: boolean; message: string}, StreamingPreferences>({
      query: (preferences) => ({
        url: '/streaming',
        method: 'PUT',
        body: preferences,
      }),
      invalidatesTags: ['Settings'],
    }),

    // Update user profile
    updateProfile: builder.mutation<{success: boolean; message: string; user: any}, UpdateProfileRequest>({
      query: (profile) => ({
        url: '/profile',
        method: 'PUT',
        body: profile,
      }),
      invalidatesTags: ['Settings', 'UserProfile'],
    }),

    // Change password
    changePassword: builder.mutation<{success: boolean; message: string}, ChangePasswordRequest>({
      query: (passwordData) => ({
        url: '/password',
        method: 'PUT',
        body: passwordData,
      }),
    }),

    // Toggle two-factor authentication
    toggleTwoFactor: builder.mutation<{success: boolean; message: string; enabled: boolean}, {enabled: boolean}>({
      query: (data) => ({
        url: '/two-factor',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),

    // Block user
    blockUser: builder.mutation<{success: boolean; message: string}, BlockUserRequest>({
      query: (blockData) => ({
        url: '/block-user',
        method: 'POST',
        body: blockData,
      }),
      invalidatesTags: ['BlockedUsers', 'Settings'],
    }),

    // Unblock user
    unblockUser: builder.mutation<{success: boolean; message: string}, {userId: string}>({
      query: (data) => ({
        url: '/unblock-user',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BlockedUsers', 'Settings'],
    }),

    // Get blocked users
    getBlockedUsers: builder.query<{blockedUsers: BlockedUser[]}, void>({
      query: () => ({
        url: '/blocked-users',
        method: 'GET',
      }),
      providesTags: ['BlockedUsers'],
    }),

    // Request data download
    requestDataDownload: builder.mutation<{success: boolean; message: string}, void>({
      query: () => ({
        url: '/data-download',
        method: 'POST',
      }),
      invalidatesTags: ['Settings'],
    }),

    // Change email
    changeEmail: builder.mutation<{success: boolean; message: string}, ChangeEmailRequest>({
      query: (emailData) => ({
        url: '/email',
        method: 'PUT',
        body: emailData,
      }),
      invalidatesTags: ['Settings'],
    }),

    // Verify email
    verifyEmail: builder.mutation<{success: boolean; message: string}, VerifyEmailRequest>({
      query: (verificationData) => ({
        url: '/verify-email',
        method: 'POST',
        body: verificationData,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetUserSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useUpdatePrivacySettingsMutation,
  useUpdateStreamingPreferencesMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useToggleTwoFactorMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetBlockedUsersQuery,
  useRequestDataDownloadMutation,
  useChangeEmailMutation,
  useVerifyEmailMutation,
} = settingsApi;
