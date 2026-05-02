import { useRef } from 'react';
import RTKAnalyticsService from '../Services/RTKAnalyticsService';

/**
 * Lightweight hook — returns the analytics singleton.
 *
 * Previously this hook instantiated 4 useMutation hooks and injected
 * their triggers into RTKAnalyticsService via configureMutations().
 * That design coupled every analytics flush to the render-cycle of
 * whichever component happened to host the hook, causing spurious
 * re-renders (2 per mutation: loading → success).
 *
 * RTKAnalyticsService now dispatches directly to the Redux store
 * via store.dispatch(analyticsApi.endpoints.*.initiate()), so no
 * mutation hooks are needed inside any component.
 */
export const useRTKAnalytics = () => {
  const analyticsRef = useRef(RTKAnalyticsService.getInstance());

  return {
    analytics: analyticsRef.current,
  };
};

export default useRTKAnalytics;
