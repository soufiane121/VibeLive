import React, { useEffect, useRef, useState } from 'react';
import { useAnalytics } from '../Hooks/useAnalytics';
import SocketAnalyticsService from '../Services/SocketAnalyticsService';

interface StreamData {
  streamId: string;
  streamerId: string;
  title: string;
  category: string;
  coordinates: [number, number];
  viewerCount: number;
  isBoosted: boolean;
  boostedPriority?: number;
  isLive: boolean;
}

interface ViewingSession {
  streamId: string;
  startTime: Date;
  lastHeartbeat: Date;
  totalWatchTime: number;
  interactions: number;
}

export const useStreamAnalytics = () => {
  const { trackEvent, trackStreamInteraction, trackSocialInteraction } = useAnalytics({ screenName: 'Stream' });
  const socketAnalytics = SocketAnalyticsService.getInstance();
  const currentSession = useRef<ViewingSession | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  // Track stream join
  const trackStreamJoin = async (streamData: StreamData, joinMethod: string = 'direct') => {
    try {
      const startTime = new Date();
      
      // Initialize viewing session
      currentSession.current = {
        streamId: streamData.streamId,
        startTime,
        lastHeartbeat: startTime,
        totalWatchTime: 0,
        interactions: 0
      };

      setIsWatching(true);

      // Track via socket for real-time analytics
      socketAnalytics.trackStreamJoin(streamData.streamId, streamData.streamerId);

      // Track locally
      await trackStreamInteraction('stream_joined', {
        streamId: streamData.streamId,
        streamerId: streamData.streamerId,
        streamTitle: streamData.title,
        streamCategory: streamData.category,
        coordinates: streamData.coordinates,
        joinMethod, // 'map_click', 'search_result', 'notification', 'direct_link'
        viewerCount: streamData.viewerCount,
        isBoosted: streamData.isBoosted,
        boostedPriority: streamData.boostedPriority,
        timestamp: startTime.toISOString()
      });

      // Start heartbeat tracking
      startHeartbeat();

      console.log('Stream join tracked:', streamData.streamId);
    } catch (error) {
      console.error('Failed to track stream join:', error);
    }
  };

  // Track stream leave
  const trackStreamLeave = async (reason: string = 'user_action') => {
    try {
      if (!currentSession.current) return;

      const endTime = new Date();
      const sessionDuration = Math.floor((endTime.getTime() - currentSession.current.startTime.getTime()) / 1000);
      const watchTime = currentSession.current.totalWatchTime + 
        Math.floor((endTime.getTime() - currentSession.current.lastHeartbeat.getTime()) / 1000);

      setIsWatching(false);

      // Stop heartbeat
      stopHeartbeat();

      // Track via socket
      socketAnalytics.trackStreamLeave(
        currentSession.current.streamId,
        sessionDuration,
        currentSession.current.interactions
      );

      // Track locally
      await trackStreamInteraction('stream_left', {
        streamId: currentSession.current.streamId,
        sessionDuration,
        watchTime,
        interactions: currentSession.current.interactions,
        leaveReason: reason, // 'user_action', 'stream_ended', 'connection_lost', 'app_background'
        timestamp: endTime.toISOString()
      });

      // Reset session
      currentSession.current = null;

      console.log('Stream leave tracked with duration:', sessionDuration);
    } catch (error) {
      console.error('Failed to track stream leave:', error);
    }
  };

  // Track chat message
  const trackChatMessage = async (messageData: any) => {
    try {
      if (currentSession.current) {
        currentSession.current.interactions++;
      }

      await trackSocialInteraction('message_sent', {
        streamId: messageData.streamId,
        messageLength: messageData.message?.length || 0,
        messageType: messageData.type || 'text',
        timestamp: new Date().toISOString()
      });

      console.log('Chat message tracked');
    } catch (error) {
      console.error('Failed to track chat message:', error);
    }
  };

  // Track reaction/emoji
  const trackReaction = async (reactionData: any) => {
    try {
      if (currentSession.current) {
        currentSession.current.interactions++;
      }

      await trackSocialInteraction('reaction_sent', {
        streamId: reactionData.streamId,
        reactionType: reactionData.emoji || reactionData.type,
        timestamp: new Date().toISOString()
      });

      console.log('Reaction tracked:', reactionData.emoji);
    } catch (error) {
      console.error('Failed to track reaction:', error);
    }
  };

  // Track stream sharing
  const trackStreamShare = async (streamId: string, shareMethod: string) => {
    try {
      await trackEvent('stream_shared', {
        streamId,
        shareMethod, // 'social_media', 'copy_link', 'direct_message'
        timestamp: new Date().toISOString()
      });

      console.log('Stream share tracked:', shareMethod);
    } catch (error) {
      console.error('Failed to track stream share:', error);
    }
  };

  // Track stream quality changes
  const trackQualityChange = async (streamId: string, newQuality: string, reason: string) => {
    try {
      await trackEvent('stream_quality_changed', {
        streamId,
        newQuality, // '720p', '480p', '360p', 'auto'
        changeReason: reason, // 'user_manual', 'auto_adaptive', 'connection_poor'
        timestamp: new Date().toISOString()
      });

      console.log('Stream quality change tracked:', newQuality);
    } catch (error) {
      console.error('Failed to track quality change:', error);
    }
  };

  // Track stream buffering events
  const trackBuffering = async (streamId: string, bufferDuration: number) => {
    try {
      await trackEvent('stream_buffering', {
        streamId,
        bufferDuration,
        timestamp: new Date().toISOString()
      });

      console.log('Stream buffering tracked:', bufferDuration);
    } catch (error) {
      console.error('Failed to track buffering:', error);
    }
  };

  // Track stream errors
  const trackStreamError = async (streamId: string, errorType: string, errorMessage: string) => {
    try {
      await trackEvent('stream_error', {
        streamId,
        errorType, // 'connection_failed', 'playback_error', 'permission_denied'
        errorMessage,
        timestamp: new Date().toISOString()
      });

      console.error('Stream error tracked:', errorType, errorMessage);
    } catch (error) {
      console.error('Failed to track stream error:', error);
    }
  };

  // Track viewer count updates
  const trackViewerCountUpdate = async (streamId: string, newCount: number, previousCount: number) => {
    try {
      await trackEvent('viewer_count_updated', {
        streamId,
        newCount,
        previousCount,
        change: newCount - previousCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track viewer count update:', error);
    }
  };

  // Track stream discovery preview
  const trackStreamPreview = async (streamData: StreamData, previewDuration: number) => {
    try {
      await trackEvent('stream_previewed', {
        streamId: streamData.streamId,
        streamerId: streamData.streamerId,
        streamTitle: streamData.title,
        streamCategory: streamData.category,
        previewDuration,
        viewerCount: streamData.viewerCount,
        isBoosted: streamData.isBoosted,
        timestamp: new Date().toISOString()
      });

      console.log('Stream preview tracked:', streamData.streamId);
    } catch (error) {
      console.error('Failed to track stream preview:', error);
    }
  };

  // Start heartbeat tracking for watch time
  const startHeartbeat = () => {
    heartbeatInterval.current = setInterval(() => {
      if (currentSession.current) {
        const now = new Date();
        const segmentDuration = Math.floor((now.getTime() - currentSession.current.lastHeartbeat.getTime()) / 1000);
        
        currentSession.current.totalWatchTime += segmentDuration;
        currentSession.current.lastHeartbeat = now;

        // Send heartbeat to socket for real-time tracking
        socketAnalytics.trackStreamHeartbeat(
          currentSession.current.streamId,
          currentSession.current.totalWatchTime
        );
      }
    }, 30000); // 30-second intervals
  };

  // Stop heartbeat tracking
  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isWatching) {
        trackStreamLeave('component_unmount');
      }
      stopHeartbeat();
    };
  }, [isWatching]);

  return {
    trackStreamJoin,
    trackStreamLeave,
    trackChatMessage,
    trackReaction,
    trackStreamShare,
    trackQualityChange,
    trackBuffering,
    trackStreamError,
    trackViewerCountUpdate,
    trackStreamPreview,
    isWatching,
    currentSession: currentSession.current
  };
};

// Higher-order component for stream components
export const withStreamAnalytics = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const streamAnalytics = useStreamAnalytics();

    return <WrappedComponent {...props} />;
  };
};

export default useStreamAnalytics;
