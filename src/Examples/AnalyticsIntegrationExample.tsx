import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAnalytics } from '../Hooks/useAnalytics';
import { useMapAnalytics } from '../Components/MapAnalytics';
import { useStreamAnalytics } from '../Components/StreamAnalytics';
import { useSocialAnalytics } from '../Components/SocialAnalytics';
import { useAnalyticsContext } from '../Providers/AnalyticsProvider';
import AnalyticsDashboard from '../Components/AnalyticsDashboard';

/**
 * Comprehensive example showing how to integrate analytics throughout the VibeLive app
 * This demonstrates the complete analytics system in action
 */

interface ExampleStreamData {
  streamId: string;
  streamerId: string;
  title: string;
  category: string;
  coordinates: [number, number];
  viewerCount: number;
  isBoosted: boolean;
  isLive: boolean;
}

interface ExampleMarkerData {
  id: string;
  coordinates: [number, number];
  type: string;
  streamId: string;
  userId: string;
  category: string;
  title: string;
  isLive: boolean;
  viewerCount: number;
  isBoosted: boolean;
}

export const AnalyticsIntegrationExample: React.FC = () => {
  const { isInitialized, initializeAnalytics, trackEvent } = useAnalyticsContext();
  const { trackEvent: trackScreenEvent } = useAnalytics({ screenName: 'AnalyticsExample' });
  const mapAnalytics = useMapAnalytics();
  const streamAnalytics = useStreamAnalytics();
  const socialAnalytics = useSocialAnalytics();
  
  const [showDashboard, setShowDashboard] = useState(false);

  // Example stream data
  const exampleStream: ExampleStreamData = {
    streamId: 'stream_123',
    streamerId: 'user_456',
    title: 'Amazing Live Stream',
    category: 'music',
    coordinates: [-122.4194, 37.7749],
    viewerCount: 42,
    isBoosted: true,
    isLive: true
  };

  // Example marker data
  const exampleMarker: ExampleMarkerData = {
    id: 'marker_789',
    coordinates: [-122.4194, 37.7749],
    type: 'live_stream',
    streamId: 'stream_123',
    userId: 'user_456',
    category: 'music',
    title: 'Amazing Live Stream',
    isLive: true,
    viewerCount: 42,
    isBoosted: true
  };

  useEffect(() => {
    // Initialize analytics when component mounts
    if (!isInitialized) {
      initializeAnalyticsExample();
    }
  }, []);

  const initializeAnalyticsExample = async () => {
    try {
      // Replace with your actual backend URL and auth token
      const backendURL = 'https://your-api.com';
      const authToken = 'your-jwt-token';
      const userId = 'example-user-123';
      
      await initializeAnalytics(backendURL, authToken, userId);
      
      Alert.alert('Success', 'Analytics initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      Alert.alert('Error', 'Failed to initialize analytics');
    }
  };

  // Example: Track custom app events
  const handleCustomEvent = async () => {
    await trackEvent('custom_button_pressed', {
      buttonName: 'analytics_example',
      timestamp: new Date().toISOString()
    });
    
    Alert.alert('Event Tracked', 'Custom event has been tracked!');
  };

  // Example: Track map interactions
  const handleMapInteraction = async () => {
    // Track marker click
    await mapAnalytics.trackMarkerClick(exampleMarker);
    
    // Track map movement
    await mapAnalytics.trackMapMove(
      [-122.4194, 37.7749],
      { north: 37.8, south: 37.7, east: -122.4, west: -122.5 }
    );
    
    // Track category filter
    await mapAnalytics.trackCategoryFilter('music', [-122.4194, 37.7749], 5);
    
    // Track search
    await mapAnalytics.trackSearch('live music', [-122.4194, 37.7749], 3, 'music');
    
    Alert.alert('Map Analytics', 'Map interactions have been tracked!');
  };

  // Example: Track stream interactions
  const handleStreamInteraction = async () => {
    // Track stream join
    await streamAnalytics.trackStreamJoin(exampleStream, 'map_click');
    
    // Simulate watching for a few seconds
    setTimeout(async () => {
      // Track chat message
      await streamAnalytics.trackChatMessage({
        streamId: exampleStream.streamId,
        message: 'Great stream!',
        type: 'text'
      });
      
      // Track reaction
      await streamAnalytics.trackReaction({
        streamId: exampleStream.streamId,
        emoji: '👏'
      });
      
      // Track stream leave
      await streamAnalytics.trackStreamLeave('user_action');
      
      Alert.alert('Stream Analytics', 'Stream interactions have been tracked!');
    }, 2000);
  };

  // Example: Track social interactions
  const handleSocialInteraction = async () => {
    // Track message sent
    await socialAnalytics.trackMessageSent({
      messageId: 'msg_123',
      streamId: exampleStream.streamId,
      senderId: 'user_456',
      content: 'Hello everyone! 👋',
      type: 'text',
      timestamp: new Date()
    });
    
    // Track reaction sent
    await socialAnalytics.trackReactionSent({
      reactionId: 'reaction_456',
      streamId: exampleStream.streamId,
      userId: 'user_456',
      emoji: '❤️',
      targetType: 'stream',
      targetId: exampleStream.streamId,
      timestamp: new Date()
    });
    
    // Track profile view
    await socialAnalytics.trackProfileView(
      {
        userId: 'user_789',
        username: 'cool_streamer',
        followerCount: 1250,
        isVerified: true
      },
      'chat_click',
      5
    );
    
    Alert.alert('Social Analytics', 'Social interactions have been tracked!');
  };

  // Example: Track boost/monetization events
  const handleBoostEvent = async () => {
    // Track boost intro view
    await trackScreenEvent('boost_intro_viewed', {
      category: exampleStream.category,
      timeLeft: 1847, // 30:47 remaining
      premiumSlotsLeft: 3,
      competingStreamers: 47
    });
    
    // Track tier selection
    await trackEvent('boost_tier_selected', {
      tier: 'Prime Time',
      price: 7.99,
      duration: 6,
      category: exampleStream.category,
      timestamp: new Date().toISOString()
    });
    
    // Track payment initiation
    await trackEvent('payment_initiated', {
      tier: 'Prime Time',
      price: 7.99,
      paymentMethod: 'apple_pay',
      timestamp: new Date().toISOString()
    });
    
    Alert.alert('Boost Analytics', 'Boost events have been tracked!');
  };

  // Example: Track error events
  const handleErrorTracking = async () => {
    try {
      // Simulate an error
      throw new Error('Example error for analytics tracking');
    } catch (error: any) {
      await trackEvent('error_occurred', {
        errorType: 'example_error',
        errorMessage: error.message,
        errorStack: error.stack,
        context: {
          screen: 'AnalyticsExample',
          action: 'handleErrorTracking'
        },
        timestamp: new Date().toISOString()
      });
      
      Alert.alert('Error Analytics', 'Error has been tracked!');
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Analytics Integration Example</Text>
        <Text style={styles.subtitle}>Analytics not initialized</Text>
        <TouchableOpacity style={styles.button} onPress={initializeAnalyticsExample}>
          <Text style={styles.buttonText}>Initialize Analytics</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showDashboard) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={() => setShowDashboard(false)}
        >
          <Text style={styles.buttonText}>← Back to Examples</Text>
        </TouchableOpacity>
        <AnalyticsDashboard 
          timeRange="week" 
          showDetailedMetrics={true} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics Integration Example</Text>
      <Text style={styles.subtitle}>
        Comprehensive analytics tracking demonstration
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleCustomEvent}>
          <Text style={styles.buttonText}>Track Custom Event</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleMapInteraction}>
          <Text style={styles.buttonText}>Track Map Interactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleStreamInteraction}>
          <Text style={styles.buttonText}>Track Stream Interactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSocialInteraction}>
          <Text style={styles.buttonText}>Track Social Interactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleBoostEvent}>
          <Text style={styles.buttonText}>Track Boost Events</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleErrorTracking}>
          <Text style={styles.buttonText}>Track Error Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dashboardButton]} 
          onPress={() => setShowDashboard(true)}
        >
          <Text style={styles.buttonText}>View Analytics Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Analytics Features Demonstrated:</Text>
        <Text style={styles.infoText}>• Custom event tracking</Text>
        <Text style={styles.infoText}>• Map interaction analytics</Text>
        <Text style={styles.infoText}>• Stream viewing analytics</Text>
        <Text style={styles.infoText}>• Social interaction tracking</Text>
        <Text style={styles.infoText}>• Boost/monetization events</Text>
        <Text style={styles.infoText}>• Error tracking</Text>
        <Text style={styles.infoText}>• Real-time dashboard</Text>
        <Text style={styles.infoText}>• Offline event queuing</Text>
        <Text style={styles.infoText}>• Session management</Text>
        <Text style={styles.infoText}>• Device info collection</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#666',
    marginBottom: 10,
  },
  dashboardButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default AnalyticsIntegrationExample;
