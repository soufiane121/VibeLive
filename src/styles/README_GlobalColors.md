# Global Colors Configuration

This document explains how to use the centralized color management system in VibeLive.

## Overview

The `GlobalColors.ts` file provides a centralized color configuration system that organizes colors by screen and purpose, making it easy to maintain consistent theming across the entire application.

## File Structure

```
src/styles/
├── GlobalColors.ts          # Main colors configuration
└── README_GlobalColors.md   # This documentation
```

## Usage

### Basic Import

```typescript
import { GlobalColors, ColorUtils } from '../styles/GlobalColors';

// Use screen-specific colors
const colors = GlobalColors.EventsListScreen;

// Use in styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  text: {
    color: colors.text,
  },
});
```

### Screen-Specific Colors

Each screen has its own color configuration:

```typescript
// Events List Screen
const colors = GlobalColors.EventsListScreen;
const createButtonColor = colors.createButton; // '#4f46e5'

// Settings Screen
const settingsColors = GlobalColors.Settings;
const backgroundColor = settingsColors.background; // '#0a0a0a'

// Profile Screen
const profileColors = GlobalColors.Profile;
const accentColor = profileColors.accent; // '#00FFFF'
```

### Available Screen Configurations

- `EventsListScreen` - Events listing and filtering
- `Settings` - Main settings screen
- `Profile` - User profile screen
- `NotificationSettings` - Notification preferences
- `PrivacySettings` - Privacy controls
- `StreamingPreferences` - Streaming options
- `BlockedUsers` - Blocked users management
- `PasswordSettings` - Password and security
- `EmailSettings` - Email configuration
- `MapContainer` - Map and location features
- `BoostFOMOFlow` - Boost purchase flow
- `EventSelections` - Event category selection
- `LiveStreamContainer` - Live streaming interface
- `StreamPlayer` - Stream viewing
- `ChatList` - Chat interface
- `BottomNavigation` - Bottom tab navigation
- `EventCreationFlow` - Event creation wizard
- `EventDetailsScreen` - Event details view
- `Analytics` - Analytics components
- `Common` - Shared UI elements

### Utility Functions

#### ColorUtils.getEventTypeColor()

Get color for specific event types:

```typescript
import { ColorUtils } from '../styles/GlobalColors';

const musicColor = ColorUtils.getEventTypeColor('music'); // '#ec4899'
const sportsColor = ColorUtils.getEventTypeColor('sports'); // '#10b981'
```

#### ColorUtils.getBoostTierColor()

Get color for boost tiers:

```typescript
const basicColor = ColorUtils.getBoostTierColor('basic'); // '#00FFFF'
const premiumColor = ColorUtils.getBoostTierColor('premium'); // '#FF1493'
const ultimateColor = ColorUtils.getBoostTierColor('ultimate'); // '#FFD700'
```

#### ColorUtils.withAlpha()

Add transparency to any color:

```typescript
const transparentBlue = ColorUtils.withAlpha('#0000FF', 0.5); // 'rgba(0, 0, 255, 0.5)'
const transparentRgba = ColorUtils.withAlpha('rgba(255, 0, 0, 1)', 0.3); // 'rgba(255, 0, 0, 0.3)'
```

## Color Categories

### Base Colors
- **Brand Colors**: cyan, deepPink, gold, purple, blue, indigo
- **Grayscale**: black, deepBlack, darkGray, gray, white, etc.
- **Semantic**: success, error, warning, info
- **Event Types**: musicPink, sportsGreen, nightlifePurple, etc.

### Screen-Specific Properties

Each screen configuration includes:
- `background` - Main background color
- `surface` - Card/container backgrounds
- `text` - Primary text color
- `textSecondary` - Secondary text color
- `textMuted` - Muted/disabled text
- `border` - Border colors
- `accent` - Accent/highlight colors
- Component-specific colors (buttons, inputs, etc.)

## Migration Guide

### From Hardcoded Colors

**Before:**
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
  },
  text: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#4f46e5',
  },
});
```

**After:**
```typescript
import { GlobalColors } from '../styles/GlobalColors';

const colors = GlobalColors.EventsListScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  text: {
    color: colors.text,
  },
  button: {
    backgroundColor: colors.createButton,
  },
});
```

### From Local Color Objects

**Before:**
```typescript
const colors = {
  background: '#0a0a0a',
  text: '#ffffff',
  primary: '#4f46e5',
};
```

**After:**
```typescript
import { GlobalColors } from '../styles/GlobalColors';

const colors = GlobalColors.EventsListScreen;
```

## Best Practices

1. **Always use screen-specific colors** when available
2. **Use ColorUtils functions** for dynamic color operations
3. **Avoid hardcoded hex values** in component files
4. **Use Common colors** for shared UI elements
5. **Test color changes** across multiple screens

## Adding New Colors

To add colors for a new screen:

1. Add the screen configuration to `GlobalColors`:

```typescript
export const GlobalColors = {
  // ... existing screens
  
  NewScreen: {
    background: baseColors.deepBlack,
    surface: baseColors.darkGray,
    text: baseColors.white,
    textSecondary: baseColors.offWhite,
    primary: baseColors.cyan,
    // ... other colors
  },
};
```

2. Update this documentation with the new screen

3. Migrate the screen component to use the new colors

## Examples

### Complete Screen Migration

```typescript
// MyScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlobalColors } from '../styles/GlobalColors';

const colors = GlobalColors.MyScreen;

const MyScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Screen</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Card content</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardText: {
    color: colors.textSecondary,
  },
});

export default MyScreen;
```

## Troubleshooting

### Common Issues

1. **Missing screen configuration**: Add the screen to GlobalColors
2. **Color not found**: Check the property name in the screen config
3. **TypeScript errors**: Ensure proper import and usage

### Debugging

Use console.log to inspect available colors:

```typescript
console.log('Available colors:', Object.keys(GlobalColors.EventsListScreen));
```

## Support

For questions or issues with the color system, refer to the main GlobalColors.ts file or create an issue in the project repository.
