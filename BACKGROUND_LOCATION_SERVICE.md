# Background Location Service

A production-ready background location tracking service for VibeLive using expo-location and expo-task-manager.

## Overview

The BackgroundLocationService provides comprehensive location tracking capabilities for both foreground and background states, with support for:
- Real-time location updates
- Background task management
- Permission handling (foreground and background)
- Battery-optimized configuration
- Cross-platform support (iOS and Android)
- Integration with existing GeofenceMonitorService

## Features

- **Foreground Tracking**: High-accuracy location updates when app is active
- **Background Tracking**: Continuous location updates using expo-task-manager
- **Permission Management**: Automatic request and handling of location permissions
- **Battery Optimization**: Configurable update intervals and distance filters
- **Error Handling**: Comprehensive error handling and logging
- **Callback System**: Event-driven architecture for location updates
- **Singleton Pattern**: Single instance management for consistency
- **App State Awareness**: Automatic switching between foreground/background tracking

## Installation

The service uses the following packages (already installed in VibeLive):

```json
{
  "expo-location": "~17.0.1",
  "expo-task-manager": "~11.8.2"
}
```

## Platform Configuration

### iOS Configuration

The following entries are already configured in `ios/VibeLive/Info.plist`:

```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>VibeLive needs access to your location even when the app is in the background to discover nearby venues and send you notifications about hot spots in your area.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>VibeLive needs access to your location to discover nearby venues, show you live streams in your area, and provide personalized nightlife recommendations.</string>

<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
    <string>fetch</string>
    <string>location</string>
</array>
```

### Android Configuration

The following permissions are already configured in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

## Usage

### Basic Usage with useGetLocation Hook

```typescript
import useGetLocation from '../CustomHooks/useGetLocation';

function MyComponent() {
  const {
    coordinates,
    hasPermission,
    permissionStatus,
    startTracking,
    stopTracking,
    isTracking,
    lastKnownLocation,
  } = useGetLocation();

  useEffect(() => {
    if (!hasPermission) {
      requestLocationPermission();
    }
  }, [hasPermission]);

  return (
    <View>
      <Text>Latitude: {coordinates[1]}</Text>
      <Text>Longitude: {coordinates[0]}</Text>
      <Text>Tracking: {isTracking ? 'Active' : 'Inactive'}</Text>
    </View>
  );
}
```

### Advanced Usage with BackgroundLocationService

```typescript
import BackgroundLocationService, {
  LocationCoordinates,
  LocationPermissionStatus,
} from '../Services/BackgroundLocationService';

// Get singleton instance
const locationService = BackgroundLocationService.getInstance();

// Initialize and request permissions
const permissionStatus = await locationService.initialize();
if (permissionStatus === 'granted') {
  console.log('Location permission granted');
}

// Start foreground tracking
const success = await locationService.startForegroundTracking();
if (success) {
  console.log('Foreground tracking started');
}

// Start background tracking
const backgroundSuccess = await locationService.startBackgroundTracking();
if (backgroundSuccess) {
  console.log('Background tracking started');
}

// Get current location once
const currentLocation = await locationService.getCurrentLocation();
console.log('Current location:', currentLocation);

// Subscribe to location updates
const unsubscribe = locationService.onLocationUpdate((location: LocationCoordinates) => {
  console.log('Location update:', location);
  // Handle location update
  geofenceMonitor.sendManualPosition(location.latitude, location.longitude);
});

// Stop tracking
await locationService.stopTracking();

// Unsubscribe from updates
unsubscribe();

// Get last known location
const lastKnown = locationService.getLastKnownLocation();
console.log('Last known location:', lastKnown);
```

### Configuration Options

```typescript
import BackgroundLocationService from '../Services/BackgroundLocationService';

const locationService = BackgroundLocationService.getInstance({
  updateInterval: 30000,        // 30 seconds between updates
  minimumDistance: 10,         // 10 meters minimum distance
  accuracy: Location.Accuracy.Balanced,
  showBackgroundIndicator: true,
});
```

## API Reference

### BackgroundLocationService Class

#### Static Methods

- `getInstance(config?: LocationServiceConfig): BackgroundLocationService`
  - Returns the singleton instance of the service
  - Optionally accepts configuration on first call

#### Instance Methods

##### `async initialize(): Promise<LocationPermissionStatus>`
Initializes the service and requests location permissions.

**Returns**: Promise with permission status ('granted' | 'denied' | 'undetermined' | 'limited')

##### `async startForegroundTracking(): Promise<boolean>`
Starts location tracking in the foreground.

**Returns**: Promise indicating success or failure

##### `async startBackgroundTracking(): Promise<boolean>`
Starts location tracking in the background using expo-task-manager.

**Returns**: Promise indicating success or failure

##### `async stopTracking(): Promise<void>`
Stops all location tracking (foreground and background).

##### `async getCurrentLocation(): Promise<LocationCoordinates | null>`
Gets the current location once.

**Returns**: Promise with location coordinates or null if failed

##### `getLastKnownLocation(): LocationCoordinates | null`
Returns the last known cached location.

**Returns**: Location coordinates or null

##### `isTracking(): boolean`
Checks if tracking is currently active.

**Returns**: Boolean indicating tracking status

##### `async isBackgroundEnabled(): Promise<boolean>`
Checks if background mode is enabled.

**Returns**: Promise with boolean status

##### `onLocationUpdate(callback: (location: LocationCoordinates) => void): () => void`
Registers a callback for location updates.

**Returns**: Unsubscribe function

