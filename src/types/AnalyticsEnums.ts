/**
 * Analytics Event Types and Categories
 * 
 * This file contains all valid enum values for analytics events
 * that match the backend validation schema exactly.
 * 
 * IMPORTANT: These values must match the enum in backend/models/AnalyticsModel.js
 */

// Valid Event Types (must match backend enum validation exactly)
export enum AnalyticsEventType {
  // App lifecycle events
  APP_OPENED = 'app_opened',
  APP_CLOSED = 'app_closed',
  APP_BACKGROUNDED = 'app_backgrounded',
  APP_FOREGROUNDED = 'app_foregrounded',
  
  // Authentication events
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  SIGNUP_ATTEMPT = 'signup_attempt',
  SIGNUP_SUCCESS = 'signup_success',
  SIGNUP_FAILED = 'signup_failed',
  
  // Map interaction events
  MAP_MARKER_CLICKED = 'map_marker_clicked',
  MAP_MOVED = 'map_moved',
  MAP_ZOOMED = 'map_zoomed',
  MAP_INTERACTION_COMPLETED = 'map_interaction_completed',
  MAP_LOADED = 'map_loaded',
  MAP_BOUNDS_CHANGED = 'map_bounds_changed',
  LOCATION_PERMISSION_GRANTED = 'location_permission_granted',
  LOCATION_PERMISSION_DENIED = 'location_permission_denied',
  LOCATION_CHANGED = 'location_changed',
  
  // Stream discovery events
  STREAM_DISCOVERED = 'stream_discovered',
  STREAM_PREVIEW_VIEWED = 'stream_preview_viewed',
  STREAMS_LOADED = 'streams_loaded',
  CATEGORY_FILTER_APPLIED = 'category_filter_applied',
  SEARCH_PERFORMED = 'search_performed',
  
  // Stream viewing events
  STREAM_JOINED = 'stream_joined',
  STREAM_LEFT = 'stream_left',
  STREAM_WATCHED = 'stream_watched',
  STREAM_PLAYER_OPENED = 'stream_player_opened',
  VIEWER_COUNT_UPDATED = 'viewer_count_updated',
  STREAM_SHARED = 'stream_shared',
  STREAM_QUALITY_CHANGED = 'stream_quality_changed',
  STREAM_BUFFERING = 'stream_buffering',
  STREAM_METADATA_UPDATED = 'stream_metadata_updated',
  PLAYBACK_EXPIRED = 'playback_expired',
  
  // Stream creation events
  GO_LIVE_STARTED = 'go_live_started',
  STREAM_CATEGORY_SELECTED = 'stream_category_selected',
  STREAM_TITLE_SET = 'stream_title_set',
  STREAM_STARTED = 'stream_started',
  STREAM_ENDED = 'stream_ended',
  
  // Profile events
  PROFILE_GO_LIVE_PRESSED = 'profile_go_live_pressed',
  PROFILE_TAB_CHANGED = 'profile_tab_changed',
  PROFILE_UPDATED = 'profile_updated',
  
  // UI Interaction events
  BUTTON_PRESSED = 'button_pressed',
  TAB_CHANGED = 'tab_changed',
  SETTINGS_OPENED = 'settings_opened',
  SCREEN_VIEWED = 'screen_viewed',
  
  // Session events
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  
  // Boost events
  BOOST_INTRO_VIEWED = 'boost_intro_viewed',
  BOOST_TIER_SELECTED = 'boost_tier_selected',
  BOOST_PURCHASED = 'boost_purchased',
  BOOST_ACTIVATED = 'boost_activated',
  BOOST_SKIPPED = 'boost_skipped',
  BOOST_NOTIFICATION_RECEIVED = 'boost_notification_received',
  
  // Social interaction events
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  REACTION_SENT = 'reaction_sent',
  REACTION_RECEIVED = 'reaction_received',
  EMOJI_USED = 'emoji_used',
  USER_FOLLOWED = 'user_followed',
  USER_UNFOLLOWED = 'user_unfollowed',
  PROFILE_VIEWED = 'profile_viewed',
  DIRECT_MESSAGE_STARTED = 'direct_message_started',
  CHAT_ENGAGEMENT = 'chat_engagement',
  SOCIAL_FEATURE_DISCOVERED = 'social_feature_discovered',
  MODERATION_ACTION = 'moderation_action',
  SOCIAL_NOTIFICATION_INTERACTION = 'social_notification_interaction',
  SOCIAL_SESSION_ENDED = 'social_session_ended',
  
