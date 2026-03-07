import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../Utils/LocalStorageHelper';
import offlineVoteQueue from './OfflineVoteQueue';

export interface VenueNotificationData {
  type:
    | 'single_venue_vote'
    | 'multi_venue_vote'
    | 'vibe_shift_alert'
    | 'digest';
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

export interface VoteConfirmation {
  venueId: string;
  venueName: string;
  voteType: 'hot' | 'dead';
  success: boolean;
  message: string;
}

type NavigationCallback = (screen: string, params: any) => void;
type VoteCallback = (venueId: string, voteType: 'hot' | 'dead') => void;
type ToastCallback = (confirmation: VoteConfirmation) => void;

interface PendingNavigation {
  screen: string;
  params: any;
}

class VotingNotificationHandler {
  private navigationCallback: NavigationCallback | null = null;
  private voteCallback: VoteCallback | null = null;
  private toastCallback: ToastCallback | null = null;
  private pendingNavigation: PendingNavigation | null = null;

  setNavigationCallback(callback: NavigationCallback) {
    this.navigationCallback = callback;

    // Flush any navigation that was queued before the callback was ready
    // (cold-start / killed-state scenario)
    if (this.pendingNavigation) {
      const {screen, params} = this.pendingNavigation;
      this.pendingNavigation = null;
      console.log(
        `[VotingNotification] Flushing pending navigation to ${screen}`,
      );
      // Defer slightly to ensure the navigation tree is fully mounted
      setTimeout(() => {
        try {
          callback(screen, params);
        } catch (e) {
          console.log('[VotingNotification] Pending navigation error:', e);
        }
      }, 100);
    }
  }

  setVoteCallback(callback: VoteCallback) {
    this.voteCallback = callback;
  }

  setToastCallback(callback: ToastCallback) {
    this.toastCallback = callback;
  }

  /**
   * Called when notification is received in foreground.
   * For single_venue_vote: do nothing visible — the push notification itself
   * has action buttons. No Alert, no modal.
   */
  handleNotificationReceived(data: VenueNotificationData) {
    if (!data?.type) return;

    switch (data.type) {
      case 'single_venue_vote':
        // Silent — notification banner with action buttons handles this.
        // No Alert dialog. The user votes via notification action buttons.
        console.log(
          `[VotingNotification] Single venue notification displayed for ${data.venueName}`,
        );
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
        console.log(
          '[VotingNotification] Unknown notification type:',
          data.type,
        );
    }
  }

  /**
   * Called when the user taps a notification action button (VOTE_HOT / VOTE_DEAD)
   * or taps the notification body itself.
   * Votes are submitted silently — no Alert, no modal.
   */
  handleNotificationAction(actionId: string, data: VenueNotificationData) {
    if (!data) return;

    switch (actionId) {
      case 'VOTE_HOT':
        if (data.venueId) {
          this._silentVote(data.venueId, data.venueName || '', 'hot');
        }
        break;
      case 'VOTE_DEAD':
        if (data.venueId) {
          this._silentVote(data.venueId, data.venueName || '', 'dead');
        }
        break;
      case 'SELECT_VENUE':
        this._openVenueSelection(data);
        break;
      case 'VIEW_VIBE_SHIFT':
        if (data.toVenueId) {
          this._navigateOrQueue('VenueDetail', {venueId: data.toVenueId});
        }
        break;
      default:
        // Notification body tapped (no specific action button)
        this._handleNotificationBodyTap(data);
    }
  }

