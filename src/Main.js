import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackNavigation from './NavigationsScreens/StackNavigation/StackNavigation.tsx';

// ── Deep Linking Configuration ──────────────────────────────────────────
// Universal links: https://<domain>/squad/<code> → SquadJoin screen
// When the domain is configured for iOS (AASA) and Android (assetlinks),
// tapping a squad invite link will open the app directly to SquadJoin.
//
// Prefixes to update when production domain is ready:
//   - Replace the placeholder with your production URL (e.g. https://vibelive.app)
//   - Keep vibelive:// as a fallback custom scheme for dev/testing
const linking = {
  prefixes: [
    'vibelive://',
    // Add your production domain here when ready, e.g.:
    // 'https://vibelive.app',
    // 'https://api.vibelive.app',
  ],
  config: {
    screens: {
      SquadJoin: {
        path: 'squad/:squad_code',
        parse: {
          squad_code: (code) => code?.toUpperCase?.() || code,
        },
      },
    },
  },
};

const Main = () => {
  return (
      <NavigationContainer linking={linking}>
        <StackNavigation />
      </NavigationContainer>
  );
};

export default Main;