  // Payment events
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_CANCELLED = 'payment_cancelled',
  
  // Error events
  ERROR_OCCURRED = 'error_occurred',
  CRASH_REPORTED = 'crash_reported',
  NETWORK_ERROR = 'network_error',
  PERMISSION_DENIED = 'permission_denied',
  API_CALL_FAILED = 'api_call_failed',
  TIMEOUT_ERROR = 'timeout_error',

  // Socket events
  SOCKET_CONNECTED = 'socket_connected',
  SOCKET_DISCONNECTED = 'socket_disconnected',

  // Venue & Voting events
  VENUE_CARD_OPENED = 'venue_card_opened',
  VENUE_DETAILS_VIEWED = 'venue_details_viewed',
  VENUE_VOTE_CAST = 'venue_vote_cast',
  VENUE_HEATMAP_VIEWED = 'venue_heatmap_viewed',
  VENUE_SELECTED = 'venue_selected',
  VENUE_DIRECTIONS_REQUESTED = 'venue_directions_requested',
  VENUE_PHONE_CALLED = 'venue_phone_called',
  VENUE_WEBSITE_OPENED = 'venue_website_opened',

  // Events (happenings) tracking
  EVENT_LIST_VIEWED = 'event_list_viewed',
  EVENT_DETAILS_VIEWED = 'event_details_viewed',
  EVENT_RSVP = 'event_rsvp',
  EVENT_RSVP_REMOVED = 'event_rsvp_removed',
  EVENT_CREATED = 'event_created',
  EVENT_SHARED = 'event_shared',

  // Settings events
  SETTINGS_CHANGED = 'settings_changed',
  NOTIFICATION_SETTINGS_UPDATED = 'notification_settings_updated',
  NOTIFICATION_SETTING_CHANGED = 'notification_setting_changed',
  NOTIFICATION_SETTINGS_SAVED = 'notification_settings_save',
  PRIVACY_SETTINGS_UPDATED = 'privacy_settings_updated',
  PRIVACY_SETTING_CHANGED = 'privacy_setting_changed',
  PRIVACY_SETTINGS_SAVED = 'privacy_settings_save',
  STREAMING_PREFERENCES_SAVED = 'streaming_preferences_save',
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_CHANGE_REQUESTED = 'email_change_requested',
  EMAIL_VERIFIED = 'email_verified',
  EMAIL_VERIFICATION_SENT = 'email_verification_sent',
  INTERESTS_UPDATED = 'interests_updated',
  USER_UNBLOCKED = 'user_unblocked',

  // Ad events
  AD_CREATION_STARTED = 'ad_creation_started',
  AD_TYPE_SELECTED = 'ad_type_selected',
  AD_MEDIA_UPLOADED = 'ad_media_uploaded',
  AD_TARGETING_SET = 'ad_targeting_set',
  AD_BUDGET_SET = 'ad_budget_set',
  AD_PUBLISHED = 'ad_published',

  // Squad Mode events
  SQUAD_CREATED = 'squad_created',
  SQUAD_JOINED = 'squad_joined',
  SQUAD_CANCELLED = 'squad_cancelled',
  SQUAD_EXPIRED = 'squad_expired',
  SQUAD_RECOMMENDATION_GENERATED = 'squad_recommendation_generated',
  SQUAD_RECOMMENDATION_CONFIRMED = 'squad_recommendation_confirmed',
  SQUAD_VETO_CAST = 'squad_veto_cast',
  SQUAD_CREATOR_FINAL_SAY = 'squad_creator_final_say',
  SQUAD_OUTCOME_SUBMITTED = 'squad_outcome_submitted',
  SQUAD_OUTCOME_PROMPTED = 'squad_outcome_prompted',
  SQUAD_DEFAULT_PROFILE_APPLIED = 'squad_default_profile_applied',
  SQUAD_JOIN_REMINDER_SENT = 'squad_join_reminder_sent',
  SQUAD_CONVERSION_TRACKED = 'squad_conversion_tracked',
  SQUAD_INVITE_LINK_OPENED = 'squad_invite_link_opened',
  SQUAD_VENUE_FLAGGED = 'squad_venue_flagged',
  SQUAD_INVITE_SHARED = 'squad_invite_shared',
  SQUAD_FIND_SPOT_TRIGGERED = 'squad_find_spot_triggered',
  SQUAD_VENUE_NAVIGATED = 'squad_venue_navigated',
  SQUAD_VENUE_SHARED = 'squad_venue_shared',
}

