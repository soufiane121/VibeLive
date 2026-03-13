// Global Colors Configuration for VibeLive
// Centralized color management with screen-specific organization
// Usage: import { GlobalColors } from '../styles/GlobalColors';

// Base color palette
const baseColors = {
  // Primary brand colors
  cyan: '#00FFFF',
  deepPink: '#FF1493',
  gold: '#FFD700',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  indigo: '#4f46e5',
  off_black: '#0A0A0C',
  dark_grey: '#181A20',
  gold_accent: '#D4AF37',
  white_ivory: '#F2EFE8',
  dark_gold: '#A77C0A',
  cardBackground: 'rgba(242, 239, 232, 0.05)',

  // Gradient specific colors
  electricBlue: '#0080FF',
  blueViolet: '#8A2BE2',
  darkOrange: '#FF8C00',

  // Grayscale
  black: '#000000',
  deepBlack: '#0a0a0a',
  darkGray: '#1a1a1a',
  newBackGroundColor: '#121217',
  gray: '#2a2a2a',
  mediumGray: '#374151',
  lightGray: '#4b5563',
  mutedGray: '#6b7280',
  textGray: '#71717a',
  lightTextGray: '#a1a1aa',
  white: '#ffffff',
  offWhite: '#CCCCCC',
  mutedWhite: '#888888',

  // Semantic colors
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',

  // Event type colors
  musicPink: '#ec4899',
  sportsGreen: '#10b981',
  nightlifePurple: '#8b5cf6',
  festivalAmber: '#f59e0b',
  conferenceBlue: '#3b82f6',
  comedyOrange: '#f97316',
  theaterRed: '#ef4444',
  artCyan: '#06b6d4',
  foodLime: '#84cc16',

  // Transparent overlays
  blackOverlay: 'rgba(0, 0, 0, 0.8)',
  whiteOverlay: 'rgba(255, 255, 255, 0.1)',
  cyanOverlay: 'rgba(0, 255, 255, 0.1)',
  pinkOverlay: 'rgba(255, 20, 147, 0.1)',
  goldOverlay: 'rgba(255, 215, 0, 0.1)',
};
baseColors.deepBlack = baseColors.newBackGroundColor;


// Type definitions for color schemes
export interface ColorScheme {
  // Background and surfaces
  background?: string;
  overlay?: string;
  
  // Text colors
  text?: string;
  textSecondary?: string;
  buttonText?: string;
  
  // Interactive elements
  primary?: string;
  highlight?: string;
  error?: string;
  
  // Borders and dividers
  border?: string;
  
  // Special backgrounds
  infoBackground?: string;
  infoBorder?: string;
  infoText?: string;
  highlightBackground?: string;
  highlightBorder?: string;
  
  // UI elements
  dragHandle?: string;
  shadow?: string;
}

