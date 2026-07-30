import AsyncStorage from '@react-native-async-storage/async-storage';
import {baseUrl} from '../../baseUrl';
import {ACCESS_TOKEN_REFRESH_BUFFER_MS} from '../Config/AppConfig';

// ═══════════════════════════════════════════════════════════════════════════
// TokenManager — Singleton service managing dual-token lifecycle
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@vibelive:access_token',
  REFRESH_TOKEN: '@vibelive:refresh_token',
  ACCESS_EXPIRES_AT: '@vibelive:access_expires_at',
  REFRESH_EXPIRES_AT: '@vibelive:refresh_expires_at',
  LEGACY_TOKEN: 'token',
} as const;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt?: number;
}

type SignOutCallback = () => void;

class TokenManagerService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private accessExpiresAt: number = 0;
  private refreshMutex: Promise<string | null> | null = null;
  private signOutCallback: SignOutCallback | null = null;
  private hydrated = false;

  setSignOutCallback(callback: SignOutCallback): void {
    this.signOutCallback = callback;
  }

  async hydrate(): Promise<void> {
    if (this.hydrated) return;

    const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.ACCESS_EXPIRES_AT),
    ]);

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.accessExpiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
    this.hydrated = true;
  }

  async setTokens(pair: TokenPair): Promise<void> {
    this.accessToken = pair.accessToken;
    this.refreshToken = pair.refreshToken;
    this.accessExpiresAt = pair.accessExpiresAt;

    const writes: [string, string][] = [
      [STORAGE_KEYS.ACCESS_TOKEN, pair.accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, pair.refreshToken],
      [STORAGE_KEYS.ACCESS_EXPIRES_AT, String(pair.accessExpiresAt)],
      [STORAGE_KEYS.LEGACY_TOKEN, pair.accessToken],
    ];

    if (pair.refreshExpiresAt) {
      writes.push([STORAGE_KEYS.REFRESH_EXPIRES_AT, String(pair.refreshExpiresAt)]);
    }

    await AsyncStorage.multiSet(writes);
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.accessExpiresAt = 0;
    this.hydrated = false;

    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.ACCESS_EXPIRES_AT,
      STORAGE_KEYS.REFRESH_EXPIRES_AT,
      STORAGE_KEYS.LEGACY_TOKEN,
      'isAuthenticated',
    ]);
  }

  isAccessTokenExpired(): boolean {
    if (!this.accessToken || !this.accessExpiresAt) return true;
    return Date.now() >= this.accessExpiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS;
  }

  hasRefreshToken(): boolean {
    return !!this.refreshToken;
  }

  getAccessTokenSync(): string | null {
    return this.accessToken;
  }

  async getValidAccessToken(): Promise<string | null> {
    await this.hydrate();

    if (this.accessToken && !this.isAccessTokenExpired()) {
      return this.accessToken;
    }

    if (!this.refreshToken) {
      return null;
    }

    return this.refreshAccessToken();
  }

  async refreshAccessToken(): Promise<string | null> {
    // Mutex: if a refresh is already in-flight, wait for it
    if (this.refreshMutex) {
      return this.refreshMutex;
    }

    this.refreshMutex = this._performRefresh();

    try {
      return await this.refreshMutex;
    } finally {
      this.refreshMutex = null;
    }
  }

  private async _performRefresh(): Promise<string | null> {
    try {
      const response = await fetch(`${baseUrl}/users/token/refresh`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refreshToken: this.refreshToken}),
      });

      if (!response.ok) {
        // Refresh token expired or invalid — force sign out
        if (response.status === 401 || response.status === 403) {
          await this.clearTokens();
          this.signOutCallback?.();
          return null;
        }
        return null;
      }

      const data: TokenPair = await response.json();

      await this.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessExpiresAt: data.accessExpiresAt,
        refreshExpiresAt: data.refreshExpiresAt,
      });

      return data.accessToken;
    } catch {
      return this.accessToken;
    }
  }
}

export const TokenManager = new TokenManagerService();
