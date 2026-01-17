import { Platform } from 'react-native';
import { PaymentAdapter, BoostTier, PurchaseMetadata, PurchaseResult } from '../PaymentService';

// Mock IAP implementation - replace with react-native-iap in production
interface IAPProduct {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
}

interface IAPPurchase {
  transactionId: string;
  productId: string;
  transactionReceipt: string;
  purchaseTime: number;
}

export class IAPAdapter implements PaymentAdapter {
  private products: IAPProduct[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // In production, use react-native-iap
      // await RNIap.initConnection();
      
      // Mock product setup
      this.products = [
        {
          productId: 'boost_basic',
          price: '$2.99',
          currency: 'USD',
          title: 'Visibility Boost',
          description: '2-hour stream boost with 2x visibility',
        },
        {
          productId: 'boost_premium',
          price: '$7.99',
          currency: 'USD',
          title: 'Prime Time Boost',
          description: '6-hour stream boost with 5x visibility',
        },
        {
          productId: 'boost_ultimate',
          price: '$14.99',
          currency: 'USD',
          title: 'Viral Mode Boost',
          description: '12-hour stream boost with 10x visibility',
        },
      ];

      this.isInitialized = true;
      console.log('IAP Adapter initialized with products:', this.products.length);
    } catch (error) {
      console.error('IAP initialization failed:', error);
      throw new Error('In-App Purchase service unavailable');
    }
  }

  async purchaseBoost(tier: BoostTier, metadata: PurchaseMetadata): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      throw new Error('IAP not initialized');
    }

    const productId = `boost_${tier.id}`;
    const product = this.products.find(p => p.productId === productId);
    
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    try {
      // In production, use react-native-iap
      // const purchase = await RNIap.requestPurchase(productId);
      
      // Mock purchase for development
      const mockPurchase: IAPPurchase = {
        transactionId: `iap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId,
        transactionReceipt: this.generateMockReceipt(),
        purchaseTime: Date.now(),
      };

      // Simulate purchase delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Validate purchase (in production, validate with Apple/Google)
      const isValid = await this.validatePurchase(mockPurchase);
      
      if (!isValid) {
        throw new Error('Purchase validation failed');
      }

      return {
        success: true,
        transactionId: mockPurchase.transactionId,
        price: tier.price,
        duration: tier.duration,
        features: tier.features,
        receipt: mockPurchase.transactionReceipt,
      };
    } catch (error) {
      console.error('IAP purchase failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        transactionId: '',
        price: 0,
        duration: 0,
        features: [],
        error: errorMessage,
      };
    }
  }

  async restorePurchases(): Promise<PurchaseResult[]> {
    if (!this.isInitialized) {
      throw new Error('IAP not initialized');
    }

    try {
      // In production, use react-native-iap
      // const purchases = await RNIap.getAvailablePurchases();
      
      // Mock restore for development
      const mockPurchases: PurchaseResult[] = [];
      
      return mockPurchases;
    } catch (error) {
      console.error('IAP restore failed:', error);
      throw new Error('Failed to restore purchases');
    }
  }

  async validateReceipt(receipt: string): Promise<boolean> {
    try {
      // In production, validate with Apple/Google servers
      // For iOS: https://buy.itunes.apple.com/verifyReceipt
      // For Android: Google Play Developer API
      
      // Mock validation
      return receipt.startsWith('mock_receipt_');
    } catch (error) {
      console.error('Receipt validation failed:', error);
      return false;
    }
  }

  private async validatePurchase(purchase: IAPPurchase): Promise<boolean> {
    try {
      // In production, validate with platform stores
      if (Platform.OS === 'ios') {
        // Validate with Apple App Store
        return await this.validateWithApple(purchase.transactionReceipt);
      } else if (Platform.OS === 'android') {
        // Validate with Google Play Store
        return await this.validateWithGoogle(purchase.transactionReceipt);
      }
      
      // Mock validation for development
      return true;
    } catch (error) {
      console.error('Purchase validation error:', error);
      return false;
    }
  }

  private async validateWithApple(receipt: string): Promise<boolean> {
    try {
      // In production, send receipt to Apple's verification servers
      const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'receipt-data': receipt,
          'password': process.env.APPLE_SHARED_SECRET, // Your app's shared secret
        }),
      });

      const data = await response.json();
      return data.status === 0; // 0 means valid receipt
    } catch (error) {
      console.error('Apple receipt validation failed:', error);
      return false;
    }
  }

  private async validateWithGoogle(receipt: string): Promise<boolean> {
    try {
      // In production, validate with Google Play Developer API
      // This requires server-side validation for security
      return true; // Mock validation
    } catch (error) {
      console.error('Google receipt validation failed:', error);
      return false;
    }
  }

  private generateMockReceipt(): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 16);
    return `mock_receipt_${timestamp}_${randomId}`;
  }
}