// Screen-specific color configurations
export const GlobalColors = {
  // Events List Screen
  EventsListScreen: {
    background: baseColors.newBackGroundColor,
    surface: baseColors.darkGray,
    surfaceVariant: baseColors.cardBackground,
    primary: baseColors.gold_accent,
    primaryVariant: '#6366f1',
    accent: baseColors.warning,
    text: baseColors.white_ivory,
    textSecondary: baseColors.mutedGray,
    textMuted: baseColors.mutedGray,
    success: baseColors.success,
    error: baseColors.error,
    warning: baseColors.warning,
    border: baseColors.mutedGray,
    borderLight: baseColors.lightGray,
    createButton: baseColors.gold_accent,
    filterBackground: baseColors.gray,
    filterBorder: baseColors.mediumGray,
    filterActive: baseColors.indigo + '20',
    filterActiveText: baseColors.indigo,
    promotionBadge: baseColors.warning,
    eventTypeMusic: baseColors.musicPink,
    eventTypeSports: baseColors.sportsGreen,
    eventTypeNightlife: baseColors.nightlifePurple,
    eventTypeFestival: baseColors.festivalAmber,
    eventTypeConference: baseColors.conferenceBlue,
    eventTypeComedy: baseColors.comedyOrange,
    eventTypeTheater: baseColors.theaterRed,
    eventTypeArt: baseColors.artCyan,
    eventTypeFood: baseColors.foodLime,
    eventTypeOther: baseColors.mutedGray,
  },

  // Settings Screen
  Settings: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white_ivory,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.dark_gold,
    border: baseColors.mediumGray,
    accent: baseColors.gold_accent,
    chevronColor: baseColors.lightGray,
    boostHighlight: baseColors.dark_gold,
    sectionBackground: baseColors.gray,
    itemBackground: baseColors.darkGray,
    divider: baseColors.whiteOverlay,
  },

  // Profile Screen
  Profile: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    accent: baseColors.cyan,
    border: baseColors.mediumGray,
    tabActive: baseColors.cyan,
    tabInactive: baseColors.mutedGray,
    goLiveButton: baseColors.deepPink,
    promoteButton: baseColors.gold,
    statsText: baseColors.white,
    chevronColor: baseColors.lightGray,
  },

  // Notification Settings
  NotificationSettings: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    border: baseColors.mediumGray,
    switchActive: baseColors.cyan,
    switchInactive: baseColors.mutedGray,
    sectionHeader: baseColors.lightTextGray,
    itemBackground: baseColors.gray,
    chevronColor: baseColors.lightGray,
  },

  // Privacy Settings
  PrivacySettings: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    border: baseColors.mediumGray,
    switchActive: baseColors.cyan,
    switchInactive: baseColors.mutedGray,
    sectionHeader: baseColors.lightTextGray,
    itemBackground: baseColors.gray,
    chevronColor: baseColors.lightGray,
  },

  // Streaming Preferences
  StreamingPreferences: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    border: baseColors.mediumGray,
    switchActive: baseColors.cyan,
    switchInactive: baseColors.mutedGray,
    sectionHeader: baseColors.lightTextGray,
    itemBackground: baseColors.gray,
    chevronColor: baseColors.lightGray,
    qualityHigh: baseColors.success,
    qualityMedium: baseColors.warning,
    qualityLow: baseColors.error,
  },

  // Blocked Users
  BlockedUsers: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    border: baseColors.mediumGray,
    unblockButton: baseColors.error,
    emptyState: baseColors.mutedGray,
    chevronColor: baseColors.lightGray,
  },

  // Password Settings
  PasswordSettings: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    border: baseColors.mediumGray,
    inputBackground: baseColors.gray,
    inputBorder: baseColors.lightGray,
    inputFocused: baseColors.cyan,
    saveButton: baseColors.cyan,
    twoFactorToggle: baseColors.success,
    chevronColor: baseColors.lightGray,
  },

  // Email Settings
  EmailSettings: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    border: baseColors.mediumGray,
    inputBackground: baseColors.gray,
    inputBorder: baseColors.lightGray,
    inputFocused: baseColors.cyan,
    saveButton: baseColors.cyan,
    verifyButton: baseColors.success,
    chevronColor: baseColors.lightGray,
  },

  // Map Container
  MapContainer: {
    background: baseColors.deepBlack,
    markerDefault: baseColors.cyan,
    markerBoosted: baseColors.gold,
    markerMultiple: baseColors.deepPink,
    markerSingle: baseColors.cyan,
    clusterBackground: baseColors.darkGray,
    clusterText: baseColors.white,
    clusterBorder: baseColors.cyan,
    resetButton: baseColors.darkGray,
    resetButtonBorder: baseColors.mediumGray,
    resetButtonText: baseColors.white,
  },

  // Boost FOMO Flow
  BoostFOMOFlow: {
    cardBackground: baseColors.cardBackground,
    background: baseColors.deepBlack,
    surface: baseColors.dark_grey,
    overlay: baseColors.blackOverlay,
    text: baseColors.white_ivory,
    textSecondary: baseColors.white_ivory,
    textMuted: baseColors.white_ivory,
    primary: baseColors.gold_accent,
    primaryHover: baseColors.dark_gold,
    secondary: baseColors.gold_accent,
    accent: baseColors.gold_accent,
    warning: baseColors.gold_accent,
    error: baseColors.error,
    success: baseColors.success,
    urgency: baseColors.gold_accent,
    scarcity: baseColors.gold_accent,
    socialProof: baseColors.gold_accent,
    competition: baseColors.gold_accent,
    tierBasic: baseColors.gold_accent,
    tierPremium: baseColors.gold_accent,
    tierUltimate: baseColors.gold_accent,
    tierBasicBackground: baseColors.dark_grey,
    tierPremiumBackground: baseColors.dark_grey,
    tierUltimateBackground: baseColors.dark_grey,
    // Gradient colors for boost tiers
    tierBasicGradientStart: baseColors.gold_accent,
    tierBasicGradientEnd: baseColors.dark_gold,
    tierPremiumGradientStart: baseColors.gold_accent,
    tierPremiumGradientEnd: baseColors.dark_gold,
    tierUltimateGradientStart: baseColors.gold_accent,
    tierUltimateGradientEnd: baseColors.dark_gold,
    buttonPrimary: baseColors.gold_accent,
    buttonSecondary: baseColors.dark_gold,
    buttonGhost: 'transparent',
    buttonDisabled: baseColors.mutedGray,
    border: baseColors.mutedGray,
    borderActive: baseColors.gold_accent,
    pulse: 'rgba(212, 175, 55, 0.3)',
    glow: 'rgba(212, 175, 55, 0.2)',
    flash: 'rgba(212, 175, 55, 0.6)',
  },

  // Event Selections
  EventSelections: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    primary: baseColors.cyan,
    accent: baseColors.deepPink,
    border: baseColors.mediumGray,
    categoryButton: baseColors.gray,
    categoryButtonActive: baseColors.cyan,
    categoryButtonText: baseColors.white,
    categoryButtonTextActive: baseColors.black,
    startStreamButton: baseColors.deepPink,
    boostButton: baseColors.gold,
  },

  // Live Stream Container
  LiveStreamContainer: {
    background: baseColors.deepBlack,
    overlay: baseColors.blackOverlay,
    text: baseColors.white,
    controls: baseColors.darkGray,
    controlsActive: baseColors.cyan,
    endButton: baseColors.error,
    switchButton: baseColors.warning,
    viewerCount: baseColors.success,
  },

  // Chat List
  ChatList: {
    background: 'transparent',
    messageBackground: 'rgba(30, 30, 30, 0.8)',
    messageText: baseColors.mutedWhite,
    messageTime: baseColors.mutedWhite,
    userName: baseColors.white,
    usernameModerator: baseColors.gold,
    usernameVIP: baseColors.deepPink,
    usernameRegular: baseColors.cyan,
    inputBackground: 'rgba(30, 30, 30, 0.9)',
    inputText: baseColors.white,
    inputPlaceholder: baseColors.mutedWhite,
    sendIcon: baseColors.mutedGray,
    reactionBackground: 'rgba(95,103,111, 0.5)',
    reactionIcon: baseColors.offWhite,
    emojiReaction: baseColors.warning,
    border: baseColors.mediumGray,
  },

  // Bottom Navigation
  BottomNavigation: {
    background: baseColors.deepBlack,
    border: baseColors.mediumGray,
    tabActive: baseColors.gold_accent,
    tabInactive: baseColors.mutedGray,
    tabBackground: baseColors.newBackGroundColor,
    badge: baseColors.error,
    badgeText: baseColors.white,
  },

  // Event Creation Flow
  EventCreationFlow: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white_ivory,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    primary: baseColors.dark_gold,
    accent: baseColors.warning,
    border: baseColors.mediumGray,
    inputBackground: baseColors.gray,
    inputBorder: baseColors.lightGray,
    inputFocused: baseColors.indigo,
    stepIndicatorActive: baseColors.gold_accent,
    stepIndicatorInactive: baseColors.mutedGray,
    nextButton: baseColors.indigo,
    backButton: baseColors.mutedGray,
    createButton: baseColors.success,
    error: baseColors.error,
  },

  // Event Details Screen
  EventDetailsScreen: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    surfaceVariant: baseColors.gray,
    text: baseColors.white_ivory,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    primary: baseColors.gold_accent,
    button: baseColors.dark_gold,
    accent: baseColors.warning,
    border: baseColors.mediumGray,
    success: baseColors.success,
    error: baseColors.error,
    rsvpButton: baseColors.success,
    shareButton: baseColors.cyan,
    ticketButton: baseColors.warning,
    promotionBadge: baseColors.warning,
    locationIcon: baseColors.mutedGray,
    timeIcon: baseColors.mutedGray,
  },

  // Stream Player
  StreamPlayer: {
    background: 'transparent',
    headerBackground: 'transparent',
    userInfoBackground: 'rgba(136, 48, 78, 0.3)',
    liveInfoBackground: 'rgba(95,103,111, 0.2)',
    followBackground: 'rgba(136, 48, 78, 0.8)',
    liveBackground: baseColors.error, // Red for live indicator
    text: baseColors.white_ivory, // #CFD6DF
    titleText: baseColors.offWhite,
    userName: baseColors.offWhite,
    countText: baseColors.offWhite,
    followText: baseColors.offWhite,
    liveText: baseColors.white,
    closeIcon: baseColors.white,
    eyeIcon: baseColors.offWhite,
    border: 'transparent',
  },
  ModalBottom: {
    // Background and surfaces
    background: baseColors.deepBlack,
    overlay: baseColors.blackOverlay,

    // Text colors
    text: baseColors.white_ivory,
    textSecondary: baseColors.offWhite,
    buttonText: baseColors.black,

    // Interactive elements
    primary: baseColors.gold_accent,
    highlight: baseColors.gold_accent,
    error: baseColors.error,

    // Borders and dividers
    border: baseColors.whiteOverlay,

    // Special backgrounds
    infoBackground: baseColors.cardBackground,
    infoBorder: baseColors.mutedGray,
    infoText: baseColors.white_ivory,
    highlightBackground: baseColors.cardBackground,
    highlightBorder: baseColors.mutedGray,

    // UI elements
    dragHandle: baseColors.whiteOverlay,
    shadow: baseColors.black,
  } satisfies ColorScheme,

  // Analytics Components
  Analytics: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    primary: baseColors.indigo,
    success: baseColors.success,
    error: baseColors.error,
    warning: baseColors.warning,
    border: baseColors.mediumGray,
    chartLine: baseColors.cyan,
    chartBar: baseColors.deepPink,
    chartArea: baseColors.cyanOverlay,
  },

  // Squad Mode
  SquadMode: {
    background: baseColors.newBackGroundColor,
    surface: baseColors.darkGray,
    surfaceElevated: baseColors.gray,
    text: baseColors.white_ivory,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    primary: baseColors.cyan,
    primaryMuted: 'rgba(0, 255, 255, 0.15)',
    accent: baseColors.deepPink,
    accentMuted: 'rgba(255, 20, 147, 0.15)',
    gold: baseColors.gold_accent,
    goldMuted: 'rgba(212, 175, 55, 0.15)',
    border: baseColors.mediumGray,
    borderLight: baseColors.lightGray,
    // Squad-specific
    inviteButton: baseColors.cyan,
    vetoButton: baseColors.deepPink,
    confirmButton: baseColors.success,
    cancelButton: baseColors.error,
    memberBadge: baseColors.purple,
    memberBadgeGuest: baseColors.mutedGray,
    matchScore: baseColors.gold_accent,
    vibeIndicator: baseColors.cyan,
    capacityGood: baseColors.success,
    capacityWarning: baseColors.warning,
    capacityFull: baseColors.error,
    tagSelected: baseColors.cyan,
    tagUnselected: baseColors.gray,
    tagBorder: baseColors.lightGray,
    emptyStateIcon: baseColors.mutedGray,
    emptyStateText: baseColors.mutedWhite,
    countdownWarning: baseColors.warning,
    statusForming: baseColors.cyan,
    statusActive: baseColors.gold_accent,
    statusConfirmed: baseColors.success,
    statusExpired: baseColors.mutedGray,
  },

  // Common UI Elements
  Common: {
    // Loading states
    loadingSpinner: baseColors.cyan,
    loadingBackground: baseColors.darkGray,
    loadingText: baseColors.offWhite,

    // Empty states
    emptyStateIcon: baseColors.mutedGray,
    emptyStateText: baseColors.mutedWhite,
    emptyStateBackground: baseColors.darkGray,

    // Error states
    errorIcon: baseColors.error,
    errorText: baseColors.error,
    errorBackground: baseColors.darkGray,
    retryButton: baseColors.cyan,

    // Success states
    successIcon: baseColors.success,
    successText: baseColors.success,
    successBackground: baseColors.darkGray,

    // Modals
    modalBackground: baseColors.blackOverlay,
    modalSurface: baseColors.darkGray,
    modalBorder: baseColors.mediumGray,

    // Buttons
    primaryButton: baseColors.cyan,
    primaryButtonText: baseColors.black,
    secondaryButton: baseColors.gray,
    secondaryButtonText: baseColors.white,
    ghostButton: 'transparent',
    ghostButtonText: baseColors.offWhite,
    ghostButtonBorder: baseColors.mediumGray,
    disabledButton: baseColors.mutedGray,
    disabledButtonText: baseColors.mutedWhite,

    // Inputs
    inputBackground: baseColors.gray,
    inputBorder: baseColors.lightGray,
    inputFocused: baseColors.cyan,
    inputText: baseColors.white,
    inputPlaceholder: baseColors.mutedWhite,

    // Dividers
    divider: baseColors.whiteOverlay,
    dividerThick: baseColors.mediumGray,
  },
};

