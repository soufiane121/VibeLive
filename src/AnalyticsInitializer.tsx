import React, { useEffect } from 'react';
import { useAnalyticsContext } from './Providers/AnalyticsProvider';
import { useSelector } from 'react-redux';

/**
 * Component to initialize analytics when user logs in
 * This should be placed in your main app component after Redux Provider
 */
export const AnalyticsInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initializeAnalytics, isInitialized } = useAnalyticsContext();
  const user = useSelector((state: any) => state.currentUser?.user);

  useEffect(() => {
    const initAnalytics = async () => {
      if (user && !isInitialized) {
        try {
          // Initialize analytics with your backend URL and user token
          const backendURL = 'http://localhost:3000'; // Replace with your actual backend URL
          const authToken = user.token || user.accessToken; // Adjust based on your user object structure
          const userId = user._id || user.id;

          console.log('🔄 Initializing analytics for user:', userId);
          
          await initializeAnalytics(backendURL, authToken, userId);
          
          console.log('✅ Analytics initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize analytics:', error);
        }
      }
    };

    initAnalytics();
  }, [user, isInitialized, initializeAnalytics]);

  return <>{children}</>;
};

export default AnalyticsInitializer;