// Event Categories
export enum AnalyticsEventCategory {
  USER_ENGAGEMENT = 'user_engagement',
  STREAM_INTERACTION = 'stream_interaction',
  MONETIZATION = 'monetization',
  SOCIAL = 'social',
  TECHNICAL = 'technical',
  SQUAD = 'squad',
  VENUE = 'venue',
  EVENTS = 'events',
}

// Map Interaction Types
export enum MapInteractionType {
  MARKER_CLICKED = 'marker_clicked',
  MAP_MOVED = 'map_moved',
  MAP_ZOOMED = 'map_zoomed',
}

// Stream Actions
export enum StreamAction {
  JOIN = 'join',
  LEAVE = 'leave',
  WATCH = 'watch',
  PREVIEW = 'preview',
}

// Social Interaction Types
export enum SocialInteractionType {
  MESSAGE_SENT = 'message_sent',
  REACTION_SENT = 'reaction_sent',
  USER_FOLLOWED = 'user_followed',
  USER_PROFILE_VIEWED = 'profile_viewed',
  USER_UNFOLLOWED = 'user_unfollowed',
}

// Boost Event Types
export enum BoostEventType {
  BOOST_INTRO_VIEWED = 'boost_intro_viewed',
  BOOST_TIER_SELECTED = 'boost_tier_selected',
  BOOST_PURCHASED = 'boost_purchased',
  BOOST_ACTIVATED = 'boost_activated',
  BOOST_SKIPPED = 'boost_skipped',
}

// Payment Event Types
export enum PaymentEventType {
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_CANCELLED = 'payment_cancelled',
}

// Error Types
export enum ErrorType {
  ERROR_OCCURRED = 'error_occurred',
  CRASH_REPORTED = 'crash_reported',
  NETWORK_ERROR = 'network_error',
  PERMISSION_DENIED = 'permission_denied',
}

