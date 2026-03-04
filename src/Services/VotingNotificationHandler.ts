import {Alert, Linking} from 'react-native';
import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../Utils/LocalStorageHelper';
import offlineVoteQueue from './OfflineVoteQueue';

export interface VenueNotificationData {
  type: 'single_venue_vote' | 'multi_venue_vote' | 'vibe_shift_alert' | 'digest';
  venueId?: string;
  venueName?: string;
  venueCategory?: string;
  currentVibeScore?: string;
  venues?: string;
  venueCount?: string;
  action?: string;
  fromVenueId?: string;
  fromVenueName?: string;
  toVenueId?: string;
  toVenueName?: string;
  confidence?: string;
  shiftType?: string;
}

type NavigationCallback = (screen: string, params: any) => void;
type VoteCallback = (venueId: string, voteType: 'hot' | 'dead') => void;

class VotingNotificationHandler {
  private navigationCallback: NavigationCallback | null = null;
  private voteCallback: VoteCallback | null = null;

  setNavigationCallback(callback: NavigationCallback) {
    this.navigationCallback = callback;
  }

  setVoteCallback(callback: VoteCallback) {
    this.voteCallback = callback;
  }

  handleNotificationReceived(data: VenueNotificationData) {
    if (!data?.type) return;

    switch (data.type) {
      case 'single_venue_vote':
        this._handleSingleVenueNotification(data);
        break;
      case 'multi_venue_vote':
        this._handleMultiVenueNotification(data);
        break;
      case 'vibe_shift_alert':
        this._handleVibeShiftNotification(data);
        break;
      case 'digest':
        this._handleDigestNotification(data);
        break;
      default:
        console.log('[VotingNotification] Unknown notification type:', data.type);
    }
  }

  handleNotificationAction(actionId: string, data: VenueNotificationData) {
    if (!data) return;

    switch (actionId) {
      case 'VOTE_HOT':
        if (data.venueId) {
          this._quickVote(data.venueId, 'hot');
        }
        break;
      case 'VOTE_DEAD':
        if (data.venueId) {
          this._quickVote(data.venueId, 'dead');
        }
        break;
      case 'SELECT_VENUE':
        this._openVenueSelection(data);
        break;
      case 'VIEW_VIBE_SHIFT':
        if (data.toVenueId) {
          this.navigationCallback?.('VenueDetail', {venueId: data.toVenueId});
        }
        break;
      default:
        this.handleNotificationReceived(data);
    }
  }

  private _handleSingleVenueNotification(data: VenueNotificationData) {
    if (!data.venueId || !data.venueName) return;

    Alert.alert(
      `🔥 Is ${data.venueName} hot?`,
      'Quick vote — is it popping or dead right now?',
      [
        {
          text: '💀 Dead',
          style: 'destructive',
          onPress: () => this._quickVote(data.venueId!, 'dead'),
        },
        {
          text: '🔥 Hot!',
          onPress: () => this._quickVote(data.venueId!, 'hot'),
        },
      ],
      {cancelable: true},
    );
  }

  private _handleMultiVenueNotification(data: VenueNotificationData) {
    this._openVenueSelection(data);
  }

  private _handleVibeShiftNotification(data: VenueNotificationData) {
    if (!data.fromVenueName || !data.toVenueName) return;

    Alert.alert(
      '📊 Crowd Shift Detected',
      `People are moving from ${data.fromVenueName} to ${data.toVenueName}!`,
      [
        {text: 'Dismiss', style: 'cancel'},
        {
          text: 'Check It Out',
          onPress: () => {
            if (data.toVenueId) {
              this.navigationCallback?.('VenueDetail', {venueId: data.toVenueId});
            }
          },
        },
      ],
    );
  }

  private _handleDigestNotification(data: VenueNotificationData) {
    this.navigationCallback?.('VenueHeatmap', {});
  }

  private _openVenueSelection(data: VenueNotificationData) {
    let venues: any[] = [];

    if (data.venues) {
      try {
        venues = JSON.parse(data.venues);
      } catch (e) {
        console.log('[VotingNotification] Failed to parse venues:', e);
        return;
      }
    }

    if (venues.length === 0) return;

    this.navigationCallback?.('VenueSelection', {venues});
  }

  private async _quickVote(venueId: string, voteType: 'hot' | 'dead') {
    try {
      const token = await getLocalData({key: 'token'});
      if (!token) {
        await offlineVoteQueue.enqueue(venueId, voteType, 'inline_notification');
        return;
      }

      const response = await fetch(`${baseUrl}/voting/vote-from-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({venueId, voteType}),
      });

      if (!response.ok) {
        throw new Error(`Vote failed: ${response.status}`);
      }

      const result = await response.json();

      this.voteCallback?.(venueId, voteType);

      if (result.success) {
        const emoji = voteType === 'hot' ? '🔥' : '💀';
        console.log(`[VotingNotification] Quick vote recorded: ${emoji} for ${venueId}`);
      }
    } catch (error: any) {
      console.log('[VotingNotification] Quick vote error, queuing offline:', error.message);
      await offlineVoteQueue.enqueue(venueId, voteType, 'inline_notification');
    }
  }
}

const votingNotificationHandler = new VotingNotificationHandler();
export default votingNotificationHandler;
