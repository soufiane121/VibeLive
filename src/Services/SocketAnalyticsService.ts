import { io, Socket } from 'socket.io-client';
import AnalyticsService from './AnalyticsService';
import { AnalyticsEventType, AnalyticsEventCategory } from '../types/AnalyticsEnums';

class SocketAnalyticsService {
  private static instance: SocketAnalyticsService;
  private socket: Socket | null = null;
  private analytics: AnalyticsService;
  private isConnected: boolean = false;

  private constructor() {
    this.analytics = AnalyticsService.getInstance();
  }

  public static getInstance(): SocketAnalyticsService {
    if (!SocketAnalyticsService.instance) {
      SocketAnalyticsService.instance = new SocketAnalyticsService();
    }
    return SocketAnalyticsService.instance;
  }

  // Initialize socket connection
  public initializeSocket(url: string, token: string, userId: string): void {
    try {
      this.socket = io(`${url}/liveStream`, {
        query: { token, userId },
        transports: ['websocket', 'polling']
      });

      this.setupSocketListeners();
      this.isConnected = true;

      console.log('Socket Analytics Service initialized');
    } catch (error) {
      console.error('Failed to initialize socket analytics:', error);
      this.analytics.trackError('network_error', {
        error: 'Socket connection failed',
        details: error
      });
    }
  }

  // Setup socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected for analytics');
      this.isConnected = true;
      this.analytics.trackEvent(AnalyticsEventType.SOCKET_CONNECTED, {
        socketId: this.socket?.id,
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.TECHNICAL);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.analytics.trackEvent(AnalyticsEventType.SOCKET_DISCONNECTED, {
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.TECHNICAL);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.analytics.trackError('network_error', {
        error: 'Socket connection error',
        details: error.message
      });
    });

