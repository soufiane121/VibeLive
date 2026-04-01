import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAnalytics } from './Hooks/useAnalytics';
import { useAnalyticsContext } from './Providers/AnalyticsProvider';

/**
 * Comprehensive Analytics Test Component
 * Use this to test all analytics functionality in your VibeLive app
 */
export const AnalyticsTest: React.FC = () => {
  const { isInitialized, sessionId } = useAnalyticsContext();
  const { trackEvent } = useAnalytics({ screenName: 'AnalyticsTest', trackScreenView: true });
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testMapAnalytics = async () => {
    try {
      await trackEvent('marker_clicked', {
        markerId: 'test-marker-123',
        coordinates: [-80.773202, 35.216109],
        streamId: 'test-stream-456',
        isLive: true,
        viewerCount: 42,
        isBoosted: true,
        timestamp: new Date().toISOString()
      });
      addResult('✅ Map marker click tracked successfully');
    } catch (error) {
      addResult(`❌ Map analytics failed: ${error.message}`);
    }
  };

  const testStreamAnalytics = async () => {
    try {
      await trackEvent('stream_joined', {
        streamId: 'test-stream-789',
        streamerId: 'test-user-123',
        joinMethod: 'map_click',
        category: 'music',
        viewerCount: 25,
        timestamp: new Date().toISOString()
      });
      addResult('✅ Stream join tracked successfully');
    } catch (error) {
      addResult(`❌ Stream analytics failed: ${error.message}`);
    }
  };

  const testSocialAnalytics = async () => {
    try {
      await trackEvent('message_sent', {
        messageId: 'test-msg-456',
        streamId: 'test-stream-789',
        messageLength: 15,
        messageType: 'text',
        hasEmojis: true,
        timestamp: new Date().toISOString()
      });
      addResult('✅ Social message tracked successfully');
    } catch (error) {
      addResult(`❌ Social analytics failed: ${error.message}`);
    }
  };

  const testBoostAnalytics = async () => {
    try {
      await trackEvent('boost_tier_selected', {
        tier: 'premium',
        price: 7.99,
        category: 'music',
        timestamp: new Date().toISOString()
      });
      addResult('✅ Boost analytics tracked successfully');
    } catch (error) {
      addResult(`❌ Boost analytics failed: ${error.message}`);
    }
  };

  const testErrorTracking = async () => {
    try {
      await trackEvent('error_occurred', {
        errorType: 'test_error',
        errorMessage: 'This is a test error for analytics',
        context: {
          screen: 'AnalyticsTest',
          action: 'testErrorTracking'
        },
        timestamp: new Date().toISOString()
      });
      addResult('✅ Error tracking tested successfully');
    } catch (error) {
      addResult(`❌ Error tracking failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult('🚀 Starting comprehensive analytics test...');
    
    if (!isInitialized) {
      addResult('❌ Analytics not initialized - check AnalyticsProvider setup');
      return;
    }

    addResult(`📊 Session ID: ${sessionId}`);
    
    await testMapAnalytics();
    await testStreamAnalytics();
    await testSocialAnalytics();
    await testBoostAnalytics();
    await testErrorTracking();
    
    addResult('✨ All analytics tests completed!');
    Alert.alert('Analytics Test', 'All tests completed! Check the results below.');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Analytics Test</Text>
        <Text style={styles.errorText}>
          ❌ Analytics not initialized
        </Text>
        <Text style={styles.subtitle}>
          Make sure AnalyticsProvider is properly set up and user is logged in.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>VibeLive Analytics Test</Text>
      <Text style={styles.subtitle}>
        Session ID: {sessionId}
      </Text>
      <Text style={styles.subtitle}>
        Status: ✅ Analytics Initialized
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={runAllTests}>
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testMapAnalytics}>
          <Text style={styles.buttonText}>Test Map Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testStreamAnalytics}>
          <Text style={styles.buttonText}>Test Stream Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testSocialAnalytics}>
          <Text style={styles.buttonText}>Test Social Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testBoostAnalytics}>
          <Text style={styles.buttonText}>Test Boost Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testErrorTracking}>
          <Text style={styles.buttonText}>Test Error Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
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
    marginBottom: 20,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#ff3b30',
    marginBottom: 10,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    minHeight: 200,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  noResults: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default AnalyticsTest;
