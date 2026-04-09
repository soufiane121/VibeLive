import React, {useEffect, useRef, useCallback, useState} from 'react';
import {Vibration} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {RootState} from '../../../redux/store';
import {useRegisterFcmTokenMutation} from '../../../features/voting/VotingApi';
import geofenceMonitor from '../../Services/GeofenceMonitorService';
import offlineVoteQueue from '../../Services/OfflineVoteQueue';
import votingNotificationHandler from '../../Services/VotingNotificationHandler';
import type {VoteConfirmation} from '../../Services/VotingNotificationHandler';
import {getToken as getFCMToken} from '../../Services/FCMNotificationService';
import VoteToast from './VoteToast';

const VotingInitializer = () => {
  const navigation = useNavigation<any>();
  const currentUser = useSelector(
    (state: RootState) => (state.currentUser as any).currentUser,
  );
  const [registerFcmToken] = useRegisterFcmTokenMutation();
  const initialized = useRef(false);
  const [toastData, setToastData] = useState<VoteConfirmation | null>(null);

  const handleVenuesDetected = useCallback(
    (venues: any[]) => {
      // Single venue: handled entirely by the push notification with action buttons.
      // No in-app Alert, no navigation — the notification tray is the UI.
      if (venues.length === 1) {
        console.log(
          `[VotingInit] Single venue detected: ${venues[0].name} — push notification sent`,
        );
        return;
      }

      // Multiple venues: navigate to venue selection screen
      if (venues.length > 1) {
        navigation.navigate('VenueSelection', {venues});
      }
    },
    [navigation],
  );

  const handleGeofenceError = useCallback((error: string) => {
    console.log('[VotingInit] Geofence error:', error);
  }, []);

  const handleSyncComplete = useCallback(
    (result: {synced: number; failed: number}) => {
      if (result.synced > 0) {
        console.log(`[VotingInit] Synced ${result.synced} offline votes`);
      }
    },
    [],
  );

  const handleToast = useCallback((confirmation: VoteConfirmation) => {
    // Haptic feedback — short vibration for tactile confirmation
    Vibration.vibrate(50);
    setToastData(confirmation);
  }, []);

  const handleToastDismiss = useCallback(() => {
    setToastData(null);
  }, []);

  useEffect(() => {
    if (!currentUser?._id || initialized.current) return;
    initialized.current = true;

    // Wire navigation callback for non-voting-action taps
    votingNotificationHandler.setNavigationCallback(
      (screen: string, params: any) => {
        try {
          navigation.navigate(screen, params);
        } catch (e) {
          console.log('[VotingInit] Navigation error:', e);
        }
      },
    );

    // Wire toast callback for silent vote confirmations
    votingNotificationHandler.setToastCallback(handleToast);

    offlineVoteQueue.initialize(handleSyncComplete);

    const votingEnabled =
      currentUser.votingPreferences?.enabled !== false &&
      !currentUser.votingPreferences?.permanentOptOut;

    if (votingEnabled) {
      const radius = currentUser.votingPreferences?.notificationRadius || 5;
      geofenceMonitor.configure({enabled: true, radiusMeters: radius});
      geofenceMonitor.startMonitoring(
        handleVenuesDetected,
        handleGeofenceError,
      );
    }

    // Register FCM token with voting backend
    getFCMToken().then(token => {
      if (token) {
        registerFcmToken({token}).catch(() => {});
      }
    });

    console.log(
      '[VotingInit] Voting system initialized for user',
      currentUser._id,
    );

    return () => {
      geofenceMonitor.stopMonitoring().catch(console.error);
      offlineVoteQueue.cleanup();
      initialized.current = false;
    };
  }, [
    currentUser?._id,
    currentUser?.votingPreferences,
    handleVenuesDetected,
    handleGeofenceError,
    handleSyncComplete,
    handleToast,
    registerFcmToken,
    navigation,
  ]);

  return <VoteToast confirmation={toastData} onDismiss={handleToastDismiss} />;
};

export default VotingInitializer;