##### `onError(callback: (error: Error) => void): () => void`
Registers a callback for errors.

**Returns**: Unsubscribe function

##### `async getPermissionStatus(): Promise<{foreground: LocationPermissionStatus, background: LocationPermissionStatus}>`
Gets detailed permission status for both foreground and background.

**Returns**: Promise with permission status object

##### `async reset(): Promise<void>`
Resets the service state (useful for testing).

### Types

#### `LocationCoordinates`
```typescript
interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}
```

#### `LocationPermissionStatus`
```typescript
type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'limited';
```

#### `LocationServiceConfig`
```typescript
interface LocationServiceConfig {
  updateInterval?: number;           // Default: 30000 (30 seconds)
  minimumDistance?: number;          // Default: 10 (meters)
  accuracy?: Location.Accuracy;      // Default: Location.Accuracy.Balanced
  showBackgroundIndicator?: boolean; // Default: true
}
```

## useGetLocation Hook

### Return Type
```typescript
type useGetLocationTypes = {
  hasPermission: boolean;
  coordinates: number[];
  permissionStatus: LocationPermissionStatus;
  requestLocationPermission: () => Promise<LocationPermissionStatus>;
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<void>;
  isTracking: boolean;
  lastKnownLocation: LocationCoordinates | null;
};
```

### Methods

- `requestLocationPermission()`: Requests location permissions
- `startTracking()`: Starts foreground tracking
- `stopTracking()`: Stops all tracking
- Returns state: `hasPermission`, `coordinates`, `permissionStatus`, `isTracking`, `lastKnownLocation`

## Platform-Specific Considerations

### iOS

- **Background Location**: Requires "Always" permission for background tracking
- **App Store Review**: Must provide clear justification for background location usage
- **Battery Impact**: iOS may pause location updates to save battery
- **Blue Bar**: iOS shows a blue bar when background location is active

### Android

- **Foreground Service**: Requires FOREGROUND_SERVICE permission for Android 9+
- **Android 14+**: Requires FOREGROUND_SERVICE_LOCATION permission
- **Battery Optimization**: Users can disable battery optimization for the app
- **Notification**: Shows persistent notification when background location is active

## Best Practices

1. **Request Permissions Appropriately**: Request permissions when the user needs the feature, not on app launch
2. **Handle Permission Denials**: Provide clear messaging when permissions are denied
3. **Battery Optimization**: Use appropriate update intervals and distance filters
4. **Error Handling**: Always handle errors gracefully and provide user feedback
5. **Cleanup**: Always stop tracking when not needed to save battery
6. **Testing**: Test both foreground and background scenarios thoroughly
7. **User Privacy**: Be transparent about why you need location data

## Troubleshooting

### Location Not Updating in Background

**iOS**:
- Verify "Always" permission is granted
- Check that "location" is in UIBackgroundModes
- Ensure app is not being killed by the system

**Android**:
- Verify all permissions are granted
- Check that foreground service is running
- Verify battery optimization is disabled for the app

### Permission Denied

- Check permission descriptions in Info.plist (iOS) or AndroidManifest.xml (Android)
- Ensure descriptions clearly explain why location is needed
- Provide in-app explanation before requesting permissions

### High Battery Usage

- Increase `updateInterval` (e.g., to 60000 for 1 minute)
- Increase `minimumDistance` (e.g., to 50 meters)
- Use `Location.Accuracy.Low` instead of `Balanced` or `High`
- Stop tracking when not needed

## Integration with Existing Services

The BackgroundLocationService integrates seamlessly with the existing GeofenceMonitorService:

```typescript
locationService.onLocationUpdate((location: LocationCoordinates) => {
  // Send to geofence monitor for venue detection
  geofenceMonitor.sendManualPosition(location.latitude, location.longitude);
});
```

## Migration from @react-native-community/geolocation

The old implementation used `@react-native-community/geolocation` which is deprecated. The new service provides:

- Better background support
- More reliable permission handling
- Better battery optimization
- Cross-platform consistency
- Active maintenance (expo-location)

To migrate:
1. Replace imports from `@react-native-community/geolocation` with `BackgroundLocationService`
2. Update permission handling to use the service's permission methods
3. Replace `watchPosition` with `startForegroundTracking` or `startBackgroundTracking`
4. Update callback handling to use the service's event system

## Performance Considerations

- **Memory**: Singleton pattern ensures only one instance exists
- **CPU**: Configurable update intervals minimize CPU usage
- **Battery**: Distance filters and accuracy settings optimize battery usage
- **Network**: No network calls made by the service itself

## Security Considerations

- Location data is not stored by the service
- Coordinates are only passed to registered callbacks
- Permission status is persisted in AsyncStorage
- No sensitive data is logged

## Testing

```typescript
// Test initialization
const status = await locationService.initialize();
console.assert(status === 'granted', 'Permission should be granted');

// Test foreground tracking
const success = await locationService.startForegroundTracking();
console.assert(success === true, 'Foreground tracking should start');

// Test location updates
let updateReceived = false;
locationService.onLocationUpdate(() => {
  updateReceived = true;
});

// Wait for update...
console.assert(updateReceived === true, 'Should receive location update');

// Test cleanup
await locationService.stopTracking();
console.assert(locationService.isTracking() === false, 'Tracking should stop');
```

## Support

For issues or questions about the BackgroundLocationService, refer to:
- expo-location documentation: https://docs.expo.dev/versions/latest/sdk/location/
- expo-task-manager documentation: https://docs.expo.dev/versions/latest/sdk/task-manager/

## License

This service is part of the VibeLive application.
