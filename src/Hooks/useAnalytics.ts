import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAnalyticsService } from '../Services/AnalyticsServiceFactory';

interface UseAnalyticsProps {
  screenName?: string;
  trackScreenView?: boolean;
  trackFocus?: boolean;
}

interface AnalyticsHook {
  trackEvent: (eventType: string, eventData?: Record<string, any>, eventCategory?: string) => Promise<void>;
  trackMapInteraction: (interactionType: 'marker_clicked' | 'map_moved' | 'map_zoomed', data: Record<string, any>) => Promise<void>;
  trackStreamInteraction: (action: 'join' | 'leave' | 'watch' | 'preview', streamData: Record<string, any>) => Promise<void>;
  trackSocialInteraction: (interactionType: 'message_sent' | 'reaction_sent' | 'user_followed', data: Record<string, any>) => Promise<void>;
  trackBoostEvent: (eventType: 'boost_intro_viewed' | 'boost_tier_selected' | 'boost_purchased' | 'boost_activated' | 'boost_skipped', data: Record<string, any>) => Promise<void>;
  trackPaymentEvent: (eventType: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'payment_cancelled', data: Record<string, any>) => Promise<void>;
  trackError: (errorType: 'error_occurred' | 'crash_reported' | 'network_error' | 'permission_denied', errorData: Record<string, any>) => Promise<void>;
  trackLocationChange: (coordinates: [number, number], accuracy?: number) => Promise<void>;
  updateUserContext: (context: any) => void;
}

export const useAnalytics = (props: UseAnalyticsProps = {}): AnalyticsHook => {
  const { screenName, trackScreenView = true, trackFocus = true } = props;
  const analytics = getAnalyticsService();
  const screenStartTime = useRef<Date | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Track screen view on mount
  useEffect(() => {
    if (trackScreenView && screenName) {
      screenStartTime.current = new Date();
      analytics.trackScreenView(screenName);
    }

    return () => {
      // Track screen duration on unmount
      if (trackScreenView && screenName && screenStartTime.current) {
        const duration = Date.now() - screenStartTime.current.getTime();
        analytics.trackScreenView(screenName, Math.floor(duration / 1000));
      }
    };
  }, [screenName, trackScreenView]);

  // Track screen focus/blur
  useFocusEffect(
    useCallback(() => {
      if (trackFocus && screenName) {
        screenStartTime.current = new Date();
        analytics.trackEvent('screen_focused', { screenName }, 'user_engagement');
      }

      return () => {
        if (trackFocus && screenName && screenStartTime.current) {
          const duration = Date.now() - screenStartTime.current.getTime();
          analytics.trackEvent('screen_blurred', { 
            screenName, 
            duration: Math.floor(duration / 1000) 
          }, 'user_engagement');
        }
      };
    }, [trackFocus, screenName])
  );

  // Track app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        analytics.trackEvent('app_foregrounded', { 
          previousState: appStateRef.current,
          screenName 
        }, 'user_engagement');
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        analytics.trackEvent('app_backgrounded', { 
          nextState: nextAppState,
          screenName 
        }, 'user_engagement');
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [screenName]);

  // Analytics methods
  const trackEvent = useCallback(async (
    eventType: string, 
    eventData: Record<string, any> = {}, 
    eventCategory?: string
  ) => {
    await analytics.trackEvent(eventType, { ...eventData, screenName }, eventCategory);
  }, [screenName]);

  const trackMapInteraction = useCallback(async (
    interactionType: 'marker_clicked' | 'map_moved' | 'map_zoomed',
    data: Record<string, any>
  ) => {
    await analytics.trackMapInteraction(interactionType, { ...data, screenName });
  }, [screenName]);

  const trackStreamInteraction = useCallback(async (
    action: 'join' | 'leave' | 'watch' | 'preview',
    streamData: Record<string, any>
  ) => {
    await analytics.trackStreamInteraction(action, { ...streamData, screenName });
  }, [screenName]);

  const trackSocialInteraction = useCallback(async (
    interactionType: 'message_sent' | 'reaction_sent' | 'user_followed',
    data: Record<string, any>
  ) => {
    await analytics.trackSocialInteraction(interactionType, { ...data, screenName });
  }, [screenName]);

  const trackBoostEvent = useCallback(async (
    eventType: 'boost_intro_viewed' | 'boost_tier_selected' | 'boost_purchased' | 'boost_activated' | 'boost_skipped',
    data: Record<string, any>
  ) => {
    await analytics.trackBoostEvent(eventType, { ...data, screenName });
  }, [screenName]);

  const trackPaymentEvent = useCallback(async (
    eventType: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'payment_cancelled',
    data: Record<string, any>
  ) => {
    await analytics.trackPaymentEvent(eventType, { ...data, screenName });
  }, [screenName]);

  const trackError = useCallback(async (
    errorType: 'error_occurred' | 'crash_reported' | 'network_error' | 'permission_denied',
    errorData: Record<string, any>
  ) => {
    await analytics.trackError(errorType, { ...errorData, screenName });
  }, [screenName]);

  const trackLocationChange = useCallback(async (
    coordinates: [number, number],
    accuracy?: number
  ) => {
    await analytics.trackLocationChange(coordinates, accuracy);
  }, []);

  const updateUserContext = useCallback((context: any) => {
    analytics.updateUserContext(context);
  }, []);

  return {
    trackEvent,
    trackMapInteraction,
    trackStreamInteraction,
    trackSocialInteraction,
    trackBoostEvent,
    trackPaymentEvent,
    trackError,
    trackLocationChange,
    updateUserContext
  };
};

export default useAnalytics;