// Helper function to get event category based on event type
export const getEventCategory = (eventType: AnalyticsEventType): AnalyticsEventCategory => {
  const userEngagementEvents: AnalyticsEventType[] = [
    AnalyticsEventType.APP_OPENED,
    AnalyticsEventType.APP_CLOSED,
    AnalyticsEventType.APP_BACKGROUNDED,
    AnalyticsEventType.APP_FOREGROUNDED,
    AnalyticsEventType.LOGIN_ATTEMPT,
    AnalyticsEventType.LOGIN_SUCCESS,
    AnalyticsEventType.LOGIN_FAILED,
    AnalyticsEventType.LOGOUT,
    AnalyticsEventType.SIGNUP_ATTEMPT,
    AnalyticsEventType.SIGNUP_SUCCESS,
    AnalyticsEventType.SIGNUP_FAILED,
    AnalyticsEventType.LOCATION_CHANGED,
    AnalyticsEventType.MAP_MARKER_CLICKED,
    AnalyticsEventType.MAP_MOVED,
    AnalyticsEventType.MAP_ZOOMED,
    AnalyticsEventType.MAP_BOUNDS_CHANGED,
    AnalyticsEventType.MAP_LOADED,
    AnalyticsEventType.MAP_INTERACTION_COMPLETED,
    AnalyticsEventType.SEARCH_PERFORMED,
    AnalyticsEventType.CATEGORY_FILTER_APPLIED,
    AnalyticsEventType.SCREEN_VIEWED,
    AnalyticsEventType.BUTTON_PRESSED,
    AnalyticsEventType.TAB_CHANGED,
    AnalyticsEventType.SETTINGS_OPENED,
    AnalyticsEventType.PROFILE_GO_LIVE_PRESSED,
    AnalyticsEventType.PROFILE_TAB_CHANGED,
    AnalyticsEventType.PROFILE_UPDATED,
    AnalyticsEventType.SETTINGS_CHANGED,
    AnalyticsEventType.NOTIFICATION_SETTINGS_UPDATED,
    AnalyticsEventType.PRIVACY_SETTINGS_UPDATED,
    AnalyticsEventType.PASSWORD_CHANGED,
    AnalyticsEventType.EMAIL_CHANGE_REQUESTED,
    AnalyticsEventType.EMAIL_VERIFIED,
    AnalyticsEventType.EMAIL_VERIFICATION_SENT,
    AnalyticsEventType.INTERESTS_UPDATED,
    AnalyticsEventType.LOCATION_PERMISSION_GRANTED,
    AnalyticsEventType.LOCATION_PERMISSION_DENIED,
  ];

  const streamInteractionEvents: AnalyticsEventType[] = [
    AnalyticsEventType.STREAM_DISCOVERED,
    AnalyticsEventType.STREAM_PREVIEW_VIEWED,
    AnalyticsEventType.STREAMS_LOADED,
    AnalyticsEventType.STREAM_JOINED,
    AnalyticsEventType.STREAM_LEFT,
    AnalyticsEventType.STREAM_WATCHED,
    AnalyticsEventType.STREAM_PLAYER_OPENED,
    AnalyticsEventType.VIEWER_COUNT_UPDATED,
    AnalyticsEventType.GO_LIVE_STARTED,
    AnalyticsEventType.STREAM_CATEGORY_SELECTED,
    AnalyticsEventType.STREAM_TITLE_SET,
    AnalyticsEventType.STREAM_STARTED,
    AnalyticsEventType.STREAM_ENDED,
    AnalyticsEventType.STREAM_SHARED,
    AnalyticsEventType.STREAM_QUALITY_CHANGED,
    AnalyticsEventType.STREAM_BUFFERING,
    AnalyticsEventType.STREAM_METADATA_UPDATED,
    AnalyticsEventType.PLAYBACK_EXPIRED,
  ];

  const monetizationEvents: AnalyticsEventType[] = [
    AnalyticsEventType.BOOST_INTRO_VIEWED,
    AnalyticsEventType.BOOST_TIER_SELECTED,
    AnalyticsEventType.BOOST_PURCHASED,
    AnalyticsEventType.BOOST_ACTIVATED,
    AnalyticsEventType.BOOST_SKIPPED,
    AnalyticsEventType.BOOST_NOTIFICATION_RECEIVED,
    AnalyticsEventType.PAYMENT_INITIATED,
    AnalyticsEventType.PAYMENT_COMPLETED,
    AnalyticsEventType.PAYMENT_FAILED,
    AnalyticsEventType.PAYMENT_CANCELLED,
    AnalyticsEventType.AD_CREATION_STARTED,
    AnalyticsEventType.AD_TYPE_SELECTED,
    AnalyticsEventType.AD_MEDIA_UPLOADED,
    AnalyticsEventType.AD_TARGETING_SET,
    AnalyticsEventType.AD_BUDGET_SET,
    AnalyticsEventType.AD_PUBLISHED,
  ];

  const socialEvents: AnalyticsEventType[] = [
    AnalyticsEventType.MESSAGE_SENT,
    AnalyticsEventType.MESSAGE_RECEIVED,
    AnalyticsEventType.REACTION_SENT,
    AnalyticsEventType.REACTION_RECEIVED,
    AnalyticsEventType.EMOJI_USED,
    AnalyticsEventType.USER_FOLLOWED,
    AnalyticsEventType.USER_UNFOLLOWED,
    AnalyticsEventType.PROFILE_VIEWED,
    AnalyticsEventType.DIRECT_MESSAGE_STARTED,
    AnalyticsEventType.CHAT_ENGAGEMENT,
    AnalyticsEventType.SOCIAL_FEATURE_DISCOVERED,
    AnalyticsEventType.MODERATION_ACTION,
    AnalyticsEventType.SOCIAL_NOTIFICATION_INTERACTION,
    AnalyticsEventType.SOCIAL_SESSION_ENDED,
  ];

  const technicalEvents: AnalyticsEventType[] = [
    AnalyticsEventType.ERROR_OCCURRED,
    AnalyticsEventType.CRASH_REPORTED,
    AnalyticsEventType.NETWORK_ERROR,
    AnalyticsEventType.PERMISSION_DENIED,
    AnalyticsEventType.API_CALL_FAILED,
    AnalyticsEventType.TIMEOUT_ERROR,
    AnalyticsEventType.SOCKET_CONNECTED,
    AnalyticsEventType.SOCKET_DISCONNECTED,
  ];

  const venueEvents: AnalyticsEventType[] = [
    AnalyticsEventType.VENUE_CARD_OPENED,
    AnalyticsEventType.VENUE_DETAILS_VIEWED,
    AnalyticsEventType.VENUE_VOTE_CAST,
    AnalyticsEventType.VENUE_HEATMAP_VIEWED,
    AnalyticsEventType.VENUE_SELECTED,
    AnalyticsEventType.VENUE_DIRECTIONS_REQUESTED,
    AnalyticsEventType.VENUE_PHONE_CALLED,
    AnalyticsEventType.VENUE_WEBSITE_OPENED,
  ];

  const eventsEvents: AnalyticsEventType[] = [
    AnalyticsEventType.EVENT_LIST_VIEWED,
    AnalyticsEventType.EVENT_DETAILS_VIEWED,
    AnalyticsEventType.EVENT_RSVP,
    AnalyticsEventType.EVENT_RSVP_REMOVED,
    AnalyticsEventType.EVENT_CREATED,
    AnalyticsEventType.EVENT_SHARED,
  ];

  const squadEvents: AnalyticsEventType[] = [
    AnalyticsEventType.SQUAD_CREATED,
    AnalyticsEventType.SQUAD_JOINED,
    AnalyticsEventType.SQUAD_CANCELLED,
    AnalyticsEventType.SQUAD_EXPIRED,
    AnalyticsEventType.SQUAD_RECOMMENDATION_GENERATED,
    AnalyticsEventType.SQUAD_RECOMMENDATION_CONFIRMED,
    AnalyticsEventType.SQUAD_VETO_CAST,
    AnalyticsEventType.SQUAD_CREATOR_FINAL_SAY,
    AnalyticsEventType.SQUAD_OUTCOME_SUBMITTED,
    AnalyticsEventType.SQUAD_OUTCOME_PROMPTED,
    AnalyticsEventType.SQUAD_DEFAULT_PROFILE_APPLIED,
    AnalyticsEventType.SQUAD_JOIN_REMINDER_SENT,
    AnalyticsEventType.SQUAD_CONVERSION_TRACKED,
    AnalyticsEventType.SQUAD_INVITE_LINK_OPENED,
    AnalyticsEventType.SQUAD_VENUE_FLAGGED,
    AnalyticsEventType.SQUAD_INVITE_SHARED,
    AnalyticsEventType.SQUAD_FIND_SPOT_TRIGGERED,
    AnalyticsEventType.SQUAD_VENUE_NAVIGATED,
    AnalyticsEventType.SQUAD_VENUE_SHARED,
  ];

  if (userEngagementEvents.includes(eventType)) {
    return AnalyticsEventCategory.USER_ENGAGEMENT;
  }
  if (streamInteractionEvents.includes(eventType)) {
    return AnalyticsEventCategory.STREAM_INTERACTION;
  }
  if (monetizationEvents.includes(eventType)) {
    return AnalyticsEventCategory.MONETIZATION;
  }
  if (socialEvents.includes(eventType)) {
    return AnalyticsEventCategory.SOCIAL;
  }
  if (technicalEvents.includes(eventType)) {
    return AnalyticsEventCategory.TECHNICAL;
  }
  if (venueEvents.includes(eventType)) {
    return AnalyticsEventCategory.VENUE;
  }
  if (eventsEvents.includes(eventType)) {
    return AnalyticsEventCategory.EVENTS;
  }
  if (squadEvents.includes(eventType)) {
    return AnalyticsEventCategory.SQUAD;
  }

  // Default to user engagement
  return AnalyticsEventCategory.USER_ENGAGEMENT;
};

// Critical events that should be flushed immediately
export const CRITICAL_EVENTS = [
  AnalyticsEventType.ERROR_OCCURRED,
  AnalyticsEventType.CRASH_REPORTED,
  AnalyticsEventType.PAYMENT_COMPLETED,
  AnalyticsEventType.STREAM_STARTED,
  AnalyticsEventType.BOOST_PURCHASED,
] as const;
