import { useEffect } from 'react';
import {
  useTrackSessionStartMutation,
  useTrackSessionEndMutation,
  useTrackEventMutation,
  useTrackEventsBatchMutation,
} from '../Services/AnalyticsApi';
import RTKAnalyticsService from '../Services/RTKAnalyticsService';

// Hook to configure and use RTK Analytics
export const useRTKAnalytics = () => {
  // RTK Query mutation hooks
  const [trackSessionStart] = useTrackSessionStartMutation();
  const [trackSessionEnd] = useTrackSessionEndMutation();
  const [trackEvent] = useTrackEventMutation();
  const [trackEventsBatch] = useTrackEventsBatchMutation();

  // Get analytics service instance
  const analytics = RTKAnalyticsService.getInstance();

  // Configure the service with RTK mutations on mount
  useEffect(() => {
    analytics.configureMutations({
      trackSessionStart,
      trackSessionEnd,
      trackEvent,
      trackEventsBatch,
    });
  }, [trackSessionStart, trackSessionEnd, trackEvent, trackEventsBatch]);

  return {
    analytics,
    // Expose individual mutation hooks if needed
    trackSessionStartMutation: trackSessionStart,
    trackSessionEndMutation: trackSessionEnd,
    trackEventMutation: trackEvent,
    trackEventsBatchMutation: trackEventsBatch,
  };
};

export default useRTKAnalytics;
