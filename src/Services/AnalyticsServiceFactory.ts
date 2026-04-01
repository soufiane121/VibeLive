/**
 * Analytics Service Factory
 * 
 * This factory creates the appropriate analytics service based on the configuration flag.
 * It provides a unified interface that switches between Mock and Full implementations.
 */

import { USE_MOCK_ANALYTICS, getEnvironmentConfig, getServiceInfo } from '../Config/AnalyticsConfig';
import MockAnalyticsService from './AnalyticsService'; // Mock version
import RTKAnalyticsService from './RTKAnalyticsService'; // RTK Query version

// Common Analytics Interface
export interface IAnalyticsService {
  trackEvent(eventType: string, eventData?: Record<string, any>, eventCategory?: string): Promise<void>;
  trackMapInteraction(interactionType: 'marker_clicked' | 'map_moved' | 'map_zoomed', data: Record<string, any>): Promise<void>;
  trackStreamInteraction(action: 'join' | 'leave' | 'watch' | 'preview', streamData: Record<string, any>): Promise<void>;
  trackSocialInteraction(interactionType: 'message_sent' | 'reaction_sent' | 'user_followed', data: Record<string, any>): Promise<void>;
  trackBoostEvent(eventType: 'boost_intro_viewed' | 'boost_tier_selected' | 'boost_purchased' | 'boost_activated' | 'boost_skipped', data: Record<string, any>): Promise<void>;
  trackPaymentEvent(eventType: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'payment_cancelled', data: Record<string, any>): Promise<void>;
  trackError(errorType: 'error_occurred' | 'crash_reported' | 'network_error' | 'permission_denied', errorData: Record<string, any>): Promise<void>;
  trackScreenView(screenName: string, duration?: number): Promise<void>;
  trackLocationChange(coordinates: [number, number], accuracy?: number): Promise<void>;
  trackSessionStart(): Promise<void>;
  trackSessionEnd(): Promise<void>;
  updateUserContext(context: any): void;
  configure(baseURL: string, authToken: string): void;
}

// Types
export type AnalyticsServiceInstance = IAnalyticsService;

/**
 * Analytics Service Factory
 * Creates and manages the analytics service instance based on configuration
 */
class AnalyticsServiceFactory {
  private static instance: AnalyticsServiceInstance | null = null;
  private static serviceType: 'mock' | 'full' | 'rtk' | null = null;

  /**
   * Get the analytics service instance
   * Automatically creates the appropriate service based on configuration
   */
  public static getInstance(): AnalyticsServiceInstance {
    const config = getEnvironmentConfig();
    const currentServiceType = USE_MOCK_ANALYTICS ? 'mock' : 'full';

    // Create new instance if none exists or service type changed
    if (!this.instance || this.serviceType !== currentServiceType) {
      this.serviceType = currentServiceType;
      
      if (USE_MOCK_ANALYTICS) {
        console.log('📊 Creating Mock Analytics Service...');
        this.instance = MockAnalyticsService.getInstance();
        this.serviceType = 'mock';
      } else {
        console.log('📊 Creating RTK Analytics Service...');
        try {
          this.instance = RTKAnalyticsService.getInstance();
          this.serviceType = 'rtk';
          console.log('📊 RTK Analytics Service created successfully');
        } catch (error) {
          console.error('❌ Failed to create RTK Analytics Service, falling back to Mock:', error);
          
          // Fallback to mock service
          this.instance = MockAnalyticsService.getInstance();
          this.serviceType = 'mock';
        }
      }

      // Log service information
      const serviceInfo = getServiceInfo();
      console.log('📊 Analytics Service Ready:', {
        type: serviceInfo.serviceType,
        environment: serviceInfo.environment,
        features: serviceInfo.features,
      });

      if (serviceInfo.limitations.length > 0) {
        console.warn('⚠️ Service Limitations:', serviceInfo.limitations);
      }
    }

    return this.instance;
  }

  /**
   * Get current service type
   */
  public static getServiceType(): 'mock' | 'full' | 'rtk' | null {
    return this.serviceType;
  }

  /**
   * Check if using mock service
   */
  public static isMockService(): boolean {
    return this.serviceType === 'mock';
  }

  /**
   * Check if using full service
   */
  public static isFullService(): boolean {
    return this.serviceType === 'full';
  }

  /**
   * Force recreation of service instance (useful for testing)
   */
  public static reset(): void {
    this.instance = null;
    this.serviceType = null;
    console.log('📊 Analytics Service Factory reset');
  }

  /**
   * Get service status and configuration info
   */
  public static getStatus() {
    const config = getEnvironmentConfig();
    const serviceInfo = getServiceInfo();
    
    return {
      isInitialized: this.instance !== null,
      serviceType: this.serviceType,
      configuredService: USE_MOCK_ANALYTICS ? 'mock' : 'full',
      environment: serviceInfo.environment,
      features: serviceInfo.features,
      limitations: serviceInfo.limitations,
      configuration: {
        useMockService: USE_MOCK_ANALYTICS,
        enableConsoleLogging: USE_MOCK_ANALYTICS 
          ? config.mock.enableConsoleLogging 
          : config.full.enableConsoleLogging,
        batchSize: USE_MOCK_ANALYTICS ? 10 : config.full.batchSize,
        flushInterval: USE_MOCK_ANALYTICS ? 30000 : config.full.flushIntervalMs,
      }
    };
  }
}

/**
 * Convenience function to get analytics service instance
 * This is the main export that should be used throughout the app
 */
export const getAnalyticsService = (): AnalyticsServiceInstance => {
  return AnalyticsServiceFactory.getInstance();
};

/**
 * Development helpers
 */
export const AnalyticsServiceDebug = {
  /**
   * Print current service status
   */
  printStatus: () => {
    const status = AnalyticsServiceFactory.getStatus();
    console.log('📊 Analytics Service Status:', status);
  },

  /**
   * Get service information
   */
  getInfo: () => {
    return AnalyticsServiceFactory.getStatus();
  },

  /**
   * Reset service (forces recreation)
   */
  reset: () => {
    AnalyticsServiceFactory.reset();
  },

  /**
   * Test service switching (development only)
   */
  testServiceSwitching: () => {
    if (__DEV__) {
      console.log('📊 Testing Analytics Service Switching...');
      console.log('Current service:', AnalyticsServiceFactory.getServiceType());
      
      // Reset to force recreation
      AnalyticsServiceFactory.reset();
      
      // Get new instance
      const service = AnalyticsServiceFactory.getInstance();
      console.log('New service type:', AnalyticsServiceFactory.getServiceType());
      
      return service;
    } else {
      console.warn('📊 Service switching test only available in development');
    }
  },
};

export default AnalyticsServiceFactory;
