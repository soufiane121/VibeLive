import * as Battery from 'expo-battery';
import {getLocalData, setLocalData} from '../Utils/LocalStorageHelper';
import {
  MAX_NIGHTLY_NOTIFICATIONS_BEFORE_SUPPRESS,
  BATTERY_SUPPRESS_THRESHOLD,
  BATTERY_RESUME_THRESHOLD,
  DAYTIME_SUPPRESS_START_HOUR,
  DAYTIME_SUPPRESS_END_HOUR,
} from '../Config/AppConfig';

// ═══════════════════════════════════════════════════════════════════════════
// AsyncStorage Keys
// ═══════════════════════════════════════════════════════════════════════════
const STORAGE_KEY_NIGHTLY_COUNT = '@loc_suppress_nightly_count';
const STORAGE_KEY_NIGHTLY_DATE = '@loc_suppress_nightly_date';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Returns the "night date" string for grouping (rolls over at 5 AM local).
 *  E.g. a timestamp at 2 AM on Jan 5 still belongs to the Jan 4 night. */
function getNightDateLocal(): string {
  const now = new Date();
  const adjusted = new Date(
    now.getTime() - DAYTIME_SUPPRESS_START_HOUR * 60 * 60 * 1000,
  );
  const y = adjusted.getFullYear();
  const m = String(adjusted.getMonth() + 1).padStart(2, '0');
  const d = String(adjusted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// LocationSuppressionService (singleton)
// ═══════════════════════════════════════════════════════════════════════════
class LocationSuppressionService {
  // ── Battery state (kept fresh via listeners) ────────────────────────
  private _batteryLevel: number = 1;
  private _isBatterySuppressed: boolean = false;
  private _isLowPowerMode: boolean = false;

  // ── Nightly notification count (persisted in AsyncStorage) ──────────
  private _nightlyNotificationCount: number = 0;
  private _nightlyDate: string = '';

  // ── Listener subscriptions ──────────────────────────────────────────
  private _batteryLevelSub: Battery.Subscription | null = null;
  private _lowPowerModeSub: Battery.Subscription | null = null;

  private _initialized: boolean = false;

  // ────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ────────────────────────────────────────────────────────────────────
  async initialize(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    try {
      // Seed initial values
      this._batteryLevel = await Battery.getBatteryLevelAsync();
      this._isLowPowerMode = await Battery.isLowPowerModeEnabledAsync();
      this._evaluateBatterySuppression();

      // Subscribe to changes
      this._batteryLevelSub = Battery.addBatteryLevelListener(({batteryLevel}) => {
        this._batteryLevel = batteryLevel;
        this._evaluateBatterySuppression();
      });

      this._lowPowerModeSub = Battery.addLowPowerModeListener(({lowPowerMode}) => {
        this._isLowPowerMode = lowPowerMode;
      });

      // Load persisted nightly count
      await this._loadNightlyCount();

      console.log(
        `[LocationSuppression] Initialized — battery=${(this._batteryLevel * 100).toFixed(0)}%, ` +
        `lowPower=${this._isLowPowerMode}, nightlyCount=${this._nightlyNotificationCount}`,
      );
    } catch (error: any) {
      console.error('[LocationSuppression] Init error:', error.message);
    }
  }

  destroy(): void {
    this._batteryLevelSub?.remove();
    this._lowPowerModeSub?.remove();
    this._batteryLevelSub = null;
    this._lowPowerModeSub = null;
    this._initialized = false;
  }

  // ────────────────────────────────────────────────────────────────────
  // Public API — synchronous hot-path check
  // ────────────────────────────────────────────────────────────────────

  /** Returns `true` when background location updates should be discarded.
   *  This is a **synchronous** read — safe to call inside TaskManager callbacks. */
  shouldSuppress(): boolean {
    if (this._isDaytime()) return true;
    if (this._isBatterySuppressed) return true;
    if (this._isLowPowerMode) return true;
    if (this._isNightlyCapReached()) return true;
    return false;
  }

  /** Returns a human-readable reason string (for logging). */
  getSuppressionReason(): string | null {
    console.log("getSuppressionReason",this._isDaytime(), this._isBatterySuppressed, this._isLowPowerMode);
    
    if (this._isDaytime()) return 'daytime';
    if (this._isBatterySuppressed) return 'low_battery';
    if (this._isLowPowerMode) return 'power_save_mode';
    if (this._isNightlyCapReached()) return 'nightly_notification_cap';
    return null;
  }

  // ────────────────────────────────────────────────────────────────────
  // Nightly notification count (called by FCMNotificationService)
  // ────────────────────────────────────────────────────────────────────

  /** Increment the count for the current night. Call after routing a
   *  voting/vibe-shift notification to the user. */
  async incrementNightlyNotificationCount(): Promise<void> {
    const currentNight = getNightDateLocal();

    // Reset if the night has rolled over
    if (this._nightlyDate !== currentNight) {
      this._nightlyNotificationCount = 0;
      this._nightlyDate = currentNight;
    }

    this._nightlyNotificationCount += 1;
    await this._persistNightlyCount();

    console.log(
      `[LocationSuppression] Nightly notification count: ${this._nightlyNotificationCount}/${MAX_NIGHTLY_NOTIFICATIONS_BEFORE_SUPPRESS}`,
    );
  }

  /** Read current count (exposed for debugging / tests). */
  getNightlyNotificationCount(): number {
    return this._nightlyNotificationCount;
  }

  // ────────────────────────────────────────────────────────────────────
  // Private — battery hysteresis
  // ────────────────────────────────────────────────────────────────────
  private _evaluateBatterySuppression(): void {
    if (this._isBatterySuppressed) {
      // Currently suppressed — only lift when battery >= resume threshold
      if (this._batteryLevel >= BATTERY_RESUME_THRESHOLD) {
        this._isBatterySuppressed = false;
        console.log(
          `[LocationSuppression] Battery recovered to ${(this._batteryLevel * 100).toFixed(0)}% — suppression lifted`,
        );
      }
    } else {
      // Not suppressed — suppress when battery <= suppress threshold
      if (this._batteryLevel <= BATTERY_SUPPRESS_THRESHOLD) {
        this._isBatterySuppressed = true;
        console.log(
          `[LocationSuppression] Battery at ${(this._batteryLevel * 100).toFixed(0)}% — suppressing background location`,
        );
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Private — daytime check
  // ────────────────────────────────────────────────────────────────────
  private _isDaytime(): boolean {
    const hour = new Date().getHours();
    return hour >= DAYTIME_SUPPRESS_START_HOUR && hour < DAYTIME_SUPPRESS_END_HOUR;
  }

  // ────────────────────────────────────────────────────────────────────
  // Private — nightly cap check
  // ────────────────────────────────────────────────────────────────────
  private _isNightlyCapReached(): boolean {
    const currentNight = getNightDateLocal();

    // If the stored night is stale, the count is effectively 0 — not reached
    if (this._nightlyDate !== currentNight) {
      return false;
    }

    return this._nightlyNotificationCount >= MAX_NIGHTLY_NOTIFICATIONS_BEFORE_SUPPRESS;
  }

  // ────────────────────────────────────────────────────────────────────
  // Private — AsyncStorage persistence
  // ────────────────────────────────────────────────────────────────────
  private async _loadNightlyCount(): Promise<void> {
    try {
      const storedDate = (await getLocalData({key: STORAGE_KEY_NIGHTLY_DATE})) as string | null;
      const storedCount = (await getLocalData({key: STORAGE_KEY_NIGHTLY_COUNT})) as string | null;
      const currentNight = getNightDateLocal();

      if (storedDate === currentNight && storedCount) {
        this._nightlyNotificationCount = parseInt(storedCount, 10) || 0;
        this._nightlyDate = currentNight;
      } else {
        // New night — reset
        this._nightlyNotificationCount = 0;
        this._nightlyDate = currentNight;
        await this._persistNightlyCount();
      }
    } catch (error: any) {
      console.error('[LocationSuppression] Load nightly count error:', error.message);
      this._nightlyNotificationCount = 0;
    }
  }

  private async _persistNightlyCount(): Promise<void> {
    try {
      await setLocalData({key: STORAGE_KEY_NIGHTLY_DATE, value: this._nightlyDate});
      await setLocalData({key: STORAGE_KEY_NIGHTLY_COUNT, value: String(this._nightlyNotificationCount)});
    } catch (error: any) {
      console.error('[LocationSuppression] Persist nightly count error:', error.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Singleton export
// ═══════════════════════════════════════════════════════════════════════════
const locationSuppressionService = new LocationSuppressionService();
export default locationSuppressionService;
