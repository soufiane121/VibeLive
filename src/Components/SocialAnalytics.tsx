import React, { useEffect, useRef } from 'react';
import { useAnalytics } from '../Hooks/useAnalytics';
import SocketAnalyticsService from '../Services/SocketAnalyticsService';
import { AnalyticsEventType, SocialInteractionType } from '../types/AnalyticsEnums';

interface UserProfile {
  userId: string;
  username: string;
  followerCount?: number;
  followingCount?: number;
  isVerified?: boolean;
}

interface MessageData {
  messageId: string;
  streamId: string;
  senderId: string;
  content: string;
  type: 'text' | 'emoji' | 'gif' | 'sticker';
  timestamp: Date;
}

interface ReactionData {
  reactionId: string;
  streamId: string;
  userId: string;
  emoji: string;
  targetType: 'stream' | 'message';
  targetId: string;
  timestamp: Date;
}

export const useSocialAnalytics = () => {
  const { trackEvent, trackSocialInteraction } = useAnalytics({ screenName: 'Social' });
  const socketAnalytics = SocketAnalyticsService.getInstance();
  const sessionInteractions = useRef<number>(0);
  const sessionStartTime = useRef<Date>(new Date());

  // Track message sending
  const trackMessageSent = async (messageData: MessageData) => {
    try {
      sessionInteractions.current++;

      await trackSocialInteraction(SocialInteractionType.MESSAGE_SENT, {
        messageId: messageData.messageId,
        streamId: messageData.streamId,
        messageLength: messageData.content.length,
        messageType: messageData.type,
        hasEmojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(messageData.content),
        wordCount: messageData.content.split(/\s+/).length,
        sessionInteractionCount: sessionInteractions.current,
        timestamp: messageData.timestamp.toISOString()
      });

      console.log('Message sent tracked:', messageData.messageId);
    } catch (error) {
      console.error('Failed to track message sent:', error);
    }
  };

  // Track message received/viewed
  const trackMessageReceived = async (messageData: MessageData, viewDuration?: number) => {
    try {
      await trackEvent(AnalyticsEventType.MESSAGE_RECEIVED, {
        messageId: messageData.messageId,
        streamId: messageData.streamId,
        senderId: messageData.senderId,
        messageLength: messageData.content.length,
        messageType: messageData.type,
        viewDuration,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track message received:', error);
    }
  };

  // Track reaction/emoji sent
  const trackReactionSent = async (reactionData: ReactionData) => {
    try {
      sessionInteractions.current++;

      await trackSocialInteraction(SocialInteractionType.REACTION_SENT, {
        reactionId: reactionData.reactionId,
        streamId: reactionData.streamId,
        userId: reactionData.userId,
        emoji: reactionData.emoji,
        targetType: reactionData.targetType,
        targetId: reactionData.targetId,
        sessionInteractionCount: sessionInteractions.current,
        timestamp: reactionData.timestamp.toISOString()
      });

      console.log('Reaction sent tracked:', reactionData.emoji);
    } catch (error) {
      console.error('Failed to track reaction sent:', error);
    }
  };

  // Track user profile view
  const trackProfileView = async (viewedUser: UserProfile, viewMethod: string, viewDuration?: number) => {
    try {
      await trackEvent(AnalyticsEventType.PROFILE_VIEWED, {
        viewedUserId: viewedUser.userId,
        viewedUsername: viewedUser.username,
        viewMethod, // 'chat_click', 'search_result', 'follower_list', 'stream_info'
        viewDuration,
        viewedUserFollowerCount: viewedUser.followerCount,
        viewedUserIsVerified: viewedUser.isVerified,
        timestamp: new Date().toISOString()
      });

      console.log('Profile view tracked:', viewedUser.username);
    } catch (error) {
      console.error('Failed to track profile view:', error);
    }
  };

  // Track follow action
  const trackFollowAction = async (targetUser: UserProfile, action: 'follow' | 'unfollow') => {
    try {
      await trackSocialInteraction(action === 'follow' ? SocialInteractionType.USER_FOLLOWED : SocialInteractionType.USER_UNFOLLOWED, {
        targetUserId: targetUser.userId,
        targetUsername: targetUser.username,
        action,
        targetUserFollowerCount: targetUser.followerCount,
        targetUserIsVerified: targetUser.isVerified,
        timestamp: new Date().toISOString()
      });

      console.log('Follow action tracked:', action, targetUser.username);
    } catch (error) {
      console.error('Failed to track follow action:', error);
    }
  };

  // Track direct message initiation
  const trackDirectMessageStart = async (recipientUser: UserProfile, initiationMethod: string) => {
    try {
      await trackEvent(AnalyticsEventType.DIRECT_MESSAGE_STARTED, {
        recipientUserId: recipientUser.userId,
        recipientUsername: recipientUser.username,
        initiationMethod, // 'profile_view', 'stream_chat', 'search'
        timestamp: new Date().toISOString()
      });

      console.log('Direct message start tracked:', recipientUser.username);
    } catch (error) {
      console.error('Failed to track direct message start:', error);
    }
  };

  // Track chat engagement patterns
  const trackChatEngagement = async (streamId: string, engagementData: any) => {
    try {
      await trackEvent(AnalyticsEventType.CHAT_ENGAGEMENT, {
        streamId,
        messagesRead: engagementData.messagesRead,
        messagesScrolled: engagementData.messagesScrolled,
        timeSpentReading: engagementData.timeSpentReading,
        reactionsGiven: engagementData.reactionsGiven,
        participationLevel: engagementData.participationLevel, // 'lurker', 'occasional', 'active', 'super_active'
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track chat engagement:', error);
    }
  };

  // Track emoji/sticker usage
  const trackEmojiUsage = async (emoji: string, context: string, streamId?: string) => {
    try {
      await trackEvent(AnalyticsEventType.EMOJI_USED, {
        emoji,
        context, // 'chat_message', 'reaction', 'direct_message'
        streamId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track emoji usage:', error);
    }
  };

  // Track social feature discovery
  const trackFeatureDiscovery = async (feature: string, discoveryMethod: string) => {
    try {
      await trackEvent(AnalyticsEventType.SOCIAL_FEATURE_DISCOVERED, {
        feature, // 'reactions', 'direct_messages', 'profile_customization', 'follow_system'
        discoveryMethod, // 'tutorial', 'exploration', 'notification', 'friend_invitation'
        timestamp: new Date().toISOString()
      });

      console.log('Social feature discovery tracked:', feature);
    } catch (error) {
      console.error('Failed to track feature discovery:', error);
    }
  };

  // Track moderation actions
  const trackModerationAction = async (action: string, targetData: any, reason?: string) => {
    try {
      await trackEvent(AnalyticsEventType.MODERATION_ACTION, {
        action, // 'report_user', 'report_message', 'block_user', 'mute_user'
        targetUserId: targetData.userId,
        targetMessageId: targetData.messageId,
        targetStreamId: targetData.streamId,
        reason,
        timestamp: new Date().toISOString()
      });

      console.log('Moderation action tracked:', action);
    } catch (error) {
      console.error('Failed to track moderation action:', error);
    }
  };

  // Track social notification interactions
  const trackNotificationInteraction = async (notificationType: string, action: string, notificationData: any) => {
    try {
      await trackEvent(AnalyticsEventType.SOCIAL_NOTIFICATION_INTERACTION, {
        notificationType, // 'new_follower', 'message_received', 'mention', 'reaction_received'
        action, // 'opened', 'dismissed', 'clicked_through'
        notificationAge: notificationData.age,
        fromUserId: notificationData.fromUserId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track notification interaction:', error);
    }
  };

  // Track social session summary
  const trackSocialSessionEnd = async () => {
    try {
      const sessionDuration = Date.now() - sessionStartTime.current.getTime();
      
      await trackEvent(AnalyticsEventType.SOCIAL_SESSION_ENDED, {
        sessionDuration: Math.floor(sessionDuration / 1000),
        totalInteractions: sessionInteractions.current,
        interactionRate: sessionInteractions.current / (sessionDuration / 60000), // interactions per minute
        timestamp: new Date().toISOString()
      });

      // Reset session tracking
      sessionInteractions.current = 0;
      sessionStartTime.current = new Date();

      console.log('Social session end tracked');
    } catch (error) {
      console.error('Failed to track social session end:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      trackSocialSessionEnd();
    };
  }, []);

  return {
    trackMessageSent,
    trackMessageReceived,
    trackReactionSent,
    trackProfileView,
    trackFollowAction,
    trackDirectMessageStart,
    trackChatEngagement,
    trackEmojiUsage,
    trackFeatureDiscovery,
    trackModerationAction,
    trackNotificationInteraction,
    trackSocialSessionEnd,
    sessionInteractions: sessionInteractions.current
  };
};

// Higher-order component for social components
export const withSocialAnalytics = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const socialAnalytics = useSocialAnalytics();

    return <WrappedComponent {...props} />;
  };
};

export default useSocialAnalytics;