// Utility functions for color manipulation
export const ColorUtils = {
  // Add alpha to any color
  withAlpha: (color: string, alpha: number): string => {
    if (color.startsWith('rgba')) {
      return color.replace(/[\d\.]+\)$/g, `${alpha})`);
    }
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  },
  
  // Get event type color
  getEventTypeColor: (eventType: string): string => {
    const colors = GlobalColors.EventsListScreen;
    switch (eventType) {
      case 'music': return colors.eventTypeMusic;
      case 'sports': return colors.eventTypeSports;
      case 'nightlife': return colors.eventTypeNightlife;
      case 'festival': return colors.eventTypeFestival;
      case 'conference': return colors.eventTypeConference;
      case 'comedy': return colors.eventTypeComedy;
      case 'theater': return colors.eventTypeTheater;
      case 'art': return colors.eventTypeArt;
      case 'food': return colors.eventTypeFood;
      default: return colors.eventTypeOther;
    }
  },

  // Analytics Colors
  Analytics: {
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#2c3e50',
    textSecondary: '#7f8c8d',
    primary: '#3498db',
    success: '#27ae60',
    error: '#e74c3c',
    border: '#95a5a6',
  },
  
  // Get boost tier color
  getBoostTierColor: (tier: 'basic' | 'premium' | 'ultimate'): string => {
    const colors = GlobalColors.BoostFOMOFlow;
    switch (tier) {
      case 'basic': return colors.tierBasic;
      case 'premium': return colors.tierPremium;
      case 'ultimate': return colors.tierUltimate;
      default: return colors.tierBasic;
    }
  },
};

export default GlobalColors;
