import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRTKAnalytics } from './useRTKAnalytics';
import { 
  MapInteractionType, 
  StreamAction, 
  SocialInteractionType, 
  BoostEventType, 
  PaymentEventType, 
  ErrorType 
} from '../types/AnalyticsEnums';

interface UseAnalyticsProps {
  screenName?: string;
  trackScreenView?: boolean;
  trackFocus?: boolean;
}

interface AnalyticsHook {
  trackEvent: (eventType: string, eventData?: Record<string, any>, eventCategory?: string) => Promise<void>;
  trackMapInteraction: (interactionType: MapInteractionType, data: Record<string, any>) => Promise<void>;
  trackStreamInteraction: (action: StreamAction, streamData: Record<string, any>) => Promise<void>;
  trackSocialInteraction: (interactionType: SocialInteractionType, data: Record<string, any>) => Promise<void>;
  trackBoostEvent: (eventType: BoostEventType, data: Record<string, any>) => Promise<void>;
  trackPaymentEvent: (eventType: PaymentEventType, data: Record<string, any>) => Promise<void>;
  trackError: (errorType: ErrorType, errorData: Record<string, any>) => Promise<void>;
  trackLocationChange: (coordinates: [number, number], accuracy?: number) => Promise<void>;
  updateUserContext: (context: any) => void;
}

export const useAnalytics = (props: UseAnalyticsProps = {}): AnalyticsHook => {
  const { screenName, trackScreenView = true, trackFocus = true } = props;
  const { analytics } = useRTKAnalytics();
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
        analytics.trackEvent('app_foregrounded', { screenName }, 'user_engagement');
      }

      return () => {
        if (trackFocus && screenName && screenStartTime.current) {
          const duration = Date.now() - screenStartTime.current.getTime();
          analytics.trackEvent('app_backgrounded', { 
            screenName, 
            duration: Math.floor(duration / 1000) 
          }, 'user_engagement');
        }
      };
    }, [trackFocus, screenName])
  );

  // Note: App state changes are handled by AnalyticsProvider to avoid duplicate events

  // Analytics methods
  const trackEvent = useCallback(async (
    eventType: string, 
    eventData: Record<string, any> = {}, 
    eventCategory?: string
  ) => {
    await analytics.trackEvent(eventType, { ...eventData, screenName }, eventCategory);
  }, [screenName]);

  const trackMapInteraction = useCallback(async (
    interactionType: MapInteractionType,
    data: Record<string, any>
  ) => {
    await analytics.trackMapInteraction(interactionType, { ...data, screenName });
  }, [screenName]);

  const trackStreamInteraction = useCallback(async (
    action: StreamAction,
    streamData: Record<string, any>
  ) => {
    await analytics.trackStreamInteraction(action, { ...streamData, screenName });
  }, [screenName]);

  const trackSocialInteraction = useCallback(async (
    interactionType: SocialInteractionType,
    data: Record<string, any>
  ) => {
    await analytics.trackSocialInteraction(interactionType, { ...data, screenName });
  }, [screenName]);

  const trackBoostEvent = useCallback(async (
    eventType: BoostEventType,
    data: Record<string, any>
  ) => {
    await analytics.trackBoostEvent(eventType, { ...data, screenName });
  }, [screenName]);

  const trackPaymentEvent = useCallback(async (
    eventType: PaymentEventType,
    data: Record<string, any>
  ) => {
    await analytics.trackPaymentEvent(eventType, { ...data, screenName });
  }, [screenName]);

  const trackError = useCallback(async (
    errorType: ErrorType,
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
