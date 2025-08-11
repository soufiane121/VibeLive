// Full Analytics Service - Complete implementation with native dependencies
// This provides real device data, location tracking, and offline storage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';
import Geolocation from '@react-native-community/geolocation';
import { v4 as uuidv4 } from 'uuid';
import { ANALYTICS_CONFIG } from '../Config/AnalyticsConfig';

// Import types from the base service
import type { AnalyticsEvent, SessionInfo, DeviceInfo as DeviceInfoType, UserContext } from './AnalyticsService';

class FullAnalyticsService {
  private static instance: FullAnalyticsService;
  private sessionId: string = '';
  private sessionStartTime: Date = new Date();
  private deviceInfo: DeviceInfoType | null = null;
  private userContext: UserContext = {
    isStreaming: false,
    isWatching: false,
    userTier: 'free'
  };
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline: boolean = true;
  private baseURL: string = '';
  private authToken: string = '';
  private batchSize: number = ANALYTICS_CONFIG.full.batchSize;
  private flushInterval: number = ANALYTICS_CONFIG.full.flushIntervalMs;
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): FullAnalyticsService {
    if (!FullAnalyticsService.instance) {
      FullAnalyticsService.instance = new FullAnalyticsService();
    }
    return FullAnalyticsService.instance;
  }

  // Initialize the analytics service
  private async initializeService(): Promise<void> {
    try {
      // Generate session ID
      this.sessionId = uuidv4();
      this.sessionStartTime = new Date();

      // Get device info
      this.deviceInfo = await this.getDeviceInfo();

      // Monitor network status
      if (ANALYTICS_CONFIG.full.enableNetworkMonitoring) {
        NetInfo.addEventListener(state => {
          this.isOnline = state.isConnected || false;
          if (this.isOnline && this.eventQueue.length > 0) {
            this.flushEvents();
          }
        });
      }

      // Start periodic flush
      this.startPeriodicFlush();

      // Load queued events from storage
      if (ANALYTICS_CONFIG.full.enableOfflineStorage) {
        await this.loadQueuedEvents();
      }

      if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
        console.log('📊 Full Analytics Service initialized', {
          sessionId: this.sessionId,
          deviceInfo: this.deviceInfo
        });
      }

    } catch (error) {
      console.error('Failed to initialize Full Analytics Service:', error);
    }
  }

  // Configure analytics service
  public configure(baseURL: string, authToken: string): void {
    this.baseURL = baseURL;
    this.authToken = authToken;
    if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
      console.log('📊 Full Analytics configured:', { baseURL, hasToken: !!authToken });
    }
  }

  // Update user context
  public updateUserContext(context: Partial<UserContext>): void {
    this.userContext = { ...this.userContext, ...context };
    if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
      console.log('📊 User context updated:', this.userContext);
    }
  }

  // Track single event
  public async trackEvent(
    eventType: string,
    eventData: Record<string, any> = {},
    eventCategory?: string
  ): Promise<void> {
    try {
      const coordinates = ANALYTICS_CONFIG.full.enableLocationTracking 
        ? await this.getCurrentLocation() 
        : undefined;
      
      const event: AnalyticsEvent = {
        eventType,
        eventCategory: eventCategory || this.categorizeEvent(eventType),
        eventData: {
          ...eventData,
          deviceInfo: this.deviceInfo,
          userContext: this.userContext,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date(),
        coordinates: await this.getCurrentLocation()
      };

      // Add to queue
      this.eventQueue.push(event);

      // Immediate flush for critical events
      if (ANALYTICS_CONFIG.criticalEvents.includes(eventType) && this.isOnline) {
        await this.flushEvents();
      } else if (this.eventQueue.length >= this.batchSize) {
        await this.flushEvents();
      }

      // Save to storage for offline persistence
      if (ANALYTICS_CONFIG.full.enableOfflineStorage) {
        await this.saveQueuedEvents();
      }

      if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
        console.log('📊 Full Analytics Event Tracked:', {
          eventType,
          eventCategory: eventCategory || this.categorizeEvent(eventType),
          eventData
        });
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
      if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
        console.log('📊 Full Analytics Batch Events Tracked:', events.length);
      }
    } catch (error) {
      console.error('Failed to track batch events:', error);
    }
  }

  // Track session start
  public async trackSessionStart(): Promise<void> {
    try {
      const coordinates = ANALYTICS_CONFIG.full.enableLocationTracking 
        ? await this.getCurrentLocation() 
        : undefined;
      
      await this.trackEvent('session_started', {
        sessionId: this.sessionId,
        sessionStartTime: this.sessionStartTime.toISOString(),
        deviceInfo: this.deviceInfo,
        coordinates
      }, 'user_engagement');

      // Send session start to backend
      if (this.isOnline) {
        await this.sendSessionStart();
      }

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
        sessionEndTime: new Date().toISOString()
      }, 'user_engagement');

      // Flush all remaining events
      await this.flushEvents();

      // Send session end to backend
      if (this.isOnline) {
        await this.sendSessionEnd(sessionDuration);
      }

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
    await this.trackEvent('screen_viewed', {
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
    if (this.eventQueue.length === 0 || !this.isOnline || !this.authToken) {
      return;
    }

    try {
      const eventsToSend = [...this.eventQueue];
      this.eventQueue = [];

      const response = await fetch(`${this.baseURL}${ANALYTICS_CONFIG.backend.endpoints.trackBatch}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          events: eventsToSend.map(event => ({
            eventType: event.eventType,
            eventCategory: event.eventCategory,
            eventData: event.eventData,
            timestamp: event.timestamp?.toISOString()
          })),
          sessionId: this.sessionId,
          deviceInfo: this.deviceInfo
        }),
        timeout: ANALYTICS_CONFIG.backend.timeout
      });

      if (!response.ok) {
        // Re-add events to queue if failed
        this.eventQueue.unshift(...eventsToSend);
        throw new Error(`Analytics API error: ${response.status}`);
      }

      if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
        console.log(`📊 Successfully sent ${eventsToSend.length} analytics events to backend`);
      }

    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Events are already back in queue, will retry later
    }
  }

  // Send session start to backend
  private async sendSessionStart(): Promise<void> {
    try {
      const coordinates = ANALYTICS_CONFIG.full.enableLocationTracking 
        ? await this.getCurrentLocation() 
        : undefined;
      
      const response = await fetch(`${this.baseURL}${ANALYTICS_CONFIG.backend.endpoints.sessionStart}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          deviceInfo: this.deviceInfo,
          coordinates
        }),
        timeout: ANALYTICS_CONFIG.backend.timeout
      });

      if (!response.ok) {
        throw new Error(`Session start API error: ${response.status}`);
      }

    } catch (error) {
      console.error('Failed to send session start:', error);
    }
  }

  // Send session end to backend
  private async sendSessionEnd(sessionDuration: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}${ANALYTICS_CONFIG.backend.endpoints.sessionEnd}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          sessionDuration: Math.floor(sessionDuration / 1000),
          totalWatchTime: this.userContext.totalWatchTime || 0,
          streamsWatched: this.userContext.totalStreams || 0
        }),
        timeout: ANALYTICS_CONFIG.backend.timeout
      });

      if (!response.ok) {
        throw new Error(`Session end API error: ${response.status}`);
      }

    } catch (error) {
      console.error('Failed to send session end:', error);
    }
  }

  // Get device information
  private async getDeviceInfo(): Promise<DeviceInfoType> {
    try {
      const [
        deviceModel,
        systemVersion,
        appVersion,
        deviceId,
        screenData
      ] = await Promise.all([
        DeviceInfo.getModel(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getVersion(),
        DeviceInfo.getUniqueId(),
        DeviceInfo.getDeviceType()
      ]);

      const netInfo = await NetInfo.fetch();

      return {
        platform: Platform.OS,
        osVersion: systemVersion,
        appVersion,
        deviceModel,
        screenSize: `${screenData}`,
        networkType: netInfo.type || 'unknown',
        deviceId
      };

    } catch (error) {
      console.error('Failed to get device info:', error);
      return {
        platform: Platform.OS,
        osVersion: 'unknown',
        appVersion: 'unknown',
        deviceModel: 'unknown',
        screenSize: 'unknown',
        networkType: 'unknown',
        deviceId: 'unknown'
      };
    }
  }

  // Get current location
  private async getCurrentLocation(): Promise<[number, number] | undefined> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.warn('Failed to get location:', error);
          resolve(undefined);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  // Categorize events
  private categorizeEvent(eventType: string): string {
    const categories: Record<string, string[]> = {
      [ANALYTICS_CONFIG.categories.userEngagement]: [
        'app_opened', 'app_closed', 'app_backgrounded', 'app_foregrounded',
        'map_marker_clicked', 'map_moved', 'map_zoomed', 'location_changed',
        'screen_viewed', 'category_filter_applied', 'search_performed'
      ],
      [ANALYTICS_CONFIG.categories.streamInteraction]: [
        'stream_discovered', 'stream_preview_viewed', 'stream_joined', 'stream_left',
        'stream_watched', 'go_live_started', 'stream_started', 'stream_ended',
        'viewer_count_updated'
      ],
      [ANALYTICS_CONFIG.categories.monetization]: [
        'boost_intro_viewed', 'boost_tier_selected', 'boost_purchased', 'boost_activated',
        'boost_skipped', 'payment_initiated', 'payment_completed', 'payment_failed',
        'payment_cancelled'
      ],
      [ANALYTICS_CONFIG.categories.social]: [
        'message_sent', 'reaction_sent', 'emoji_used', 'user_followed', 'user_unfollowed'
      ],
      [ANALYTICS_CONFIG.categories.technical]: [
        'error_occurred', 'crash_reported', 'network_error', 'permission_denied'
      ]
    };

    for (const [category, events] of Object.entries(categories)) {
      if (events.includes(eventType)) {
        return category;
      }
    }

    return ANALYTICS_CONFIG.categories.userEngagement;
  }

  // Start periodic flush
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0 && this.isOnline) {
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

  // Save queued events to storage
  private async saveQueuedEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem('analytics_queue', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Failed to save queued events:', error);
    }
  }

  // Load queued events from storage
  private async loadQueuedEvents(): Promise<void> {
    try {
      const queuedEvents = await AsyncStorage.getItem('analytics_queue');
      if (queuedEvents) {
        this.eventQueue = JSON.parse(queuedEvents);
        await AsyncStorage.removeItem('analytics_queue');
      }
    } catch (error) {
      console.error('Failed to load queued events:', error);
    }
  }

  // Cleanup
  public cleanup(): void {
    this.stopPeriodicFlush();
  }
}

export default FullAnalyticsService;
