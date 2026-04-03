import { Platform } from 'react-native';
import { IAPAdapter } from './adapters/IAPAdapter';
import { StripeAdapter } from './adapters/StripeAdapter';
import { AnalyticsService } from '../Utils/AnalyticsService';

export interface PaymentAdapter {
  initialize(): Promise<void>;
  purchaseBoost(tier: BoostTier, metadata: PurchaseMetadata): Promise<PurchaseResult>;
  restorePurchases(): Promise<PurchaseResult[]>;
  validateReceipt(receipt: string): Promise<boolean>;
}

export interface BoostTier {
  id: 'basic' | 'premium' | 'ultimate';
  price: number;
  duration: number;
  features: string[];
}

export interface PurchaseMetadata {
  category: string;
  title: string;
  userId: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionId: string;
  price: number;
  duration: number;
  features: string[];
  receipt?: string;
  error?: string;
}

class PaymentServiceClass {
  private adapter: PaymentAdapter;
  private initialized = false;

  constructor() {
    // Choose adapter based on platform and user preference
    // For now, defaulting to IAP for mobile, Stripe for web
    this.adapter = Platform.OS === 'web' 
      ? new StripeAdapter() 
      : new IAPAdapter();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.adapter.initialize();
      this.initialized = true;
      
      AnalyticsService.track('payment_service_initialized', {
        adapter: this.adapter.constructor.name,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Payment service initialization failed:', error);
      throw new Error('Payment service unavailable');
    }
  }

  async purchaseBoost(
    tier: 'basic' | 'premium' | 'ultimate',
    metadata: PurchaseMetadata
  ): Promise<PurchaseResult> {
    await this.initialize();

    const boostTiers: Record<string, BoostTier> = {
      basic: {
        id: 'basic',
        price: 2.99,
        duration: 30,
        features: ['30 streaming minutes'],
      },
      premium: {
        id: 'premium',
        price: 7.99,
        duration: 120,
        features: ['120 streaming minutes'],
      },
      ultimate: {
        id: 'ultimate',
        price: 14.99,
        duration: 300,
        features: ['300 streaming minutes'],
      },
    };

    const boostTier = boostTiers[tier];
    if (!boostTier) {
      throw new Error(`Invalid boost tier: ${tier}`);
    }

    AnalyticsService.track('boost_purchase_started', {
      tier,
      price: boostTier.price,
      category: metadata.category,
      userId: metadata.userId,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await this.adapter.purchaseBoost(boostTier, metadata);
      
      if (result.success) {
        // Send to backend to activate boost
        await this.activateBoostOnServer(result, metadata);
        
        AnalyticsService.track('boost_purchase_completed', {
          tier,
          transactionId: result.transactionId,
          price: result.price,
          category: metadata.category,
          userId: metadata.userId,
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      AnalyticsService.track('boost_purchase_error', {
        tier,
        error: error.message,
        category: metadata.category,
        userId: metadata.userId,
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    }
  }

  private async activateBoostOnServer(
    purchaseResult: PurchaseResult,
    metadata: PurchaseMetadata
  ): Promise<void> {
    try {
      const response = await fetch('/api/boost-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${metadata.userId}`, // Replace with actual auth token
        },
        body: JSON.stringify({
          transactionId: purchaseResult.transactionId,
          tier: purchaseResult.features.length > 3 ? 'ultimate' : 
                purchaseResult.features.length > 2 ? 'premium' : 'basic',
          duration: purchaseResult.duration,
          price: purchaseResult.price,
          category: metadata.category,
          title: metadata.title,
          receipt: purchaseResult.receipt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server activation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Boost activated on server:', data);
    } catch (error) {
      console.error('Failed to activate boost on server:', error);
      // Don't throw here - the purchase was successful, just log the server error
      AnalyticsService.track('boost_server_activation_failed', {
        transactionId: purchaseResult.transactionId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async restorePurchases(): Promise<PurchaseResult[]> {
    await this.initialize();
    return this.adapter.restorePurchases();
  }

  async validateReceipt(receipt: string): Promise<boolean> {
    await this.initialize();
    return this.adapter.validateReceipt(receipt);
  }

  // Switch payment method (useful for testing or user preference)
  switchAdapter(adapterType: 'iap' | 'stripe'): void {
    this.initialized = false;
    this.adapter = adapterType === 'stripe' 
      ? new StripeAdapter() 
      : new IAPAdapter();
  }
}

export const PaymentService = new PaymentServiceClass();
