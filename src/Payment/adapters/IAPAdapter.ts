import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  type ProductPurchase,
  type Product,
} from 'react-native-iap';
import { PaymentAdapter, BoostTier, PurchaseMetadata, PurchaseResult } from '../PaymentService';
import { baseUrl } from '../../../baseUrl';
import { getLocalData } from '../../Utils/LocalStorageHelper';

// Apple App Store product IDs — must match App Store Connect configuration
// Streaming minutes packages: 30 min, 120 min, 300 min
const IAP_PRODUCT_IDS = [
  'com.vibelive.minutes.30',
  'com.vibelive.minutes.120',
  'com.vibelive.minutes.300',
];

// Map tier IDs to App Store product IDs
const TIER_TO_PRODUCT_ID: Record<string, string> = {
  basic: 'com.vibelive.minutes.30',
  premium: 'com.vibelive.minutes.120',
  ultimate: 'com.vibelive.minutes.300',
};

// Map product IDs to minute counts
const PRODUCT_MINUTES: Record<string, number> = {
  'com.vibelive.minutes.30': 30,
  'com.vibelive.minutes.120': 120,
  'com.vibelive.minutes.300': 300,
};

export { IAP_PRODUCT_IDS, TIER_TO_PRODUCT_ID, PRODUCT_MINUTES };

export class IAPAdapter implements PaymentAdapter {
  private products: Product[] = [];
  private isInitialized = false;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize IAP connection with the App Store
      const canMakePayments = await initConnection();
      console.log('IAP connection established, canMakePayments:', canMakePayments);

      // Fetch real products from the App Store
      const products = await getProducts({ skus: IAP_PRODUCT_IDS });
      this.products = products;
      console.log('IAP products loaded:', products.length, products.map(p => ({
        id: p.productId,
        price: p.localizedPrice,
        title: p.title,
      })));

      if (products.length === 0) {
        console.warn('No IAP products found — verify App Store Connect configuration');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('IAP initialization failed:', error);
      throw new Error('In-App Purchase service unavailable');
    }
  }

  /**
   * Get loaded IAP products for UI display (prices, currency, etc.)
   * Must be called after initialize()
   */
  getLoadedProducts(): Product[] {
    return [...this.products];
  }

  async purchaseBoost(tier: BoostTier, metadata: PurchaseMetadata): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const productId = TIER_TO_PRODUCT_ID[tier.id];
    if (!productId) {
      throw new Error(`Unknown boost tier: ${tier.id}`);
    }

    const product = this.products.find(p => p.productId === productId);
    if (!product) {
      throw new Error(`Product not found in store: ${productId}. Available: ${this.products.map(p => p.productId).join(', ')}`);
    }

    try {
      console.log(`Starting IAP purchase for ${productId} (tier: ${tier.id})`);

      // Request purchase from App Store — this triggers the native payment sheet
      const purchase = await requestPurchase({ sku: productId });

      // Handle the purchase result (can be a single purchase or array)
      if (!purchase) {
        throw new Error('Purchase request returned no result');
      }
      const completedPurchase: ProductPurchase = Array.isArray(purchase) ? purchase[0] : purchase;

      if (!completedPurchase || !completedPurchase.transactionReceipt) {
        throw new Error('Purchase completed but no receipt received');
      }

      console.log('IAP purchase successful, transactionId:', completedPurchase.transactionId);

      // Validate receipt with our backend (server-side validation for security)
      const validationResult = await this.validateReceiptWithBackend(
        completedPurchase.transactionReceipt,
        productId,
        tier.id,
      );

      if (!validationResult.valid) {
        throw new Error(`Receipt validation failed: ${validationResult.reason || 'Unknown'}`);
      }

      // Finish the transaction with Apple (acknowledge the purchase)
      await finishTransaction({ purchase: completedPurchase, isConsumable: true });
      console.log('IAP transaction finished (acknowledged with Apple)');

      return {
        success: true,
        transactionId: completedPurchase.transactionId || `iap_${Date.now()}`,
        price: tier.price,
        duration: tier.duration,
        features: tier.features,
        receipt: completedPurchase.transactionReceipt,
      };
    } catch (error: any) {
      console.error('IAP purchase failed:', error);

      // Handle user cancellation gracefully
      if (error?.code === 'E_USER_CANCELLED' || error?.message?.includes('cancel')) {
        return {
          success: false,
          transactionId: '',
          price: 0,
          duration: 0,
          features: [],
          error: 'Purchase cancelled by user',
        };
      }

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
      await this.initialize();
    }

    try {
      const availablePurchases = await getAvailablePurchases();
      console.log('Restored purchases:', availablePurchases.length);

      const results: PurchaseResult[] = availablePurchases
        .filter(p => IAP_PRODUCT_IDS.includes(p.productId))
        .map(purchase => {
          const tierId = Object.entries(TIER_TO_PRODUCT_ID)
            .find(([_, pid]) => pid === purchase.productId)?.[0] || 'basic';

          return {
            success: true,
            transactionId: purchase.transactionId || '',
            price: 0, // Price not available from restored purchases
            duration: tierId === 'ultimate' ? 12 : tierId === 'premium' ? 6 : 2,
            features: [],
            receipt: purchase.transactionReceipt || '',
          };
        });

      return results;
    } catch (error) {
      console.error('IAP restore failed:', error);
      throw new Error('Failed to restore purchases');
    }
  }

  async validateReceipt(receipt: string): Promise<boolean> {
    try {
      const result = await this.validateReceiptWithBackend(receipt, '', '');
      return result.valid;
    } catch (error) {
      console.error('Receipt validation failed:', error);
      return false;
    }
  }

  /**
   * Validate receipt with our backend server (which then validates with Apple)
   * This is the secure approach — never validate receipts client-side in production
   */
  private async validateReceiptWithBackend(
    receipt: string,
    productId: string,
    tierId: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      const token = await getLocalData({ key: 'token' });

      const response = await fetch(`${baseUrl}users/validate-iap-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': String(token || ''),
        },
        body: JSON.stringify({
          receiptData: receipt,
          productId,
          tierId,
          platform: Platform.OS,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend receipt validation failed:', response.status, errorData);
        return { valid: false, reason: errorData?.error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { valid: data.valid === true, reason: data.reason };
    } catch (error: any) {
      console.error('Backend receipt validation request failed:', error);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Clean up IAP connection — call when the app is shutting down
   */
  async destroy(): Promise<void> {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
    await endConnection();
    this.isInitialized = false;
    console.log('IAP connection ended');
  }
}
