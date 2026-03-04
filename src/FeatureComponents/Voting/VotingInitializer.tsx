import {useEffect, useRef, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {RootState} from '../../../redux/store';
import {useRegisterFcmTokenMutation} from '../../../features/voting/VotingApi';
import geofenceMonitor from '../../Services/GeofenceMonitorService';
import offlineVoteQueue from '../../Services/OfflineVoteQueue';
import votingNotificationHandler from '../../Services/VotingNotificationHandler';

const VotingInitializer = () => {
  const navigation = useNavigation<any>();
  const currentUser = useSelector((state: RootState) => (state.currentUser as any).currentUser);
  const [registerFcmToken] = useRegisterFcmTokenMutation();
  const initialized = useRef(false);

  const handleVenuesDetected = useCallback(
    (venues: any[]) => {
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

  useEffect(() => {
    if (!currentUser?._id || initialized.current) return;
    initialized.current = true;

    votingNotificationHandler.setNavigationCallback(
      (screen: string, params: any) => {
        try {
          navigation.navigate(screen, params);
        } catch (e) {
          console.log('[VotingInit] Navigation error:', e);
        }
      },
    );

    offlineVoteQueue.initialize(handleSyncComplete);

    const votingEnabled =
      currentUser.votingPreferences?.enabled !== false &&
      !currentUser.votingPreferences?.permanentOptOut;

    if (votingEnabled) {
      const radius = currentUser.votingPreferences?.notificationRadius || 5;
      geofenceMonitor.configure({enabled: true, radiusMeters: radius});
      geofenceMonitor.startMonitoring(handleVenuesDetected, handleGeofenceError);
    }

    if (currentUser.fcmToken) {
      registerFcmToken({token: currentUser.fcmToken}).catch(() => {});
    }

    console.log('[VotingInit] Voting system initialized for user', currentUser._id);

    return () => {
      geofenceMonitor.stopMonitoring();
      offlineVoteQueue.cleanup();
      initialized.current = false;
    };
  }, [
    currentUser?._id,
    currentUser?.votingPreferences,
    currentUser?.fcmToken,
    handleVenuesDetected,
    handleGeofenceError,
    handleSyncComplete,
    registerFcmToken,
    navigation,
  ]);

  return null;
};

export default VotingInitializer;
