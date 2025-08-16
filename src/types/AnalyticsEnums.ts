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
  
  // Map interaction events
  MAP_MARKER_CLICKED = 'map_marker_clicked',
  MAP_MOVED = 'map_moved',
  MAP_ZOOMED = 'map_zoomed',
  LOCATION_CHANGED = 'location_changed',
  
  // Stream discovery events
  STREAM_DISCOVERED = 'stream_discovered',
  STREAM_PREVIEW_VIEWED = 'stream_preview_viewed',
  CATEGORY_FILTER_APPLIED = 'category_filter_applied',
  SEARCH_PERFORMED = 'search_performed',
  
  // Stream viewing events
  STREAM_JOINED = 'stream_joined',
  STREAM_LEFT = 'stream_left',
  STREAM_WATCHED = 'stream_watched',
  VIEWER_COUNT_UPDATED = 'viewer_count_updated',
  
  // Stream creation events
  GO_LIVE_STARTED = 'go_live_started',
  CATEGORY_SELECTED = 'category_selected',
  STREAM_TITLE_SET = 'stream_title_set',
  STREAM_STARTED = 'stream_started',
  STREAM_ENDED = 'stream_ended',
  
  // Boost events
  BOOST_INTRO_VIEWED = 'boost_intro_viewed',
  BOOST_TIER_SELECTED = 'boost_tier_selected',
  BOOST_PURCHASED = 'boost_purchased',
  BOOST_ACTIVATED = 'boost_activated',
  BOOST_SKIPPED = 'boost_skipped',
  
  // Social interaction events
  MESSAGE_SENT = 'message_sent',
  REACTION_SENT = 'reaction_sent',
  EMOJI_USED = 'emoji_used',
  USER_FOLLOWED = 'user_followed',
  USER_UNFOLLOWED = 'user_unfollowed',
  PROFILE_VIEWED = 'profile_viewed',
  
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
}

// Event Categories
export enum AnalyticsEventCategory {
  USER_ENGAGEMENT = 'user_engagement',
  STREAM_INTERACTION = 'stream_interaction',
  MONETIZATION = 'monetization',
  SOCIAL = 'social',
  TECHNICAL = 'technical',
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
  const userEngagementEvents = [
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
    AnalyticsEventType.LOCATION_CHANGED,
    AnalyticsEventType.MAP_MARKER_CLICKED,
    AnalyticsEventType.MAP_MOVED,
    AnalyticsEventType.MAP_ZOOMED,
    AnalyticsEventType.SEARCH_PERFORMED,
    AnalyticsEventType.CATEGORY_FILTER_APPLIED,
  ];

  const streamInteractionEvents = [
    AnalyticsEventType.STREAM_DISCOVERED,
    AnalyticsEventType.STREAM_PREVIEW_VIEWED,
    AnalyticsEventType.STREAM_JOINED,
    AnalyticsEventType.STREAM_LEFT,
    AnalyticsEventType.STREAM_WATCHED,
    AnalyticsEventType.VIEWER_COUNT_UPDATED,
    AnalyticsEventType.GO_LIVE_STARTED,
    AnalyticsEventType.CATEGORY_SELECTED,
    AnalyticsEventType.STREAM_TITLE_SET,
    AnalyticsEventType.STREAM_STARTED,
    AnalyticsEventType.STREAM_ENDED,
  ];

  const monetizationEvents = [
    AnalyticsEventType.BOOST_INTRO_VIEWED,
    AnalyticsEventType.BOOST_TIER_SELECTED,
    AnalyticsEventType.BOOST_PURCHASED,
    AnalyticsEventType.BOOST_ACTIVATED,
    AnalyticsEventType.BOOST_SKIPPED,
    AnalyticsEventType.PAYMENT_INITIATED,
    AnalyticsEventType.PAYMENT_COMPLETED,
    AnalyticsEventType.PAYMENT_FAILED,
    AnalyticsEventType.PAYMENT_CANCELLED,
  ];

  const socialEvents = [
    AnalyticsEventType.MESSAGE_SENT,
    AnalyticsEventType.REACTION_SENT,
    AnalyticsEventType.EMOJI_USED,
    AnalyticsEventType.USER_FOLLOWED,
    AnalyticsEventType.USER_UNFOLLOWED,
    AnalyticsEventType.PROFILE_VIEWED,
  ];

  const technicalEvents = [
    AnalyticsEventType.ERROR_OCCURRED,
    AnalyticsEventType.CRASH_REPORTED,
    AnalyticsEventType.NETWORK_ERROR,
    AnalyticsEventType.PERMISSION_DENIED,
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