    // Stream events
    this.socket.on('stream-counts', (data) => {
      this.analytics.trackEvent(AnalyticsEventType.VIEWER_COUNT_UPDATED, {
        streamId: data.data?.liveDetails?.streamId,
        viewerCount: data.data?.liveDetails?.liveViewrsCount,
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.STREAM_INTERACTION);
    });

    this.socket.on('add-to-map', (data) => {
      this.analytics.trackEvent(AnalyticsEventType.STREAM_DISCOVERED, {
        streamId: data.data?.streamId,
        streamerId: data.data?.mapItem?.properties?.userId,
        discoveryMethod: 'map_notification',
        nearbyUsers: data.data?.users?.length || 0,
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.STREAM_INTERACTION);
    });

    this.socket.on('get-chat', (data) => {
      this.analytics.trackEvent(AnalyticsEventType.MESSAGE_RECEIVED, {
        streamId: data.data?.streamId,
        messageId: data.data?.newMessage?.id,
        messageLength: data.data?.newMessage?.message?.length || 0,
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.SOCIAL);
    });

    this.socket.on('get-reaction', (data) => {
      this.analytics.trackEvent(AnalyticsEventType.REACTION_RECEIVED, {
        streamId: data.data?.streamId,
        reactionType: data.data?.reactionType,
        emojiType: data.data?.emoji,
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.SOCIAL);
    });

    // Boost events
    this.socket.on('stream-boosted', (data) => {
      this.analytics.trackEvent(AnalyticsEventType.BOOST_NOTIFICATION_RECEIVED, {
        streamerId: data.streamerId,
        tier: data.tier,
        priority: data.priority,
        boostedUntil: data.boostedUntil,
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.MONETIZATION);
    });

    this.socket.on('stream-metadata-updated', (data) => {
      this.analytics.trackEvent(AnalyticsEventType.STREAM_METADATA_UPDATED, {
        streamerId: data.streamerId,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.STREAM_INTERACTION);
    });

    this.socket.on('viewer-count-updated', (data) => {
      this.analytics.trackEvent(AnalyticsEventType.VIEWER_COUNT_UPDATED, {
        streamerId: data.streamerId,
        viewerCount: data.viewerCount,
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.STREAM_INTERACTION);
    });

    this.socket.on('streams-in-bounds', (data) => {
      this.analytics.trackEvent(AnalyticsEventType.STREAMS_LOADED, {
        streamsCount: data.streams?.length || 0,
        bounds: data.bounds,
        category: data.category,
        timestamp: new Date().toISOString()
      }, AnalyticsEventCategory.STREAM_INTERACTION);
    });

    // Error events
    this.socket.on('boost-error', (data) => {
      this.analytics.trackError('error_occurred', {
        error: 'Boost activation failed',
        details: data.error
      });
    });

    this.socket.on('metadata-update-error', (data) => {
      this.analytics.trackError('error_occurred', {
        error: 'Metadata update failed',
        details: data.error
      });
    });
  }

  // Track map marker click
  public trackMapMarkerClick(markerData: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('map-marker-clicked', {
        coordinates: markerData.coordinates,
        markerType: markerData.type,
        streamId: markerData.streamId,
        streamerId: markerData.userId,
        streamCategory: markerData.category,
        streamTitle: markerData.title,
        isLive: markerData.isLive,
        viewerCount: markerData.viewerCount,
        isBoosted: markerData.isBoosted,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackMapInteraction('marker_clicked', markerData);
  }

  // Track stream leaving
  public trackStreamLeave(streamData: any, watchDuration: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-stream', {
        streamId: streamData.streamId,
        streamerId: streamData.streamerId,
        watchDuration,
        streamCategory: streamData.category,
        streamTitle: streamData.title,
        viewerCount: streamData.viewerCount,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackStreamInteraction('leave', {
      ...streamData,
      watchDuration
    });
  }

  // Track app activity
  public trackAppActivity(activityType: string, duration: number, screenName: string, coordinates?: [number, number]): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('track-app-activity', {
        activityType,
        duration,
        screenName,
        coordinates,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackEvent(activityType, {
      duration,
      screenName,
      coordinates
    });
  }

  // Track location changes
  public trackLocationChange(coordinates: [number, number], accuracy?: number, speed?: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('location-changed', {
        coordinates,
        accuracy,
        speed,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackLocationChange(coordinates, accuracy);
  }

  // Track category filter
  public trackCategoryFilter(category: string, coordinates: [number, number], resultsCount: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('category-filter-applied', {
        category,
        coordinates,
        resultsCount,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackEvent(AnalyticsEventType.CATEGORY_FILTER_APPLIED, {
      filterCategory: category,
      coordinates,
      resultsCount
    });
  }

  // Track search queries
  public trackSearch(query: string, coordinates: [number, number], resultsCount: number, filterCategory?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('search-performed', {
        query,
        coordinates,
        resultsCount,
        filterCategory,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackEvent(AnalyticsEventType.SEARCH_PERFORMED, {
      searchQuery: query,
      coordinates,
      resultsCount,
      filterCategory,
      queryLength: query?.length || 0
    });
  }

  // Track message sending
  public trackMessageSent(messageData: any): void {
    if (this.socket && this.isConnected) {
      // The socket already handles message sending, just track analytics
      this.analytics.trackSocialInteraction('message_sent', {
        streamId: messageData.streamId,
        streamerId: messageData.streamerId,
        messageContent: messageData.message,
        messageLength: messageData.message?.length || 0,
        roomName: messageData.roomName
      });
    }
  }

  // Track reaction sending
  public trackReactionSent(reactionData: any): void {
    if (this.socket && this.isConnected) {
      // The socket already handles reaction sending, just track analytics
      this.analytics.trackSocialInteraction('reaction_sent', {
        streamId: reactionData.streamId,
        streamerId: reactionData.streamerId,
        reactionType: reactionData.reactionType,
        emojiType: reactionData.emoji,
        coordinates: reactionData.coordinates,
        roomName: reactionData.roomName
      });
    }
  }

  // Track boost activation
  public trackBoostActivation(boostData: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('boost-activated', {
        tier: boostData.tier,
        duration: boostData.duration,
        priority: boostData.priority,
        coordinates: boostData.coordinates,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackBoostEvent('boost_activated', boostData);
  }

  // Track stream metadata updates
  public trackStreamMetadataUpdate(metadataData: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-stream-metadata', {
        title: metadataData.title,
        description: metadataData.description,
        category: metadataData.category,
        tags: metadataData.tags,
        thumbnailUrl: metadataData.thumbnailUrl,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackEvent(AnalyticsEventType.STREAM_METADATA_UPDATED, metadataData, AnalyticsEventCategory.STREAM_INTERACTION);
  }

  // Track viewer count updates
  public trackViewerCountUpdate(viewerCount: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-viewer-count', {
        viewerCount,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackEvent(AnalyticsEventType.VIEWER_COUNT_UPDATED, { viewerCount }, AnalyticsEventCategory.STREAM_INTERACTION);
  }

  // Track map bounds changes
  public trackMapBoundsChange(bounds: any, category?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('map-bounds-changed', {
        bounds,
        category,
        timestamp: new Date().toISOString()
      });
    }

    // Also track locally
    this.analytics.trackEvent(AnalyticsEventType.MAP_BOUNDS_CHANGED, {
      bounds,
      category
    }, AnalyticsEventCategory.USER_ENGAGEMENT);
  }

  // Get socket connection status
  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Disconnect socket
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  // Cleanup
  public cleanup(): void {
    this.disconnect();
  }
}

export default SocketAnalyticsService;