  /**
   * When user taps the notification body (not an action button),
   * navigate to the relevant screen based on type.
   */
  private _handleNotificationBodyTap(data: VenueNotificationData) {
    if (!data?.type) return;

    switch (data.type) {
      case 'single_venue_vote':
        // User tapped the notification body — navigate to venue heatmap
        // so they can vote from the map UI instead
        if (data.venueId) {
          this._navigateOrQueue('VenueSelection', {
            venues: [
              {
                id: data.venueId,
                name: data.venueName || '',
                category: data.venueCategory || 'other',
                vibeScore: parseInt(data.currentVibeScore || '0', 10),
              },
            ],
          });
        }
        break;
      case 'multi_venue_vote':
        this._openVenueSelection(data);
        break;
      case 'vibe_shift_alert':
        if (data.toVenueId) {
          this._navigateOrQueue('VenueDetail', {venueId: data.toVenueId});
        }
        break;
      case 'digest':
        this._navigateOrQueue('VenueHeatmap', {});
        break;
    }
  }

  private _handleMultiVenueNotification(data: VenueNotificationData) {
    this._openVenueSelection(data);
  }

  private _handleVibeShiftNotification(data: VenueNotificationData) {
    if (!data.fromVenueName || !data.toVenueName) return;

    // Navigate directly — no Alert
    if (data.toVenueId) {
      this._navigateOrQueue('VenueDetail', {venueId: data.toVenueId});
    }
  }

  private _handleDigestNotification(_data: VenueNotificationData) {
    this._navigateOrQueue('VenueHeatmap', {});
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

    this._navigateOrQueue('VenueSelection', {venues});
  }

  /**
   * Navigate immediately if the callback is ready, otherwise queue
   * the navigation for replay once VotingInitializer wires the callback.
   * This handles the cold-start (killed state) race condition where
   * getInitialNotification fires before the React navigation tree mounts.
   */
  private _navigateOrQueue(screen: string, params: any) {
    if (this.navigationCallback) {
      this.navigationCallback(screen, params);
    } else {
      console.log(
        `[VotingNotification] Navigation not ready — queuing: ${screen}`,
      );
      this.pendingNavigation = {screen, params};
    }
  }

  /**
   * Silently submit a vote from a notification action button.
   * No Alert, no modal — just submit and send a lightweight toast confirmation.
   */
  private async _silentVote(
    venueId: string,
    venueName: string,
    voteType: 'hot' | 'dead',
  ) {
    const emoji = voteType === 'hot' ? '🔥' : '💀';
    console.log(
      `[VotingNotification] Silent vote: ${emoji} ${voteType} for ${venueName} (${venueId})`,
    );

    try {
      const token = await getLocalData({key: 'token'});
      if (!token) {
        await offlineVoteQueue.enqueue(
          venueId,
          voteType,
          'notification_action',
        );
        this._notifyToast({
          venueId,
          venueName,
          voteType,
          success: true,
          message: `${emoji} Vote queued for ${venueName}`,
        });
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

      // Notify the app via callback (for haptic feedback / toast)
      this.voteCallback?.(venueId, voteType);

      if (result.success) {
        console.log(
          `[VotingNotification] Silent vote recorded: ${emoji} for ${venueName}`,
        );
        this._notifyToast({
          venueId,
          venueName,
          voteType,
          success: true,
          message:
            result.action === 'updated'
              ? `${emoji} Vote updated for ${venueName}`
              : `${emoji} Voted ${voteType} for ${venueName}`,
        });
      } else {
        this._notifyToast({
          venueId,
          venueName,
          voteType,
          success: false,
          message: result.reason === 'duplicate_vote'
            ? `Already voted for ${venueName} tonight`
            : `Could not record vote`,
        });
      }
    } catch (error: any) {
      console.log(
        '[VotingNotification] Silent vote error, queuing offline:',
        error.message,
      );
      await offlineVoteQueue.enqueue(venueId, voteType, 'notification_action');
      this._notifyToast({
        venueId,
        venueName,
        voteType,
        success: true,
        message: `${emoji} Vote saved — will sync when online`,
      });
    }
  }

  private _notifyToast(confirmation: VoteConfirmation) {
    this.toastCallback?.(confirmation);
  }
}

const votingNotificationHandler = new VotingNotificationHandler();
export default votingNotificationHandler;
