# OneSignal Custom Integration Usage Guide

## Overview
This custom OneSignal integration provides comprehensive notification management for your VibeLive app, including user management, permission handling, notification events, and subscription control.

## Setup

### 1. Initialize OneSignal
Call this function when your app starts (typically in App.tsx or index.js):

```typescript
import { initOneSignal } from './Notifications/IniNotification';

// Initialize OneSignal on app startup
await initOneSignal();
```

### 2. Environment Variables
Make sure you have your OneSignal App ID in your `.env` file:
```
ONE_SIGNAL_APP_ID=your-onesignal-app-id-here
```

## Core Functions

### User Management

#### Set User ID
```typescript
import { setExternalId } from './Notifications/IniNotification';

// Set user ID when user logs in
await setExternalId('user123');
```

#### Set User Data
```typescript
import { setUserData } from './Notifications/IniNotification';

// Set user email and tags
await setUserData({
  email: 'user@example.com',
  tags: {
    userType: 'premium',
    location: 'US',
    age: 25
  }
});
```

#### Remove User Data
```typescript
import { removeUserData } from './Notifications/IniNotification';

// Remove user data when user logs out
await removeUserData();
```

### Permission Management

#### Request Notification Permission
```typescript
import { requestNotificationPermission } from './Notifications/IniNotification';

// Request permission (returns boolean)
const hasPermission = await requestNotificationPermission();
if (hasPermission) {
  console.log('User granted notification permission');
}
```

#### Check Permission Status
```typescript
import { getNotificationPermissionStatus } from './Notifications/IniNotification';

// Check current permission status
const hasPermission = await getNotificationPermissionStatus();
```

### Tag Management

#### Send Tags
```typescript
import { sendTags } from './Notifications/IniNotification';

// Send user tags for segmentation
await sendTags({
  interests: 'music',
  vipStatus: true,
  lastActive: Date.now()
});
```

#### Remove Tags
```typescript
import { removeTags } from './Notifications/IniNotification';

// Remove specific tags
await removeTags(['interests', 'vipStatus']);
```

### Subscription Management

#### Check Subscription Status
```typescript
import { getSubscriptionStatus } from './Notifications/IniNotification';

// Check if user is subscribed to notifications
const isSubscribed = await getSubscriptionStatus();
```

#### Opt In/Out
```typescript
import { optInToNotifications, optOutOfNotifications } from './Notifications/IniNotification';

// Opt user in to notifications
await optInToNotifications();

// Opt user out of notifications
await optOutOfNotifications();
```

### Notification Management

#### Clear All Notifications
```typescript
import { clearAllNotifications } from './Notifications/IniNotification';

// Clear all notifications from notification center
clearAllNotifications();
```

#### Send Notification (Server-side)
```typescript
import { sendNotificationToUser } from './Notifications/IniNotification';

// This is typically done from your backend
// But here's how you would structure it
await sendNotificationToUser(
  'user123',
  'New Message',
  'You have a new message from John',
  {
    action: 'open_chat',
    chatId: 'chat456'
  }
);
```

## Event Handling

The integration automatically handles various notification events:

### Foreground Notifications
When a notification is received while the app is in the foreground:
- Logs notification data
- Shows custom in-app alert if `showInApp: true` in notification data
- Otherwise displays the notification normally

### Notification Clicks
When a user taps on a notification:
- Automatically handles different action types based on `action` field in notification data
- Supported actions:
  - `open_chat`: Navigate to chat screen
  - `open_profile`: Navigate to profile screen
  - `video_call`: Handle video call
  - Custom actions can be added in `handleNotificationAction`

### Permission Changes
Automatically tracks and stores permission changes in AsyncStorage.

## Notification Data Structure

When sending notifications, use this data structure for custom actions:

```json
{
  "action": "open_chat",
  "chatId": "chat123",
  "userId": "user456",
  "showInApp": true
}
```

## Integration with Navigation

To enable navigation from notifications, uncomment and update the navigation calls in `handleNotificationAction`:

```typescript
// In handleNotificationAction function
case 'open_chat':
  RootNavigation.navigate('Chat', { chatId: data.chatId });
  break;
case 'open_profile':
  RootNavigation.navigate('Profile', { userId: data.userId });
  break;
case 'video_call':
  RootNavigation.navigate('VideoCall', { callId: data.callId });
  break;
```

## Best Practices

1. **Initialize Early**: Call `initOneSignal()` as early as possible in your app lifecycle
2. **Set User ID**: Always set the external user ID when a user logs in
3. **Handle Permissions**: Check permissions before sending notifications
4. **Use Tags**: Leverage tags for better user segmentation
5. **Test Thoroughly**: Test on both iOS and Android devices
6. **Handle Errors**: All functions include error handling and logging

## Debugging

- Set `LogLevel.Verbose` for detailed debugging (already configured)
- Check console logs for detailed information about notification events
- Use OneSignal dashboard to monitor delivery and engagement

## Dependencies Required

Make sure you have these dependencies installed:

```bash
npm install react-native-onesignal
npm install @react-native-async-storage/async-storage
```

For iOS, don't forget to run:
```bash
cd ios && pod install
```

## Notes

- The integration maintains compatibility with your existing Firebase messaging setup
- All functions are properly typed with TypeScript
- Error handling is implemented for all async operations
- Permission status is automatically stored in AsyncStorage
