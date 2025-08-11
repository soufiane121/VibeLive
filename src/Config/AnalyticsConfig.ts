/**
 * Analytics Configuration
 * 
 * This file controls which analytics service implementation to use:
 * - Mock Analytics Service: Lightweight, no native dependencies, development-friendly
 * - Full Analytics Service: Complete implementation with real device data and offline storage
 * 
 * Toggle the USE_MOCK_ANALYTICS flag to switch between implementations
 */

// =============================================================================
// ANALYTICS SERVICE CONFIGURATION
// =============================================================================

/**
 * Set to true to use Mock Analytics Service (recommended for development)
 * Set to false to use Full Analytics Service (recommended for production)
 */
export const USE_MOCK_ANALYTICS = false;

/**
 * Analytics Service Configuration Options
 */
export const ANALYTICS_CONFIG = {
  // Service Selection
  useMockService: USE_MOCK_ANALYTICS,
  
  // Mock Service Settings
  mock: {
    enableConsoleLogging: true,
    mockSessionPrefix: 'mock-session-',
    mockDeviceId: 'mock-device-id',
    simulateNetworkDelay: false,
    delayMs: 1000,
  },
  
  // Full Service Settings
  full: {
    enableConsoleLogging: __DEV__, // Only log in development
    enableOfflineStorage: true,
    enableLocationTracking: true,
    enableDeviceInfoCollection: true,
    enableNetworkMonitoring: true,
    batchSize: 10,
    flushIntervalMs: 30000, // 30 seconds
    maxRetries: 3,
    retryDelayMs: 5000,
  },
  
  // Backend Configuration
  backend: {
    baseUrl: '', // Set your backend URL here
    endpoints: {
      trackEvent: '/analytics/track-event',
      trackBatch: '/analytics/track-events-batch',
      sessionStart: '/analytics/track-session-start',
      sessionEnd: '/analytics/track-session-end',
    },
    timeout: 10000, // 10 seconds
  },
  
  // Event Categories
  categories: {
    userEngagement: 'user_engagement',
    streamInteraction: 'stream_interaction',
    monetization: 'monetization',
    social: 'social',
    technical: 'technical',
  },
  
  // Critical Events (always flush immediately)
  criticalEvents: [
    'app_crashed',
    'payment_completed',
    'stream_started',
    'boost_purchased',
    'error_occurred',
  ],
};

/**
 * Environment-based Configuration
 * Automatically adjusts settings based on development/production environment
 */
export const getEnvironmentConfig = () => {
  const isDevelopment = __DEV__;
  
  return {
    ...ANALYTICS_CONFIG,
    useMockService: isDevelopment ? true : USE_MOCK_ANALYTICS,
    mock: {
      ...ANALYTICS_CONFIG.mock,
      enableConsoleLogging: isDevelopment,
    },
    full: {
      ...ANALYTICS_CONFIG.full,
      enableConsoleLogging: isDevelopment,
    },
  };
};

/**
 * Service Status Information
 */
export const getServiceInfo = () => {
  const config = getEnvironmentConfig();
  
  return {
    serviceType: config.useMockService ? 'Mock Analytics Service' : 'Full Analytics Service',
    environment: __DEV__ ? 'Development' : 'Production',
    features: {
      realDeviceInfo: !config.useMockService,
      locationTracking: !config.useMockService && config.full.enableLocationTracking,
      offlineStorage: !config.useMockService && config.full.enableOfflineStorage,
      networkMonitoring: !config.useMockService && config.full.enableNetworkMonitoring,
      consoleLogging: config.useMockService ? config.mock.enableConsoleLogging : config.full.enableConsoleLogging,
    },
    limitations: config.useMockService ? [
      'Mock device information',
      'No location data',
      'No offline persistence',
      'Console logging only',
    ] : [
      'Requires native dependencies',
      'May cause app registration issues if not properly configured',
    ],
  };
};

/**
 * Development Helpers
 */
export const AnalyticsDebug = {
  /**
   * Print current analytics configuration to console
   */
  printConfig: () => {
    const info = getServiceInfo();
    console.log('📊 Analytics Configuration:', {
      serviceType: info.serviceType,
      environment: info.environment,
      features: info.features,
      limitations: info.limitations,
    });
  },
  
  /**
   * Switch to Mock Analytics Service (development only)
   */
  enableMockService: () => {
    if (__DEV__) {
      console.log('📊 Switching to Mock Analytics Service...');
      // Note: This requires app restart to take effect
      console.log('⚠️ Please restart the app for changes to take effect');
    } else {
      console.warn('📊 Cannot switch analytics service in production');
    }
  },
  
  /**
   * Switch to Full Analytics Service (development only)
   */
  enableFullService: () => {
    if (__DEV__) {
      console.log('📊 Switching to Full Analytics Service...');
      console.log('⚠️ Make sure all native dependencies are properly installed');
      console.log('⚠️ Please restart the app for changes to take effect');
    } else {
      console.warn('📊 Cannot switch analytics service in production');
    }
  },
};

export default ANALYTICS_CONFIG;
