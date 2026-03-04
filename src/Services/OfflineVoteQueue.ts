import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppState, AppStateStatus} from 'react-native';
import {baseUrl} from '../../baseUrl';
import {getLocalData} from '../Utils/LocalStorageHelper';

const QUEUE_STORAGE_KEY = '@vibelive_offline_votes';
const SYNC_INTERVAL_MS = 30000;
const MAX_QUEUE_SIZE = 100;
const MAX_RETRY_COUNT = 3;

export interface QueuedVote {
  clientId: string;
  venueId: string;
  voteType: 'hot' | 'dead';
  queuedAt: string;
  retryCount: number;
  source: string;
}

type SyncCallback = (result: {synced: number; failed: number}) => void;

class OfflineVoteQueue {
  private queue: QueuedVote[] = [];
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private isSyncing: boolean = false;
  private isOnline: boolean = true;
  private onSyncComplete: SyncCallback | null = null;
  private appStateSubscription: any = null;

  async initialize(onSyncComplete?: SyncCallback) {
    this.onSyncComplete = onSyncComplete || null;

    await this._loadQueue();

    this.appStateSubscription = AppState.addEventListener(
      'change',
      this._handleAppStateChange,
    );

    this._startSyncTimer();

    if (this.queue.length > 0) {
      console.log(
        `[OfflineVoteQueue] Loaded ${this.queue.length} pending votes from storage`,
      );
      this._attemptSync();
    }
  }

  async enqueue(venueId: string, voteType: 'hot' | 'dead', source: string = 'offline_sync'): Promise<string> {
    const clientId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const vote: QueuedVote = {
      clientId,
      venueId,
      voteType,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      source,
    };

    const existingIndex = this.queue.findIndex(
      v => v.venueId === venueId,
    );

    if (existingIndex >= 0) {
      this.queue[existingIndex] = vote;
    } else {
      if (this.queue.length >= MAX_QUEUE_SIZE) {
        this.queue.shift();
      }
      this.queue.push(vote);
    }

    await this._saveQueue();

    this._attemptSync();

    return clientId;
  }

  async remove(clientId: string) {
    this.queue = this.queue.filter(v => v.clientId !== clientId);
    await this._saveQueue();
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getPendingVotes(): QueuedVote[] {
    return [...this.queue];
  }

  setOnlineStatus(online: boolean) {
    const wasOffline = !this.isOnline;
    this.isOnline = online;

    if (wasOffline && online && this.queue.length > 0) {
      console.log('[OfflineVoteQueue] Back online, syncing pending votes');
      this._attemptSync();
    }
  }

  private _handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && this.queue.length > 0) {
      this._attemptSync();
    }
  };

  private _startSyncTimer() {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      if (this.queue.length > 0 && this.isOnline) {
        this._attemptSync();
      }
    }, SYNC_INTERVAL_MS);
  }

  private async _attemptSync() {
    if (this.isSyncing || !this.isOnline || this.queue.length === 0) return;

    this.isSyncing = true;

    try {
      const token = await getLocalData({key: 'token'});
      if (!token) {
        this.isSyncing = false;
        return;
      }

      const votesToSync = this.queue
        .filter(v => v.retryCount < MAX_RETRY_COUNT)
        .slice(0, 20);

      if (votesToSync.length === 0) {
        this.queue = this.queue.filter(v => v.retryCount < MAX_RETRY_COUNT);
        await this._saveQueue();
        this.isSyncing = false;
        return;
      }

      const response = await fetch(`${baseUrl}/voting/sync-offline-votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          votes: votesToSync.map(v => ({
            clientId: v.clientId,
            venueId: v.venueId,
            voteType: v.voteType,
            queuedAt: v.queuedAt,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status ${response.status}`);
      }

      const data = await response.json();

      const successIds = new Set(
        (data.results || [])
          .filter((r: any) => r.success)
          .map((r: any) => r.clientId),
      );

      this.queue = this.queue.filter(v => {
        if (successIds.has(v.clientId)) return false;

        const failedResult = (data.results || []).find(
          (r: any) => r.clientId === v.clientId && !r.success,
        );
        if (failedResult) {
          v.retryCount++;
          return v.retryCount < MAX_RETRY_COUNT;
        }

        return true;
      });

      await this._saveQueue();

      this.onSyncComplete?.({
        synced: data.synced || 0,
        failed: data.failed || 0,
      });

      console.log(
        `[OfflineVoteQueue] Synced ${data.synced}/${votesToSync.length} votes`,
      );
    } catch (error: any) {
      console.log('[OfflineVoteQueue] Sync error:', error.message);

      for (const vote of this.queue) {
        vote.retryCount++;
      }
      await this._saveQueue();
    } finally {
      this.isSyncing = false;
    }
  }

  private async _loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error: any) {
      console.log('[OfflineVoteQueue] Load error:', error.message);
      this.queue = [];
    }
  }

  private async _saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error: any) {
      console.log('[OfflineVoteQueue] Save error:', error.message);
    }
  }

  cleanup() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

const offlineVoteQueue = new OfflineVoteQueue();
export default offlineVoteQueue;
