// Mock Analytics Service - Lightweight version without native dependencies
// This prevents app registration errors while maintaining analytics API compatibility
import { Platform } from 'react-native';

// Types for analytics events
export interface AnalyticsEvent {
  eventType: string;
  eventCategory?: string;
  eventData?: Record<string, any>;
  timestamp?: Date;
  coordinates?: [number, number]; // [longitude, latitude]
}

export interface SessionInfo {
  sessionId: string;
  sessionStartTime: Date;
  deviceInfo: DeviceInfo;
  userContext: UserContext;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  screenSize: string;
  networkType: string;
  deviceId: string;
}

export interface UserContext {
  isStreaming: boolean;
  isWatching: boolean;
  currentLocation?: string;
  userTier: string;
  accountAge?: number;
  totalStreams?: number;
  totalWatchTime?: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string = '';
  private sessionStartTime: Date = new Date();
  private deviceInfo: DeviceInfo | null = null;
  private userContext: UserContext = {
    isStreaming: false,
    isWatching: false,
    userTier: 'free'
  };
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline: boolean = true;
  private baseURL: string = '';
  private authToken: string = '';
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Initialize the analytics service
  private async initializeService(): Promise<void> {
    try {
      // Generate session ID (mock version)
      this.sessionId = 'mock-session-' + Date.now();
      this.sessionStartTime = new Date();

      // Get device info
      this.deviceInfo = await this.getDeviceInfo();

      // Start periodic flush
      this.startPeriodicFlush();

      console.log('📊 Mock Analytics Service initialized', {
        sessionId: this.sessionId,
        deviceInfo: this.deviceInfo
      });

    } catch (error) {
      console.error('Failed to initialize Analytics Service:', error);
    }
  }

  // Configure analytics service
  public configure(baseURL: string, authToken: string): void {
    this.baseURL = baseURL;
    this.authToken = authToken;
    console.log('📊 Analytics configured:', { baseURL, hasToken: !!authToken });
  }

  // Update user context
  public updateUserContext(context: Partial<UserContext>): void {
    this.userContext = { ...this.userContext, ...context };
    console.log('📊 User context updated:', this.userContext);
  }

