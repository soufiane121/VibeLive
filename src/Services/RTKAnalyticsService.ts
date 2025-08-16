import { Platform } from 'react-native';
import { analyticsApi } from './AnalyticsApi';
import { ANALYTICS_CONFIG } from '../Config/AnalyticsConfig';
import { 
  AnalyticsEventType, 
  AnalyticsEventCategory, 
  getEventCategory, 
  CRITICAL_EVENTS,
  MapInteractionType,
  StreamAction,
  SocialInteractionType,
  BoostEventType,
  PaymentEventType,
  ErrorType
} from '../types/AnalyticsEnums';

// Import types
import type { AnalyticsEvent, SessionInfo, DeviceInfo as DeviceInfoType, UserContext } from './AnalyticsService';

// RTK Query Analytics Service - Uses RTK Query for all network requests
class RTKAnalyticsService {
  private static instance: RTKAnalyticsService;
  private sessionId: string = '';
  private sessionStartTime: Date = new Date();
  private deviceInfo: DeviceInfoType | null = null;
  private userContext: UserContext = {
    isStreaming: false,
    isWatching: false,
    userTier: 'free'
  };
  private eventQueue: AnalyticsEvent[] = [];
  private batchSize: number = ANALYTICS_CONFIG.full.batchSize;
  private flushInterval: number = ANALYTICS_CONFIG.full.flushIntervalMs;
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionEnded: boolean = false;
  private recentEvents: Set<string> = new Set(); // Track recent events to prevent duplicates
  private eventDedupeWindow: number = 5000; // 5 seconds window for duplicate prevention

