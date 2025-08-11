/**
 * Analytics Configuration Test Component
 * 
 * This component tests the analytics configuration system and service switching.
 * Use this to verify that Mock/Full service switching works correctly.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAnalytics } from './Hooks/useAnalytics';
import { 
  getAnalyticsService, 
  AnalyticsServiceDebug 
} from './Services/AnalyticsServiceFactory';
import { 
  USE_MOCK_ANALYTICS, 
  getEnvironmentConfig, 
  getServiceInfo,
  AnalyticsDebug 
} from './Config/AnalyticsConfig';

interface ServiceStatus {
  serviceType: 'mock' | 'full' | null;
  isInitialized: boolean;
  configuredService: 'mock' | 'full';
  environment: string;
  features: {
    realDeviceInfo: boolean;
    locationTracking: boolean;
    offlineStorage: boolean;
    networkMonitoring: boolean;
    consoleLogging: boolean;
  };
  limitations: string[];
  configuration: any;
}

const AnalyticsConfigTest: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use analytics hook for testing
  const { 
    trackEvent, 
    trackMapInteraction, 
    trackStreamInteraction,
    trackSocialInteraction,
    trackBoostEvent,
    trackError 
  } = useAnalytics({ screenName: 'AnalyticsConfigTest' });

  useEffect(() => {
    loadServiceStatus();
    AnalyticsDebug.printConfig(); // Print config to console
  }, []);

  const loadServiceStatus = () => {
    try {
      const status = AnalyticsServiceDebug.getInfo();
      // Type cast configuredService to match expected union type
      const typedStatus: ServiceStatus = {
        ...status,
        configuredService: status.configuredService as 'mock' | 'full'
      };
      setServiceStatus(typedStatus);
      addTestResult(`✅ Service Status Loaded: ${status.serviceType}`);
    } catch (error) {
      addTestResult(`❌ Failed to load service status: ${error}`);
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testBasicAnalytics = async () => {
    setIsLoading(true);
    try {
      await trackEvent('config_test_basic', { 
        testType: 'basic_analytics',
        timestamp: Date.now() 
      });
      addTestResult('✅ Basic analytics event tracked');
    } catch (error) {
      addTestResult(`❌ Basic analytics failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testMapAnalytics = async () => {
    setIsLoading(true);
    try {
      await trackMapInteraction('marker_clicked', {
        markerId: 'test-marker-123',
        coordinates: [-122.4194, 37.7749],
        streamInfo: { title: 'Test Stream', category: 'music' }
      });
      addTestResult('✅ Map interaction analytics tracked');
    } catch (error) {
      addTestResult(`❌ Map analytics failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testStreamAnalytics = async () => {
    setIsLoading(true);
    try {
      await trackStreamInteraction('join', {
        streamId: 'test-stream-456',
        streamTitle: 'Test Stream',
        category: 'gaming',
        viewerCount: 42
      });
      addTestResult('✅ Stream interaction analytics tracked');
    } catch (error) {
      addTestResult(`❌ Stream analytics failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testSocialAnalytics = async () => {
    setIsLoading(true);
    try {
      await trackSocialInteraction('message_sent', {
        messageType: 'text',
        messageLength: 25,
        streamId: 'test-stream-789'
      });
      addTestResult('✅ Social interaction analytics tracked');
    } catch (error) {
      addTestResult(`❌ Social analytics failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testBoostAnalytics = async () => {
    setIsLoading(true);
    try {
      await trackBoostEvent('boost_tier_selected', {
        tier: 'premium',
        price: 7.99,
        duration: 6
      });
      addTestResult('✅ Boost event analytics tracked');
    } catch (error) {
      addTestResult(`❌ Boost analytics failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testErrorAnalytics = async () => {
    setIsLoading(true);
    try {
      await trackError('error_occurred', {
        errorType: 'test_error',
        errorMessage: 'This is a test error',
        errorCode: 'TEST_001'
      });
      addTestResult('✅ Error analytics tracked');
    } catch (error) {
      addTestResult(`❌ Error analytics failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testServiceDirectAccess = async () => {
    setIsLoading(true);
    try {
      const analytics = getAnalyticsService();
      await analytics.trackEvent('direct_service_test', {
        accessMethod: 'direct',
        timestamp: Date.now()
      });
      addTestResult('✅ Direct service access worked');
    } catch (error) {
      addTestResult(`❌ Direct service access failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testServiceReset = () => {
    try {
      AnalyticsServiceDebug.reset();
      loadServiceStatus();
      addTestResult('✅ Service reset completed');
    } catch (error) {
      addTestResult(`❌ Service reset failed: ${error}`);
    }
  };

  const runAllTests = async () => {
    clearResults();
    addTestResult('🚀 Starting comprehensive analytics test...');
    
    await testBasicAnalytics();
    await testMapAnalytics();
    await testStreamAnalytics();
    await testSocialAnalytics();
    await testBoostAnalytics();
    await testErrorAnalytics();
    await testServiceDirectAccess();
    
    addTestResult('✅ All tests completed!');
  };

  const showConfigurationInfo = () => {
    const config = getEnvironmentConfig();
    const serviceInfo = getServiceInfo();
    
    Alert.alert(
      'Analytics Configuration',
      `Service Type: ${serviceInfo.serviceType}\n` +
      `Environment: ${serviceInfo.environment}\n` +
      `Use Mock: ${config.useMockService}\n` +
      `Features: ${Object.entries(serviceInfo.features).filter(([_, enabled]) => enabled).map(([feature, _]) => feature).join(', ')}\n` +
      `Limitations: ${serviceInfo.limitations.join(', ')}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Configuration Test</Text>
        <Text style={styles.subtitle}>
          Current Flag: USE_MOCK_ANALYTICS = {USE_MOCK_ANALYTICS.toString()}
        </Text>
      </View>

      {/* Service Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Status</Text>
        {serviceStatus && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Type: <Text style={styles.highlight}>{serviceStatus.serviceType}</Text>
            </Text>
            <Text style={styles.statusText}>
              Environment: <Text style={styles.highlight}>{serviceStatus.environment}</Text>
            </Text>
            <Text style={styles.statusText}>
              Initialized: <Text style={styles.highlight}>{serviceStatus.isInitialized ? 'Yes' : 'No'}</Text>
            </Text>
            <Text style={styles.statusText}>
              Features: <Text style={styles.highlight}>{Object.entries(serviceStatus.features).filter(([_, enabled]) => enabled).map(([feature, _]) => feature).join(', ')}</Text>
            </Text>
            {serviceStatus.limitations.length > 0 && (
              <Text style={styles.warningText}>
                Limitations: {serviceStatus.limitations.join(', ')}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Individual Tests</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testBasicAnalytics}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Basic Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testMapAnalytics}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Map Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testStreamAnalytics}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Stream Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testSocialAnalytics}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Social Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testBoostAnalytics}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Boost Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testErrorAnalytics}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Error Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Controls</Text>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={showConfigurationInfo}
        >
          <Text style={styles.secondaryButtonText}>Show Config Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={testServiceReset}
        >
          <Text style={styles.secondaryButtonText}>Reset Service</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={clearResults}
        >
          <Text style={styles.secondaryButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <View style={styles.resultsContainer}>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No test results yet. Run some tests!</Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Check console logs for detailed analytics output
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  statusContainer: {
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 5,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  warningText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  testButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#95a5a6',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: '#2c3e50',
    padding: 10,
    borderRadius: 5,
    maxHeight: 300,
  },
  noResults: {
    color: '#bdc3c7',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resultText: {
    color: '#ecf0f1',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});

export default AnalyticsConfigTest;
