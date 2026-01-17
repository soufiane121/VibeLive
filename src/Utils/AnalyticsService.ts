interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

interface AnalyticsProvider {
  track(event: AnalyticsEvent): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): Promise<void>;
  flush(): Promise<void>;
}

// Mock analytics provider - replace with your preferred analytics service
class MockAnalyticsProvider implements AnalyticsProvider {
  async track(event: AnalyticsEvent): Promise<void> {
    console.log('📊 Analytics Event:', {
      event: event.name,
      properties: event.properties,
      timestamp: event.timestamp,
    });
    
    // In production, send to your analytics service
    // Examples: Mixpanel, Amplitude, Firebase Analytics, etc.
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    console.log('👤 Analytics Identify:', { userId, traits });
  }

  async flush(): Promise<void> {
    console.log('🔄 Analytics Flush');
  }
}

class AnalyticsServiceClass {
  private provider: AnalyticsProvider;
  private userId?: string;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline = true;

  constructor() {
    this.provider = new MockAnalyticsProvider();
    this.sessionId = this.generateSessionId();
    
    // Monitor network status for offline queuing
    this.setupNetworkMonitoring();
  }

  track(eventName: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        platform: 'react-native',
        app_version: '1.0.0', // Get from app config
      },
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    if (this.isOnline) {
      this.provider.track(event).catch(error => {
        console.error('Analytics tracking failed:', error);
        this.queueEvent(event);
      });
    } else {
      this.queueEvent(event);
    }
  }

  identify(userId: string, traits: Record<string, any> = {}): void {
    this.userId = userId;
    
    if (this.isOnline) {
      this.provider.identify(userId, traits).catch(error => {
        console.error('Analytics identify failed:', error);
      });
    }
  }

  // Boost-specific analytics methods
  trackBoostFunnelStep(step: string, data: Record<string, any>): void {
    this.track('boost_funnel_step', {
      step,
      funnel: 'boost_purchase',
      ...data,
    });
  }

  trackBoostConversion(tier: string, price: number, data: Record<string, any>): void {
    this.track('boost_conversion', {
      tier,
      price,
      conversion_value: price,
      ...data,
    });
  }

  trackStreamPerformance(data: Record<string, any>): void {
    this.track('stream_performance', {
      ...data,
    });
  }

  trackUserEngagement(action: string, data: Record<string, any>): void {
    this.track('user_engagement', {
      action,
      ...data,
    });
  }

  // Error tracking
  trackError(error: Error, context: Record<string, any> = {}): void {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context,
    });
  }

  // Performance tracking
  trackTiming(name: string, duration: number, data: Record<string, any> = {}): void {
    this.track('timing', {
      timing_name: name,
      timing_duration: duration,
      ...data,
    });
  }

  private queueEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);
    
    // Limit queue size to prevent memory issues
    if (this.eventQueue.length > 100) {
      this.eventQueue.shift();
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      for (const event of eventsToFlush) {
        await this.provider.track(event);
      }
    } catch (error) {
      console.error('Failed to flush analytics queue:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private setupNetworkMonitoring(): void {
    // In production, use @react-native-netinfo/netinfo
    // NetInfo.addEventListener(state => {
    //   const wasOffline = !this.isOnline;
    //   this.isOnline = state.isConnected ?? false;
    //   
    //   if (wasOffline && this.isOnline) {
    //     this.flushQueue();
    //   }
    // });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup method
  async flush(): Promise<void> {
    await this.flushQueue();
    await this.provider.flush();
  }
}

export const AnalyticsService = new AnalyticsServiceClass();
