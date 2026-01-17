# VibeLive Analytics System

## Overview

This comprehensive analytics system tracks all user interactions, stream events, social activities, monetization, and technical errors across the VibeLive app. It provides real-time and batch processing capabilities with detailed dashboards for insights into user behavior and app performance.

## Architecture

### Backend Components

#### 1. Analytics Model (`AnalyticsModel.js`)
- **MongoDB Schema**: Captures 25+ event types across categories
- **Event Categories**: user_engagement, stream_interaction, monetization, social, technical
- **Features**: Geospatial indexing, TTL support, detailed event metadata
- **Data Tracked**: coordinates, stream info, boost details, social interactions, errors, device info, session timing

#### 2. Analytics Controller (`AnalyticsController.js`)
- **REST API Endpoints**:
  - `POST /analytics/track-event` - Single event tracking
  - `POST /analytics/track-events-batch` - Batch event tracking
  - `POST /analytics/track-session-start` - Session initialization
  - `POST /analytics/track-session-end` - Session completion
  - `GET /analytics/user-summary` - User analytics summary
  - `GET /analytics/dashboard` - Comprehensive user dashboard
  - `GET /analytics/app-metrics` - App-wide analytics (admin)

#### 3. Socket Analytics Integration (`LiveStreamSocketControler.js`)
- **Real-time Tracking**: All socket events tracked for immediate insights
- **Events Covered**: Stream join/leave, messages, reactions, map interactions, boost activations

### Frontend Components

#### 1. Core Services

##### AnalyticsService (`AnalyticsService.ts`)
- **Singleton Pattern**: Centralized analytics management
- **Features**: 
  - Offline event queuing with AsyncStorage
  - Automatic session management
  - Device info collection
  - Location tracking
  - Periodic batch flushing
  - Network-aware event sending

##### SocketAnalyticsService (`SocketAnalyticsService.ts`)
- **Real-time Analytics**: Socket.io integration for live event tracking
- **Features**:
  - Real-time socket event listening
  - Client-side analytics event emission
  - Integration with AnalyticsService for offline support

#### 2. React Components & Hooks

##### useAnalytics Hook (`useAnalytics.ts`)
- **Easy Integration**: React hook for component-level analytics
- **Features**:
  - Screen view tracking
  - App lifecycle tracking
  - Focus/blur event tracking
  - Convenient tracking methods

##### AnalyticsProvider (`AnalyticsProvider.tsx`)
- **Context Provider**: App-wide analytics state management
- **Features**:
  - Analytics initialization
  - Session management
  - Error tracking
  - User context updates

#### 3. Specialized Analytics Components

##### MapAnalytics (`MapAnalytics.tsx`)
- **Map Interaction Tracking**: Comprehensive map analytics
- **Features**:
  - Marker click tracking
  - Map movement and zoom tracking
  - Category filter analytics
  - Search query tracking
  - Location permission tracking

##### StreamAnalytics (`StreamAnalytics.tsx`)
- **Stream Viewing Analytics**: Complete streaming behavior tracking
- **Features**:
  - Stream join/leave tracking
  - Watch time measurement
  - Chat interaction tracking
  - Quality change tracking
  - Buffering event tracking

##### SocialAnalytics (`SocialAnalytics.tsx`)
- **Social Interaction Tracking**: Social feature usage analytics
- **Features**:
  - Message and reaction tracking
  - Profile view tracking
  - Follow action tracking
  - Moderation action tracking

##### AnalyticsDashboard (`AnalyticsDashboard.tsx`)
- **Analytics Visualization**: User-facing analytics dashboard
- **Features**:
  - Real-time metrics display
  - Engagement statistics
  - Category preferences
  - Recent activity feed

## Event Types Tracked

### User Engagement
- `app_opened`, `app_closed`, `app_backgrounded`, `app_foregrounded`
- `screen_viewed`, `session_started`, `session_ended`
- `feature_discovered`, `tutorial_completed`

### Map Interactions
- `marker_clicked`, `map_moved`, `map_zoomed`
- `category_filter_applied`, `search_performed`
- `location_permission_granted/denied`

### Stream Discovery & Viewing
- `stream_discovered`, `stream_previewed`, `stream_joined`, `stream_left`
- `stream_quality_changed`, `stream_buffering`, `stream_error`
- `viewer_count_updated`

### Stream Creation
- `go_live_started`, `category_selected`, `stream_metadata_updated`
- `stream_ended`, `stream_title_changed`

### Boost & Monetization
- `boost_intro_viewed`, `boost_tier_selected`, `boost_purchased`
- `boost_activated`, `boost_skipped`, `payment_initiated`
- `payment_completed`, `payment_failed`

### Social Interactions
- `message_sent`, `message_received`, `reaction_sent`
- `profile_viewed`, `follow_action`, `direct_message_started`
- `emoji_used`, `moderation_action`

### Technical Events
- `error_occurred`, `crash_detected`, `network_error`
- `permission_requested`, `api_call_failed`

## Setup Instructions

### 1. Backend Setup

```bash
# Install dependencies (already included in existing package.json)
npm install mongoose express passport

# Environment variables required:
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url (optional)
```

### 2. Frontend Setup

```bash
# Install required dependencies
npm install @react-native-community/netinfo react-native-device-info uuid @react-native-community/geolocation @types/uuid

# iOS specific setup for geolocation
cd ios && pod install
```

### 3. Integration Steps

#### Step 1: Wrap App with AnalyticsProvider

