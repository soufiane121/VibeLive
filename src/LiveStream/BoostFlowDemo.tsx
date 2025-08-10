import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { EventSelections } from './EventSelections';
import { PaymentService } from '../Payment/PaymentService';
import { AnalyticsService } from '../Utils/AnalyticsService';

interface BoostPurchaseData {
  tier: 'basic' | 'premium' | 'ultimate';
  duration: number;
  price: number;
  features: string[];
  transactionId: string;
  purchaseTime: Date;
}

export const BoostFlowDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<'menu' | 'flow' | 'results'>('menu');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [lastBoostData, setLastBoostData] = useState<BoostPurchaseData | null>(null);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testPaymentService = async () => {
    addTestResult('Testing Payment Service...');
    
    try {
      // Test IAP adapter
      PaymentService.switchAdapter('iap');
      await PaymentService.initialize();
      addTestResult('✅ IAP Adapter initialized successfully');

      // Test Stripe adapter
      PaymentService.switchAdapter('stripe');
      await PaymentService.initialize();
      addTestResult('✅ Stripe Adapter initialized successfully');

      // Test mock purchase
      const result = await PaymentService.purchaseBoost('premium', {
        category: 'nightlife',
        title: 'Test Stream',
        userId: 'test_user_123',
      });

      if (result.success) {
        addTestResult(`✅ Mock purchase successful: ${result.transactionId}`);
      } else {
        addTestResult(`❌ Mock purchase failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Payment service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testAnalytics = () => {
    addTestResult('Testing Analytics Service...');
    
    // Test various analytics events
    AnalyticsService.track('test_event', { test: true });
    AnalyticsService.trackBoostFunnelStep('category_selection', { category: 'nightlife' });
    AnalyticsService.trackBoostConversion('premium', 7.99, { success: true });
    AnalyticsService.trackUserEngagement('button_click', { button: 'boost_purchase' });
    
    addTestResult('✅ Analytics events tracked successfully');
  };

  const handleEventSelection = (category: string, boostData?: BoostPurchaseData) => {
    if (boostData) {
      setLastBoostData(boostData);
      addTestResult(`✅ Boost flow completed! Category: ${category}, Tier: ${boostData.tier}, Price: $${boostData.price}`);
    } else {
      addTestResult(`ℹ️ Category selected without boost: ${category}`);
    }
    setCurrentView('results');
  };

  const resetDemo = () => {
    setCurrentView('menu');
    setTestResults([]);
    setLastBoostData(null);
  };

  if (currentView === 'flow') {
    return (
      <EventSelections
        onCompleteSelection={handleEventSelection}
        onTitleChange={(title) => addTestResult(`Title changed: ${title}`)}
      />
    );
  }

  if (currentView === 'results') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎉 Demo Results</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetDemo}>
            <Text style={styles.resetButtonText}>Reset Demo</Text>
          </TouchableOpacity>
        </View>

        {lastBoostData && (
          <View style={styles.boostSummary}>
            <Text style={styles.sectionTitle}>Boost Purchase Summary</Text>
            <Text style={styles.resultText}>Tier: {lastBoostData.tier}</Text>
            <Text style={styles.resultText}>Price: ${lastBoostData.price}</Text>
            <Text style={styles.resultText}>Duration: {lastBoostData.duration} hours</Text>
            <Text style={styles.resultText}>Transaction: {lastBoostData.transactionId}</Text>
            <Text style={styles.resultText}>Features: {lastBoostData.features.join(', ')}</Text>
          </View>
        )}

        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Test Log</Text>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.logText}>
              {result}
            </Text>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Boost Flow Demo</Text>
        <Text style={styles.subtitle}>Test the enhanced "Go Live" experience</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentView('flow')}>
          <Text style={styles.primaryButtonText}>Start Boost Flow Demo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={testPaymentService}>
          <Text style={styles.secondaryButtonText}>Test Payment Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={testAnalytics}>
          <Text style={styles.secondaryButtonText}>Test Analytics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Demo Features</Text>
        <Text style={styles.infoText}>• FOMO-driven 3-step conversion flow</Text>
        <Text style={styles.infoText}>• Live countdown timers and urgency</Text>
        <Text style={styles.infoText}>• Scarcity visualization (limited slots)</Text>
        <Text style={styles.infoText}>• Social proof and competitor warnings</Text>
        <Text style={styles.infoText}>• Three boost tiers with strategic pricing</Text>
        <Text style={styles.infoText}>• Celebratory confirmation screen</Text>
        <Text style={styles.infoText}>• Comprehensive analytics tracking</Text>
      </View>

      {testResults.length > 0 && (
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Recent Test Results</Text>
          {testResults.slice(-5).map((result, index) => (
            <Text key={index} style={styles.logText}>
              {result}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#FF1493',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#00FFFF',
  },
  resetButton: {
    backgroundColor: 'rgba(255,69,0,0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#FF4500',
  },
  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 8,
    lineHeight: 20,
  },
  logSection: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  logText: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  boostSummary: {
    backgroundColor: 'rgba(255,20,147,0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,20,147,0.3)',
  },
  resultText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
});