  // RTK Query mutation hooks (will be injected)
  private trackSessionStartMutation: any = null;
  private trackSessionEndMutation: any = null;
  private trackEventMutation: any = null;
  private trackEventsBatchMutation: any = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): RTKAnalyticsService {
    if (!RTKAnalyticsService.instance) {
      RTKAnalyticsService.instance = new RTKAnalyticsService();
    }
    return RTKAnalyticsService.instance;
  }

  // Initialize the analytics service
  private async initializeService(): Promise<void> {
    try {
      // Generate session ID
      this.sessionId = this.generateUUID();
      this.sessionStartTime = new Date();

      // Get device info
      this.deviceInfo = await this.getDeviceInfo();

      // Start periodic flush
      this.startPeriodicFlush();

      if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
        console.log('📊 RTK Analytics Service initialized', {
          sessionId: this.sessionId,
          deviceInfo: this.deviceInfo
        });
      }

    } catch (error) {
      console.error('Failed to initialize RTK Analytics Service:', error);
    }
  }

  // Configure analytics service (for interface compatibility)
  public configure(baseURL: string, authToken: string): void {
    // RTK Analytics doesn't need manual configuration since it uses RTK Query
    if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
      console.log('📊 RTK Analytics Service configure called (handled by RTK Query)');
    }
  }

  // Configure RTK Query mutations (called from React component)
  public configureMutations(mutations: {
    trackSessionStart: any;
    trackSessionEnd: any;
    trackEvent: any;
    trackEventsBatch: any;
  }): void {
    this.trackSessionStartMutation = mutations.trackSessionStart;
    this.trackSessionEndMutation = mutations.trackSessionEnd;
    this.trackEventMutation = mutations.trackEvent;
    this.trackEventsBatchMutation = mutations.trackEventsBatch;

    if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
      console.log('📊 RTK Analytics Service configured with mutations');
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
      // Create unique event identifier for deduplication
      const eventKey = `${eventType}_${this.sessionId}_${JSON.stringify(eventData)}`;
      
      // Check for duplicate events within the deduplication window
      if (this.recentEvents.has(eventKey)) {
        if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
          console.log('📊 Duplicate event prevented:', eventType);
        }
        return;
      }
      
      // Add to recent events set and auto-remove after deduplication window
      this.recentEvents.add(eventKey);
      setTimeout(() => {
        this.recentEvents.delete(eventKey);
      }, this.eventDedupeWindow);

      const event: AnalyticsEvent = {
        eventType,
        eventCategory: eventCategory || this.categorizeEvent(eventType),
        eventData: {
          ...eventData,
          userContext: this.userContext,
          sessionId: this.sessionId
        },
        timestamp: new Date()
      };

      // Add to queue for batching
      this.eventQueue.push(event);

      // Check if we should flush immediately
      const shouldFlushImmediately = 
        CRITICAL_EVENTS.includes(eventType as any) ||
        this.eventQueue.length >= this.batchSize;

      if (shouldFlushImmediately) {
        await this.flushEvents();
      }

      if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
        console.log('📊 Event tracked:', { eventType, eventCategory, eventData });
      }

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track multiple events in batch
  public async trackEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      // Filter out duplicate events from the batch
      const uniqueEvents = events.filter(event => {
        const eventKey = `${event.eventType}_${this.sessionId}_${JSON.stringify(event.eventData)}`;
        
        if (this.recentEvents.has(eventKey)) {
          if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
            console.log('📊 Duplicate batch event prevented:', event.eventType);
          }
          return false;
        }
        
        // Add to recent events set and auto-remove after deduplication window
        this.recentEvents.add(eventKey);
        setTimeout(() => {
          this.recentEvents.delete(eventKey);
        }, this.eventDedupeWindow);
        
        return true;
      });

      this.eventQueue.push(...uniqueEvents);
      await this.flushEvents();

      if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
        console.log(`📊 Batch of ${uniqueEvents.length}/${events.length} unique events tracked`);
      }

    } catch (error) {
      console.error('Failed to track events batch:', error);
    }
  }

  // Track session start (using app_opened since backend doesn't support session events)
  public async trackSessionStart(): Promise<void> {
    try {
      // Reset session state for new session
      this.sessionEnded = false;
      
      // Clear duplicate prevention cache for new session
      this.recentEvents.clear();
      
      await this.trackEvent(AnalyticsEventType.APP_OPENED, {
        sessionId: this.sessionId,
        sessionStartTime: this.sessionStartTime.toISOString(),
        deviceInfo: this.deviceInfo
      }, AnalyticsEventCategory.USER_ENGAGEMENT);

      // Send session start to backend using RTK Query
      if (this.trackSessionStartMutation && this.deviceInfo) {
        try {
          await this.trackSessionStartMutation({
            sessionId: this.sessionId,
            deviceInfo: this.deviceInfo
          }).unwrap();

          if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
            console.log('📊 Session start sent to backend successfully');
          }
        } catch (error) {
          if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
            console.warn('⚠️ Failed to send session start to backend:', error);
          }
        }
      }

    } catch (error) {
      console.error('Failed to track session start:', error);
    }
  }

  // Track session end
  public async trackSessionEnd(): Promise<void> {
    try {
      // Prevent duplicate session end events
      if (this.sessionEnded) {
        if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
          console.log('📊 Session already ended, skipping duplicate trackSessionEnd');
        }
        return;
      }
      
      this.sessionEnded = true;
      const sessionDuration = Date.now() - this.sessionStartTime.getTime();
      
      await this.trackEvent(AnalyticsEventType.APP_CLOSED, {
        sessionId: this.sessionId,
        sessionDuration: Math.floor(sessionDuration / 1000),
        sessionEndTime: new Date().toISOString()
      }, AnalyticsEventCategory.USER_ENGAGEMENT);

      // Flush all remaining events
      await this.flushEvents();

      // Send session end to backend using RTK Query
      if (this.trackSessionEndMutation) {
        try {
          await this.trackSessionEndMutation({
            sessionId: this.sessionId,
            sessionDuration: Math.floor(sessionDuration / 1000),
            totalWatchTime: this.userContext.totalWatchTime || 0,
            streamsWatched: this.userContext.totalStreams || 0
          }).unwrap();

          if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
            console.log('📊 Session end sent to backend successfully');
          }
        } catch (error) {
          if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
            console.warn('⚠️ Failed to send session end to backend:', error);
          }
        }
      }

    } catch (error) {
      console.error('Failed to track session end:', error);
    }
  }

  // Track map interactions
  public async trackMapInteraction(
    interactionType: MapInteractionType,
    data: Record<string, any>
  ): Promise<void> {
    const eventTypeMap = {
      [MapInteractionType.MARKER_CLICKED]: AnalyticsEventType.MAP_MARKER_CLICKED,
      [MapInteractionType.MAP_MOVED]: AnalyticsEventType.MAP_MOVED,
      [MapInteractionType.MAP_ZOOMED]: AnalyticsEventType.MAP_ZOOMED,
    };
    await this.trackEvent(eventTypeMap[interactionType], data, AnalyticsEventCategory.USER_ENGAGEMENT);
  }

  // Track stream interactions
  public async trackStreamInteraction(
    action: StreamAction,
    streamData: Record<string, any>
  ): Promise<void> {
    const eventTypeMap = {
      [StreamAction.JOIN]: AnalyticsEventType.STREAM_JOINED,
      [StreamAction.LEAVE]: AnalyticsEventType.STREAM_LEFT,
      [StreamAction.WATCH]: AnalyticsEventType.STREAM_WATCHED,
      [StreamAction.PREVIEW]: AnalyticsEventType.STREAM_PREVIEW_VIEWED,
    };
    await this.trackEvent(eventTypeMap[action], streamData, AnalyticsEventCategory.STREAM_INTERACTION);
  }

  // Track social interactions
  public async trackSocialInteraction(
    interactionType: SocialInteractionType,
    data: Record<string, any>
  ): Promise<void> {
    const eventTypeMap = {
      [SocialInteractionType.MESSAGE_SENT]: AnalyticsEventType.MESSAGE_SENT,
      [SocialInteractionType.REACTION_SENT]: AnalyticsEventType.REACTION_SENT,
      [SocialInteractionType.USER_FOLLOWED]: AnalyticsEventType.USER_FOLLOWED,
      [SocialInteractionType.USER_UNFOLLOWED]: AnalyticsEventType.USER_UNFOLLOWED,
      [SocialInteractionType.USER_PROFILE_VIEWED]: AnalyticsEventType.PROFILE_VIEWED,
    };
    await this.trackEvent(eventTypeMap[interactionType], data, AnalyticsEventCategory.SOCIAL);
  }

  // Track boost events
  public async trackBoostEvent(
    eventType: BoostEventType,
    data: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(eventType, data, AnalyticsEventCategory.MONETIZATION);
  }

  // Track payment events
  public async trackPaymentEvent(
    eventType: PaymentEventType,
    data: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(eventType, data, AnalyticsEventCategory.MONETIZATION);
  }

  // Track errors
  public async trackError(
    errorType: ErrorType,
    errorData: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(errorType, errorData, AnalyticsEventCategory.TECHNICAL);
  }

  // Track screen views (using app_opened since backend doesn't support screen_view events)
  public async trackScreenView(screenName: string, duration?: number): Promise<void> {
    await this.trackEvent(AnalyticsEventType.APP_OPENED, {
      screenName,
      duration,
      timestamp: new Date().toISOString()
    }, AnalyticsEventCategory.USER_ENGAGEMENT);
  }

  // Track location changes
  public async trackLocationChange(coordinates: [number, number], accuracy?: number): Promise<void> {
    await this.trackEvent(AnalyticsEventType.LOCATION_CHANGED, {
      latitude: coordinates[0],
      longitude: coordinates[1],
      accuracy,
      timestamp: new Date().toISOString()
    }, AnalyticsEventCategory.USER_ENGAGEMENT);
  }

  // Flush events to backend using RTK Query
  public async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.trackEventsBatchMutation) {
      return;
    }

    try {
      const eventsToSend = [...this.eventQueue];
      this.eventQueue = [];

      await this.trackEventsBatchMutation({
        events: eventsToSend.map(event => ({
          eventType: event.eventType,
          eventCategory: event.eventCategory,
          eventData: event.eventData,
          timestamp: event.timestamp?.toISOString()
        })),
        sessionId: this.sessionId,
        deviceInfo: this.deviceInfo
      }).unwrap();

      if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
        console.log(`📊 Successfully sent ${eventsToSend.length} analytics events to backend`);
      }

    } catch (error) {
      if (ANALYTICS_CONFIG.full.enableConsoleLogging) {
        console.warn('⚠️ Failed to flush analytics events:', error);
      }
      // Events are already removed from queue, but we could implement retry logic here
    }
  }

  // Generate UUID (React Native compatible)
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get device information (simplified version)
  private async getDeviceInfo(): Promise<DeviceInfoType> {
    try {
      return {
        platform: Platform.OS,
        osVersion: Platform.Version?.toString() || 'unknown',
        appVersion: '1.0.0', // Could be retrieved from package.json
        deviceModel: 'unknown',
        screenSize: 'unknown',
        networkType: 'unknown',
        deviceId: this.generateUUID()
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

  // Categorize events
  private categorizeEvent(eventType: string): string {
    const categories: Record<string, string[]> = {
      [ANALYTICS_CONFIG.categories.userEngagement]: [
        'app_opened', 'app_closed', 'app_backgrounded', 'app_foregrounded',
        'map_marker_clicked', 'map_moved', 'map_zoomed', 'location_changed',
        'category_filter_applied', 'search_performed'
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

export default RTKAnalyticsService;