```tsx
import { AnalyticsProvider } from './src/Providers/AnalyticsProvider';

export default function App() {
  return (
    <AnalyticsProvider>
      {/* Your app components */}
    </AnalyticsProvider>
  );
}
```

#### Step 2: Initialize Analytics

```tsx
import { useAnalyticsContext } from './src/Providers/AnalyticsProvider';

const { initializeAnalytics } = useAnalyticsContext();

// Initialize with your backend URL and auth token
await initializeAnalytics('https://your-api.com', authToken, userId);
```

#### Step 3: Add Analytics to Components

```tsx
import { useAnalytics } from './src/Hooks/useAnalytics';
import { useMapAnalytics } from './src/Components/MapAnalytics';
import { useStreamAnalytics } from './src/Components/StreamAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics({ screenName: 'MyScreen' });
  const mapAnalytics = useMapAnalytics();
  const streamAnalytics = useStreamAnalytics();

  // Track custom events
  const handleButtonPress = () => {
    trackEvent('button_pressed', { buttonName: 'subscribe' });
  };

  // Track map interactions
  const handleMarkerClick = (markerData) => {
    mapAnalytics.trackMarkerClick(markerData);
  };

  // Track stream events
  const handleStreamJoin = (streamData) => {
    streamAnalytics.trackStreamJoin(streamData, 'map_click');
  };
}
```

## Configuration

### Analytics Service Configuration

```typescript
// Configure analytics service
const analyticsService = AnalyticsService.getInstance();
analyticsService.configure('https://your-api.com/analytics', authToken);

// Update user context
analyticsService.updateUserContext({
  userId: 'user123',
  username: 'john_doe',
  tier: 'premium'
});
```

### Socket Analytics Configuration

```typescript
// Initialize socket analytics
const socketAnalytics = SocketAnalyticsService.getInstance();
socketAnalytics.initializeSocket('https://your-api.com', authToken, userId);
```

## Data Privacy & Security

### Security Features
- **JWT Authentication**: All analytics endpoints are JWT-protected
- **Data Anonymization**: Personal data is anonymized where possible
- **Secure Transmission**: All data transmitted over HTTPS
- **Token-based Socket Auth**: Socket connections use secure tokens

### Privacy Considerations
- **Minimal Data Collection**: Only necessary metadata is collected
- **User Consent**: Location tracking requires explicit user permission
- **Data Retention**: TTL support for automatic data cleanup
- **GDPR Compliance**: Analytics data can be deleted upon user request

## Performance Considerations

### Optimization Features
- **Batch Processing**: Events are batched to reduce API calls
- **Offline Support**: Events are queued when offline and sent when online
- **Efficient Storage**: AsyncStorage used for offline event persistence
- **Network Awareness**: Analytics adapts to network conditions
- **Minimal UI Impact**: All tracking is asynchronous and non-blocking

### Monitoring
- **Error Tracking**: Analytics system tracks its own errors
- **Performance Metrics**: Track analytics system performance
- **Queue Management**: Monitor offline event queue size
- **Network Usage**: Track analytics-related network usage

## Dashboard Features

### User Dashboard
- **Engagement Metrics**: Session duration, streak days, active time
- **Viewing Stats**: Watch time, favorite categories, streams watched
- **Social Activity**: Messages sent, reactions, followers gained
- **Monetization**: Boost purchases, spending patterns

### Admin Dashboard
- **App-wide Metrics**: Total users, sessions, events
- **Performance Monitoring**: Error rates, API response times
- **Feature Usage**: Adoption rates, user flows
- **Revenue Analytics**: Boost sales, conversion rates

## Troubleshooting

### Common Issues

1. **Analytics Not Initializing**
   - Check network connectivity
   - Verify backend URL and auth token
   - Check console for initialization errors

2. **Events Not Being Tracked**
   - Verify analytics service is initialized
   - Check network connectivity
   - Review offline event queue

3. **Socket Analytics Not Working**
   - Check socket connection status
   - Verify socket server is running
   - Check authentication tokens

### Debug Mode

```typescript
// Enable debug logging
const analyticsService = AnalyticsService.getInstance();
analyticsService.setDebugMode(true);
```

## API Documentation

### REST Endpoints

#### Track Single Event
```
POST /analytics/track-event
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "eventType": "stream_joined",
  "eventCategory": "stream_interaction",
  "eventData": {
    "streamId": "stream123",
    "streamerId": "user456"
  }
}
```

#### Get User Summary
```
GET /analytics/user-summary?timeRange=week
Authorization: Bearer <jwt_token>
```

#### Get Dashboard Data
```
GET /analytics/dashboard?timeRange=month
Authorization: Bearer <jwt_token>
```

## Future Enhancements

### Planned Features
- **Machine Learning**: Predictive analytics and recommendations
- **A/B Testing**: Built-in experimentation framework
- **Real-time Alerts**: Automated alerts for unusual patterns
- **Advanced Segmentation**: User cohort analysis
- **Export Capabilities**: Data export for external analysis

### Integration Opportunities
- **Third-party Analytics**: Google Analytics, Mixpanel integration
- **Business Intelligence**: Tableau, PowerBI connectors
- **Marketing Tools**: Campaign tracking and attribution
- **Customer Support**: Analytics-driven support insights

## Support

For questions or issues with the analytics system:
1. Check this documentation first
2. Review console logs for error messages
3. Test with debug mode enabled
4. Contact the development team with specific error details

---

**Last Updated**: August 2025
**Version**: 1.0.0
**Maintainer**: VibeLive Development Team