  // Track single event
  public async trackEvent(
    eventType: string,
    eventData: Record<string, any> = {},
    eventCategory?: string
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        eventType,
        eventCategory: eventCategory || this.categorizeEvent(eventType),
        eventData: {
          ...eventData,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      };

      // Add to queue
      this.eventQueue.push(event);

      console.log('📊 Analytics Event Tracked:', {
        eventType,
        eventCategory: eventCategory || this.categorizeEvent(eventType),
        eventData
      });

      // Auto-flush if queue is full
      if (this.eventQueue.length >= this.batchSize) {
        await this.flushEvents();
      }

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track multiple events in batch
  public async trackEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      this.eventQueue.push(...events);
      await this.flushEvents();
      console.log('📊 Analytics Batch Events Tracked:', events.length);
    } catch (error) {
      console.error('Failed to track batch events:', error);
    }
  }

  // Track session start
  public async trackSessionStart(): Promise<void> {
    try {
      await this.trackEvent('session_started', {
        sessionId: this.sessionId,
        deviceInfo: this.deviceInfo,
        userContext: this.userContext
      }, 'user_engagement');
    } catch (error) {
      console.error('Failed to track session start:', error);
    }
  }

  // Track session end
  public async trackSessionEnd(): Promise<void> {
    try {
      const sessionDuration = Date.now() - this.sessionStartTime.getTime();
      
      await this.trackEvent('session_ended', {
        sessionId: this.sessionId,
        sessionDuration: Math.floor(sessionDuration / 1000),
        eventsTracked: this.eventQueue.length
      }, 'user_engagement');

      // Final flush before ending session
      await this.flushEvents();
    } catch (error) {
      console.error('Failed to track session end:', error);
    }
  }

  // Track map interactions
  public async trackMapInteraction(
    interactionType: 'marker_clicked' | 'map_moved' | 'map_zoomed',
    data: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(`map_${interactionType}`, data, 'user_engagement');
  }

  // Track stream interactions
  public async trackStreamInteraction(
    action: 'join' | 'leave' | 'watch' | 'preview',
    streamData: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(`stream_${action}`, streamData, 'stream_interaction');
  }

  // Track social interactions
  public async trackSocialInteraction(
    interactionType: 'message_sent' | 'reaction_sent' | 'user_followed',
    data: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(`social_${interactionType}`, data, 'social');
  }

  // Track boost events
  public async trackBoostEvent(
    eventType: 'boost_intro_viewed' | 'boost_tier_selected' | 'boost_purchased' | 'boost_activated' | 'boost_skipped',
    data: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(eventType, data, 'monetization');
  }

  // Track payment events
  public async trackPaymentEvent(
    eventType: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'payment_cancelled',
    data: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(eventType, data, 'monetization');
  }

  // Track errors
  public async trackError(
    errorType: 'error_occurred' | 'crash_reported' | 'network_error' | 'permission_denied',
    errorData: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(errorType, errorData, 'technical');
  }

  // Track screen views
  public async trackScreenView(screenName: string, duration?: number): Promise<void> {
    await this.trackEvent('app_opened', {
      screenName,
      duration,
      timestamp: new Date().toISOString()
    }, 'user_engagement');
  }

  // Track location changes
  public async trackLocationChange(coordinates: [number, number], accuracy?: number): Promise<void> {
    await this.trackEvent('location_changed', {
      coordinates,
      accuracy,
      timestamp: new Date().toISOString()
    }, 'user_engagement');
  }

  // Flush events to backend
  public async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    try {
      const eventsToSend = [...this.eventQueue];
      this.eventQueue = [];

      console.log('📊 Analytics Events Flushed:', {
        count: eventsToSend.length,
        events: eventsToSend.map(e => ({
          type: e.eventType,
          category: e.eventCategory,
          timestamp: e.timestamp
        }))
      });

      // Mock API call - replace with actual backend call when ready
      if (this.baseURL && this.authToken) {
        console.log('📊 Would send to backend:', `${this.baseURL}/analytics/track-events-batch`);
      }

    } catch (error) {
      console.error('Failed to flush events:', error);
    }
  }

  // Get device information (mock version)
  private async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      platform: Platform.OS,
      osVersion: 'mock',
      appVersion: '1.0.0',
      deviceModel: 'mock-device',
      screenSize: 'unknown',
      networkType: 'wifi',
      deviceId: 'mock-device-id'
    };
  }

  // Get current location (mock version)
  private async getCurrentLocation(): Promise<[number, number] | undefined> {
    // Mock location - replace with actual location when available
    return undefined;
  }

  // Categorize events
  private categorizeEvent(eventType: string): string {
    const categories: Record<string, string[]> = {
      'user_engagement': [
        'app_opened', 'app_closed', 'app_backgrounded', 'app_foregrounded',
        'map_marker_clicked', 'map_moved', 'map_zoomed', 'location_changed',
        'screen_viewed', 'category_filter_applied', 'search_performed'
      ],
      'stream_interaction': [
        'stream_discovered', 'stream_preview_viewed', 'stream_joined', 'stream_left',
        'stream_watched', 'go_live_started', 'stream_started', 'stream_ended',
        'viewer_count_updated'
      ],
      'monetization': [
        'boost_intro_viewed', 'boost_tier_selected', 'boost_purchased', 'boost_activated',
        'boost_skipped', 'payment_initiated', 'payment_completed', 'payment_failed',
        'payment_cancelled'
      ],
      'social': [
        'message_sent', 'reaction_sent', 'emoji_used', 'user_followed', 'user_unfollowed'
      ],
      'technical': [
        'error_occurred', 'crash_reported', 'network_error', 'permission_denied'
      ]
    };

    for (const [category, events] of Object.entries(categories)) {
      if (events.includes(eventType)) {
        return category;
      }
    }

    return 'user_engagement';
  }

  // Start periodic flush
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  // Stop periodic flush
  private stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // Cleanup
  public cleanup(): void {
    this.stopPeriodicFlush();
  }
}

export default AnalyticsService;
