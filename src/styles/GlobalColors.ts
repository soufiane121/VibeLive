import { premiumColors } from './premuimColors';

import { getLocalData } from '../Utils/LocalStorageHelper';

let isDarkMode, premiumDark;
(async () => {
  isDarkMode = await getLocalData({ key: 'isDarkMode' }) === 'true';
})()

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


if (isDarkMode) {
  premiumDark = premiumColors.light;
} else {
  premiumDark = premiumColors.dark;
}


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
  VenueSelectionScreen: {
    background: 'red',
  },
  // Events List Screen
  EventsListScreen: {
    background: premiumDark.primaryBackground,
    surface: premiumDark.secondarySurface,
    surfaceVariant: premiumDark.primarySurface,
    primary: premiumDark.accentPrimary,
    primarySurface: premiumDark.accentSurface,
    primaryBorder: premiumDark.accentBorder,
    accent: premiumDark.accentPrimary,
    text: premiumDark.primaryText,
    textSecondary: premiumDark.secondaryText,
    textMuted: premiumDark.tertiaryText,
    success: premiumDark.successPrimary,
    successSurface: premiumDark.successSurface,
    successBorder: premiumDark.successBorder,
    error: premiumDark.hotPrimary,
    warning: baseColors.warning,
    border: premiumDark.primaryBorder,
    borderLight: premiumDark.primaryBorder,
    separator: premiumDark.separator,
    createButton: premiumDark.accentPrimary,
    filterBackground: premiumDark.primarySurface,
    filterBorder: premiumDark.primaryBorder,
    filterActive: premiumDark.accentSurface,
    filterActiveBorder: premiumDark.accentBorder,
    filterActiveText: premiumDark.accentPrimary,
    promotionBadge: premiumDark.accentPrimary,
    eventTypeMusic: premiumDark.accentPrimary,
    eventTypeSports: premiumDark.successPrimary,
    eventTypeNightlife: premiumDark.accentPrimary,
    eventTypeFestival: premiumDark.accentPrimary,
    eventTypeConference: premiumDark.accentPrimary,
    eventTypeComedy: premiumDark.accentPrimary,
    eventTypeTheater: premiumDark.accentPrimary,
    eventTypeArt: premiumDark.accentPrimary,
    eventTypeFood: premiumDark.successPrimary,
    eventTypeOther: premiumDark.secondaryText,
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
    cardBackground: premiumDark.secondaryBackground,
    background: premiumDark.primaryBackground,
    iconsBG: premiumDark.secondaryBackground,
    selectedIconBG: premiumDark.accentSurface,
    iconColor: premiumDark.secondaryText,
    selectedIconColor: premiumDark.accentPrimary,
    tonightOnlyBadge: premiumDark.hotPrimary,
    tonightOnlyBadgeBG: premiumDark.hotSurface,
    tonightOnlyBadgeBorder: premiumDark.hotBorder,
    surface: premiumDark.secondarySurface,
    overlay: premiumDark.primaryBackground,
    continueBtnBG: premiumDark.primarySurface,
    text: premiumDark.primaryText,
    inputBG: premiumDark.secondaryBackground,
    inputText: premiumDark.primaryText,
    inputBorder: premiumDark.secondaryBorder,
    textSecondary: premiumDark.secondaryText,
    textMuted: premiumDark.tertiaryText,
    selectedCard: premiumDark.accentSurface,
    selectedSubCategory: premiumDark.accentSurface,
    benchMark: premiumDark.accentPrimary,
    primary: premiumDark.primaryBorder,
    primaryBorder: premiumDark.secondaryBorder,
    primaryHover: premiumDark.accentPrimary,
    secondary: premiumDark.secondaryBackground,
    accent: premiumDark.accentPrimary,
    warning: premiumDark.hotPrimary,
    error: premiumDark.hotPrimary,
    success: premiumDark.successPrimary,
    urgency: premiumDark.hotPrimary,
    scarcity: premiumDark.hotPrimary,
    socialProof: premiumDark.accentPrimary,
    competition: premiumDark.accentPrimary,
    tierBasic: premiumDark.accentPrimary,
    tierPremium: premiumDark.accentPrimary,
    tierUltimate: premiumDark.successPrimary,
    tierBasicBackground: premiumDark.accentSurface,
    tierPremiumBackground: premiumDark.secondaryBackground,
    tierUltimateBackground: premiumDark.secondaryBackground,
    tierBasicGradientStart: premiumDark.accentPrimary,
    tierBasicGradientEnd: premiumDark.accentPrimary,
    tierPremiumGradientStart: premiumDark.accentPrimary,
    tierPremiumGradientEnd: premiumDark.accentPrimary,
    tierUltimateGradientStart: premiumDark.successPrimary,
    tierUltimateGradientEnd: premiumDark.successPrimary,
    buttonPrimary: premiumDark.accentPrimary,
    buttonSecondary: premiumDark.secondaryBackground,
    buttonGhost: 'transparent',
    buttonDisabled: premiumDark.secondaryBackground,
    border: premiumDark.primaryBorder,
    borderActive: premiumDark.accentBorder,
    cntBtnBorder: premiumDark.accentBorder,
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

  LiveStreamContainer: {
    background: premiumDark.primaryBackground,
    btnsBG: premiumDark.secondaryBackground,
    overlay: premiumDark.primaryBackground,
    text: premiumDark.primaryText,
    textSecondary: premiumDark.secondaryText,
    controls: premiumDark.secondarySurface,
    controlsActive: premiumDark.accentSurface,
    controlsActiveBorder: premiumDark.accentPrimary,
    controlsActiveIcon: premiumDark.accentPrimary,
    endButton: premiumDark.hotPrimary,
    switchButton: premiumDark.primarySurface,
    viewerCount: premiumDark.primaryText,
    border: premiumDark.primaryBorder,
    success: premiumDark.successPrimary,
  },

  EndStreamModal: {
    background: premiumDark.primaryBackground,
    surface: premiumDark.secondarySurface,
    border: premiumDark.primaryBorder,
    text: premiumDark.primaryText,
    textSecondary: premiumDark.secondaryText,
    warningBackground: premiumDark.hotSurface,
    warningBorder: premiumDark.hotBorder,
    warningText: premiumDark.hotPrimary,
    buttonBorder: premiumDark.primaryBorder,
    buttonBackground: premiumDark.secondaryBackground,
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
    background: premiumDark.primaryBackground,
    surface: premiumDark.primarySurface,
    surfaceVariant: premiumDark.secondarySurface,
    text: premiumDark.primaryText,
    textActiveStep: premiumDark.accentPrimary,
    textSecondary: premiumDark.secondaryText,
    textMuted: premiumDark.tertiaryText,
    primary: premiumDark.accentPrimary,
    primarySurface: premiumDark.accentSurface,
    primaryBorder: premiumDark.accentBorder,
    accent: premiumDark.accentPrimary,
    border: premiumDark.secondaryBorder,
    borderLight: premiumDark.primaryBorder,
    inputBackground: premiumDark.secondaryBackground,
    inputBorder: premiumDark.primaryBorder,
    inputFocusedBackground: premiumDark.primarySurface,
    inputFocusedBorder: premiumDark.accentBorder,
    stepIndicatorActive: premiumDark.accentSurface,
    stepIndicatorInactive: premiumDark.secondarySurface,
    stepIndicatorInactiveBox: premiumDark.secondaryBackground,
    nextButtonText: premiumDark.primaryText, 
    nextButton: premiumDark.secondaryBackground, 
    backButton: premiumDark.secondarySurface,
    createButton: premiumDark.secondaryBackground,
    error: premiumDark.hotPrimary,
  },

  // Event Details Screen
  EventDetailsScreen: {
    background: premiumDark.primaryBackground,
    secondaryBackground: premiumDark.accentSurface,
    surface: premiumDark.primarySurface,
    surfaceVariant: premiumDark.accentSurface,
    text: premiumDark.primaryText,
    removeText: premiumDark.hotPrimary,
    textSecondary: premiumDark.secondaryText,
    textMuted: premiumDark.tertiaryText,
    primary: premiumDark.accentPrimary,
    primarySurface: premiumDark.accentSurface,
    primaryBorder: premiumDark.accentBorder,
    removeBorder: premiumDark.hotBorder,
    accent: premiumDark.accentPrimary,
    border: premiumDark.secondaryBorder,
    borderLight: premiumDark.accentBorder,
    success: premiumDark.successPrimary,
    successSurface: premiumDark.successSurface,
    successBorder: premiumDark.successBorder,
    error: premiumDark.hotPrimary,
    rsvpButton: 'transparent',
    shareButton: premiumDark.primarySurface,
    ticketButton: premiumDark.accentPrimary,
    promotionBadge: premiumDark.accentPrimary,
    locationIcon: premiumDark.secondaryText,
    timeIcon: premiumDark.secondaryText,
    separator: premiumDark.separator,
    iconColor: premiumDark.secondaryText,
    headerIconBackground: 'rgba(0,0,0,0.3)',
    headerIconText: baseColors.white,
    accentPrimary: premiumDark.accentPrimary,
    
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
    background: premiumDark.primaryBackground,
    secondaryBackground: premiumDark.secondaryBackground,
    connecting: premiumDark.hotPrimary,
    surface: premiumDark.primarySurface,
    surfaceElevated: premiumDark.secondarySurface,
    text: premiumDark.primaryText,
    textSecondary: premiumDark.secondaryText,
    textMuted: premiumDark.secondaryText,
    primary: premiumDark.accentPrimary,
    primaryMuted: premiumDark.accentSurface,
    accent: premiumDark.accentPrimary,
    accentMuted: premiumDark.accentSubtle,
    gold: baseColors.gold_accent,
    goldMuted: 'rgba(212, 175, 55, 0.15)',
    border: premiumDark.primaryBorder,
    borderLight: premiumDark.secondaryBorder,
    divider: premiumDark.separator,
    heroIconBg: premiumDark.accentSurface,
    heroBadgeBg: premiumDark.accentPrimary,
    heroBadgeText: premiumDark.primaryText,
    heroOutline: premiumDark.accentBorder,
    sectionLabel: premiumDark.secondaryText,
    stepNumberBg: premiumDark.accentSurface,
    stepNumberBorder: premiumDark.accentBorder,
    stepLine: premiumDark.separator,
    ctaButtonBg: premiumDark.accentPrimary,
    ctaButtonBorder: premiumDark.accentBorder,
    ctaButtonText: premiumDark.primaryText,
    outlineButtonBg: premiumDark.primaryBackground,
    outlineButtonBorder: premiumDark.primaryBorder,
    outlineButtonText: premiumDark.primaryText,
    link: premiumDark.accentPrimary,
    mutedLink: premiumDark.secondaryText,
    // Squad-specific
    inviteButton: premiumDark.accentPrimary,
    vetoButton: baseColors.deepPink,
    confirmButton: baseColors.success,
    cancelButton: baseColors.error,
    memberBadge: premiumDark.accentSurface,
    memberBadgeGuest: premiumDark.accentSurface,
    matchScore: baseColors.gold_accent,
    vibeIndicator: premiumDark.accentPrimary,
    capacityGood: baseColors.success,
    capacityWarning: baseColors.warning,
    capacityFull: baseColors.error,
    tagSelected: premiumDark.accentPrimary,
    tagUnselected: premiumDark.secondarySurface,
    tagBorder: premiumDark.secondaryBorder,
    emptyStateIcon: baseColors.mutedGray,
    emptyStateText: premiumDark.tertiaryText,
    countdownWarning: baseColors.warning,
    statusForming: premiumDark.accentPrimary,
    statusActive: baseColors.gold_accent,
    statusConfirmed: baseColors.success,
    statusExpired: baseColors.mutedGray,
    // Squad forming detail colors
    formingHeaderTitle: premiumDark.primaryText,
    formingStatusLive: premiumDark.successPrimary,
    formingStatusWaiting: premiumDark.secondaryText,
    formingStatusDot: premiumDark.successPrimary,
    formingSectionDivider: premiumDark.separator,
    formingCardBackground: premiumDark.secondarySurface,
    formingCardBorder: premiumDark.primaryBorder,
    formingCardShadow: 'rgba(0, 0, 0, 0.4)',
    formingCodeLabel: premiumDark.secondaryText,
    formingCodeText: premiumDark.accentPrimary,
    formingCodeHint: premiumDark.secondaryText,
    formingShareButtonBg: premiumDark.primarySurface,
    formingShareButtonBorder: premiumDark.primaryBorder,
    formingShareButtonText: premiumDark.primaryText,
    formingMemberCardBg: premiumDark.primarySurface,
    formingMemberCardBorder: premiumDark.primaryBorder,
    formingMemberName: premiumDark.primaryText,
    formingMemberMeta: premiumDark.secondaryText,
    formingMemberStatusReady: premiumDark.successPrimary,
    formingMemberStatusPending: premiumDark.secondaryText,
    formingMemberBadgeBg: premiumDark.accentSurface,
    formingMemberBadgeText: premiumDark.accentPrimary,
    formingWaitingCardBg: premiumDark.secondarySurface,
    formingWaitingCardBorder: premiumDark.primaryBorder,
    formingWaitingText: premiumDark.secondaryText,
    formingActionButtonBg: premiumDark.primarySurface,
    formingActionButtonBorder: premiumDark.primaryBorder,
    formingActionButtonText: premiumDark.primaryText,
    formingActionSubtext: premiumDark.secondaryText,
    // Squad recommendation detail colors
    recommendationBackground: premiumDark.primaryBackground,
    recommendationSurface: premiumDark.primarySurface,
    recommendationCard: premiumDark.secondarySurface,
    recommendationBorder: premiumDark.primaryBorder,
    recommendationDivider: premiumDark.separator,
    recommendationLabel: premiumDark.secondaryText,
    recommendationRoundPillBg: premiumDark.accentSurface,
    recommendationRoundPillText: premiumDark.accentPrimary,
    recommendationMatchBadgeBg: premiumDark.hotSurface,
    recommendationMatchBadgeText: premiumDark.hotPrimary,
    recommendationReasonChipBg: premiumDark.accentSurface,
    recommendationReasonChipText: premiumDark.accentPrimary,
    recommendationStatusChipBorder: premiumDark.secondaryBorder,
    recommendationQualityBackground: premiumDark.secondarySurface,
    recommendationWarningBg: premiumDark.hotSurface,
    recommendationWarningBorder: premiumDark.hotBorder,
    recommendationWarningText: premiumDark.hotPrimary,
    recommendationPrimaryActionBg: premiumDark.primarySurface,
    recommendationPrimaryActionText: premiumDark.primaryText,
    recommendationSecondaryActionBorder: premiumDark.secondaryBorder,
    recommendationVetoBg: premiumDark.hotSurface,
    recommendationVetoBorder: premiumDark.hotBorder,
    recommendationVetoText: premiumDark.hotPrimary,
    recommendationAltCardBg: premiumDark.primarySurface,
    recommendationAltBadgeBg: premiumDark.secondarySurface,
    recommendationAltBadgeText: premiumDark.secondaryText,
    // Squad confirmation detail colors
    confirmHeroIconBg: premiumDark.successSurface,
    confirmHeroIconBorder: premiumDark.successBorder,
    confirmHeroLabel: premiumDark.successPrimary,
    confirmCardBackground: premiumDark.lightGreenBG,
    confirmCardBorder: premiumDark.successBorder,
    confirmBadgeBackground: premiumDark.successSurface,
    confirmBadgeText: premiumDark.successPrimary,
    confirmBadgeIcon: premiumDark.successPrimary,
    confirmMetaText: premiumDark.secondaryText,
    confirmPrimaryButtonBg: premiumDark.successPrimary,
    confirmPrimaryButtonText: premiumDark.primaryText,
    confirmSecondaryButtonBg: premiumDark.primarySurface,
    confirmSecondaryButtonBorder: premiumDark.accentBorder,
    confirmSecondaryButtonText: premiumDark.primaryText,
    confirmMemberCountBg: premiumDark.accentSurface,
    confirmMemberCountText: premiumDark.accentPrimary,
    confirmTipCardBackground: premiumDark.secondaryBackground,
    confirmTipCardBorder: premiumDark.primaryBorder,
    confirmTipBadgeBg: premiumDark.accentSurface,
    confirmTipBadgeText: premiumDark.accentPrimary,
    confirmTipNumberBg: premiumDark.accentSurface,
    confirmTipNumberText: premiumDark.accentPrimary,
    confirmationDevider: premiumDark.accentPrimary,
    // NEW: Venue tags and metadata
    recommendationTagBg: premiumDark.accentSurface,
    recommendationTagBorder: premiumDark.accentBorder,
    recommendationTagText: premiumDark.accentPrimary,
  },

  // Venue Claim Onboarding
  VenueClaim: {
    background: baseColors.newBackGroundColor,
    surface: baseColors.darkGray,
    surfaceVariant: baseColors.gray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    textMuted: baseColors.mutedWhite,
    textGray: baseColors.textGray,
    lightTextGray: baseColors.lightTextGray,
    primary: baseColors.gold_accent,
    primaryMuted: 'rgba(212, 175, 55, 0.12)',
    accent: baseColors.gold_accent,
    border: baseColors.mediumGray,
    borderLight: 'rgba(255,255,255,0.06)',
    borderGold: 'rgba(212,175,55,0.15)',
    inputBackground: baseColors.gray,
    inputBorder: 'rgba(255,255,255,0.08)',
    success: baseColors.success,
    error: baseColors.error,
    warning: baseColors.warning,
    cardBackground: 'rgba(255,255,255,0.04)',
    disabledOpacity: 0.4,
    mutedGray: baseColors.mutedGray,
    black: baseColors.black,
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

  // Account Screen (Hub, Edit Profile, My Interests, Buy Minutes, Transactions)
  Account: {
    background: premiumDark.primaryBackground,
    secondaryBackground: premiumDark.secondaryBackground,
    surface: premiumDark.primarySurface,
    secondarySurface: premiumDark.secondarySurface,
    tertiarySurface: premiumDark.tertiarySurface,

    text: premiumDark.primaryText,
    textSecondary: premiumDark.secondaryText,
    textMuted: premiumDark.tertiaryText,

    accent: premiumDark.accentPrimary,
    accentSurface: premiumDark.accentSurface,
    accentBorder: premiumDark.accentBorder,
    accentSubtle: premiumDark.accentSubtle,

    border: premiumDark.primaryBorder,
    borderLight: premiumDark.secondaryBorder,
    separator: premiumDark.separator,

    success: premiumDark.successPrimary,
    successSurface: premiumDark.successSurface,
    successBorder: premiumDark.successBorder,

    hot: premiumDark.hotPrimary,
    hotSurface: premiumDark.hotSurface,
    hotBorder: premiumDark.hotBorder,

    // Gauge (minutes circle)
    gaugeTrack: premiumDark.secondarySurface,
    gaugeActive: '#D4952B', // amber/orange for gauge arc
    gaugeText: premiumDark.primaryText,

    // Badge colors
    badgeBackground: premiumDark.hotSurface,
    badgeBorder: premiumDark.hotBorder,
    badgeText: premiumDark.hotPrimary,

    // Input fields
    inputBackground: premiumDark.secondaryBackground,
    inputBorder: premiumDark.primaryBorder,
    inputFocusBorder: premiumDark.accentBorder,
    inputText: premiumDark.primaryText,
    inputLabel: premiumDark.tertiaryText,

    // Buttons
    primaryButton: premiumDark.accentPrimary,
    primaryButtonText: premiumDark.primaryText,
    secondaryButton: premiumDark.secondaryBackground,
    secondaryButtonBorder: premiumDark.primaryBorder,
    secondaryButtonText: premiumDark.primaryText,
    destructiveText: premiumDark.hotPrimary,

    // Interest chips
    chipSelected: premiumDark.accentSurface,
    chipSelectedBorder: premiumDark.accentBorder,
    chipSelectedText: premiumDark.accentPrimary,
    chipUnselected: premiumDark.secondaryBackground,
    chipUnselectedBorder: premiumDark.primaryBorder,
    chipUnselectedText: premiumDark.secondaryText,

    // Section labels
    sectionLabel: premiumDark.accentPrimary,

    // Online indicator
    onlineGreen: premiumDark.successPrimary,
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
