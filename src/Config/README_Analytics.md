# VibeLive Analytics Configuration System

This system allows you to easily switch between **Mock Analytics Service** and **Full Analytics Service** implementations using a simple boolean flag.

## 🚀 Quick Start

### Switch Between Services

**Option 1: Edit Configuration File**
```typescript
// In src/Config/AnalyticsConfig.ts
export const USE_MOCK_ANALYTICS = true;  // Use Mock Service
export const USE_MOCK_ANALYTICS = false; // Use Full Service
```

**Option 2: Environment-Based (Automatic)**
```typescript
// Automatically uses Mock in development, respects flag in production
const config = getEnvironmentConfig();
```

## 📊 Service Comparison

| Feature | Mock Service | Full Service |
|---------|-------------|--------------|
| **App Registration** | ✅ No issues | ❌ May cause crashes |
| **Native Dependencies** | ✅ None required | ❌ Requires installation |
| **Real Device Data** | ❌ Mock data only | ✅ Hardware info |
| **Location Tracking** | ❌ Returns undefined | ✅ GPS coordinates |
| **Offline Storage** | ❌ Console only | ✅ AsyncStorage |
| **Network Monitoring** | ❌ Always online | ✅ Real connectivity |
| **Development Speed** | ✅ Fast setup | ❌ Slower setup |
| **Production Ready** | ❌ Limited insights | ✅ Full analytics |

## 🔧 Configuration Options

### Mock Service Settings
```typescript
mock: {
  enableConsoleLogging: true,        // Show events in console
  mockSessionPrefix: 'mock-session-', // Session ID prefix
  mockDeviceId: 'mock-device-id',    // Fixed device ID
  simulateNetworkDelay: false,       // Add artificial delay
  delayMs: 1000,                     // Delay duration
}
```

### Full Service Settings
```typescript
full: {
  enableConsoleLogging: __DEV__,     // Log in development only
  enableOfflineStorage: true,        // Queue events offline
  enableLocationTracking: true,      // Collect GPS data
  enableDeviceInfoCollection: true,  // Collect hardware info
  enableNetworkMonitoring: true,     // Monitor connectivity
  batchSize: 10,                     // Events per batch
  flushIntervalMs: 30000,           // Auto-flush interval
  maxRetries: 3,                     // Retry failed requests
  retryDelayMs: 5000,               // Delay between retries
}
```

## 🛠️ Usage Examples

### Basic Usage (Automatic)
```typescript
import { useAnalytics } from '../Hooks/useAnalytics';

const MyComponent = () => {
  // Automatically uses configured service
  const { trackEvent } = useAnalytics({ screenName: 'MyComponent' });
  
  const handleButtonPress = () => {
    trackEvent('button_pressed', { buttonName: 'submit' });
  };
};
```

### Manual Service Access
```typescript
import { getAnalyticsService } from '../Services/AnalyticsServiceFactory';

const analytics = getAnalyticsService();
analytics.trackEvent('custom_event', { data: 'value' });
```

### Development Debugging
```typescript
import { AnalyticsServiceDebug } from '../Services/AnalyticsServiceFactory';

// Print current service status
AnalyticsServiceDebug.printStatus();

// Get service information
const info = AnalyticsServiceDebug.getInfo();
console.log('Service type:', info.serviceType);

// Reset service (forces recreation)
AnalyticsServiceDebug.reset();
```

## 🔄 Migration Scenarios

### Development → Production
1. **Start with Mock Service** (development)
   ```typescript
   export const USE_MOCK_ANALYTICS = true;
   ```

2. **Install Native Dependencies** (when ready)
   ```bash
   npm install @react-native-community/netinfo
   npm install react-native-device-info
   npm install @react-native-community/geolocation
   npm install @react-native-async-storage/async-storage
   npm install uuid @types/uuid
   ```

3. **Switch to Full Service** (production)
   ```typescript
   export const USE_MOCK_ANALYTICS = false;
   ```

4. **Configure Backend** (production)
   ```typescript
   backend: {
     baseUrl: 'https://your-api.com',
     // ... other settings
   }
   ```

### Troubleshooting Mode
If Full Service causes crashes, temporarily switch back:
```typescript
export const USE_MOCK_ANALYTICS = true; // Emergency fallback
```

## 🧪 Testing Both Services

### Test Mock Service
```typescript
// Set flag to true
export const USE_MOCK_ANALYTICS = true;

// Restart app and check console logs
// Should see: "📊 Mock Analytics Service initialized"
```

### Test Full Service
```typescript
// Set flag to false
export const USE_MOCK_ANALYTICS = false;

// Restart app and check for:
// ✅ "📊 Full Analytics Service initialized"
// ❌ Native dependency errors (if not installed)
```

## 🚨 Common Issues

### "Cannot read property 'useAnalytics' of undefined"
**Cause:** Native dependencies missing for Full Service
**Solution:** Switch to Mock Service temporarily
```typescript
export const USE_MOCK_ANALYTICS = true;
```

### App Registration Errors
**Cause:** Native modules not properly linked
**Solution:** Use Mock Service during development
```typescript
export const USE_MOCK_ANALYTICS = true;
```

### No Analytics Data in Production
**Cause:** Still using Mock Service in production
**Solution:** Switch to Full Service and configure backend
```typescript
export const USE_MOCK_ANALYTICS = false;
backend: { baseUrl: 'https://your-api.com' }
```

## 📱 Console Output Examples

### Mock Service
```
📊 Creating Mock Analytics Service...
📊 Mock Analytics Service initialized
📊 Analytics Event Tracked: { eventType: 'map_marker_clicked', ... }
📊 Analytics Events Flushed: { count: 5, events: [...] }
```

### Full Service
```
📊 Creating Full Analytics Service...
📊 Full Analytics Service initialized
📊 Successfully sent 10 analytics events to backend
📊 Session Started: { sessionId: 'abc-123', deviceInfo: {...} }
```

## 🎯 Best Practices

1. **Use Mock Service for Development**
   - Faster setup and debugging
   - No native dependency issues
   - Full API compatibility

2. **Use Full Service for Production**
   - Real user insights
   - Complete analytics data
   - Business intelligence

3. **Environment-Based Configuration**
   ```typescript
   export const USE_MOCK_ANALYTICS = __DEV__; // Auto-switch
   ```

4. **Gradual Migration**
   - Start with Mock
   - Install dependencies gradually
   - Test Full Service thoroughly
   - Deploy with confidence

## 🔍 Service Status Checking

```typescript
import { AnalyticsServiceDebug } from '../Services/AnalyticsServiceFactory';

// Check current service
const status = AnalyticsServiceDebug.getInfo();
console.log('Current service:', status.serviceType);
console.log('Features available:', status.features);
console.log('Limitations:', status.limitations);
```

This configuration system ensures smooth development while providing a clear path to production-ready analytics! 🚀
