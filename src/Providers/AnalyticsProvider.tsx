import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalyticsService } from '../Services/AnalyticsServiceFactory';

interface AnalyticsContextType {
  isInitialized: boolean;
  sessionId: string;
  trackEvent: (eventType: string, eventData?: Record<string, any>, eventCategory?: string) => Promise<void>;
  trackScreenView: (screenName: string, duration?: number) => Promise<void>;
  trackError: (error: any, context?: Record<string, any>) => Promise<void>;
  updateUserContext: (context: any) => void;
  initializeAnalytics: (baseURL: string, authToken: string, userId: string) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  // Get analytics service from factory (handles Mock/Full service selection)
  const analyticsService = getAnalyticsService();

  useEffect(() => {
    // Track app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        analyticsService.trackEvent('app_foregrounded', {
          timestamp: new Date().toISOString()
        });
      } else if (nextAppState === 'background') {
        analyticsService.trackEvent('app_backgrounded', {
          timestamp: new Date().toISOString()
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Track session start
    analyticsService.trackSessionStart();

    return () => {
      subscription?.remove();
      // Track session end
      analyticsService.trackSessionEnd();
    };
  }, []);

  const initializeAnalytics = async (baseURL: string, authToken: string, userId: string) => {
    try {
      // Configure analytics service
      analyticsService.configure(baseURL, authToken);
      
      // Generate or retrieve session ID
      const storedSessionId = await AsyncStorage.getItem('current_session_id');
      const currentSessionId = storedSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!storedSessionId) {
        await AsyncStorage.setItem('current_session_id', currentSessionId);
      }
      
      setSessionId(currentSessionId);
      setIsInitialized(true);

      // Track initialization
      await analyticsService.trackEvent('analytics_initialized', {
        sessionId: currentSessionId,
        userId,
        timestamp: new Date().toISOString()
      });

      console.log('Analytics Provider initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      await analyticsService.trackError('error_occurred', {
        error: 'Analytics initialization failed',
        details: error
      });
    }
  };

  const trackEvent = async (eventType: string, eventData: Record<string, any> = {}, eventCategory?: string) => {
    try {
      await analyticsService.trackEvent(eventType, {
        ...eventData,
        sessionId
      }, eventCategory);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  const trackScreenView = async (screenName: string, duration?: number) => {
    try {
      await analyticsService.trackScreenView(screenName, duration);
    } catch (error) {
      console.error('Failed to track screen view:', error);
    }
  };

  const trackError = async (error: any, context: Record<string, any> = {}) => {
    try {
      await analyticsService.trackError('error_occurred', {
        error: error.message || error.toString(),
        stack: error.stack,
        ...context,
        sessionId
      });
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  };

  const updateUserContext = (context: any) => {
    analyticsService.updateUserContext(context);
  };

  const contextValue: AnalyticsContextType = {
    isInitialized,
    sessionId,
    trackEvent,
    trackScreenView,
    trackError,
    updateUserContext,
    initializeAnalytics
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

export default AnalyticsProvider;
