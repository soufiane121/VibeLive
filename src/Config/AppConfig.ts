// ═══════════════════════════════════════════════════════════════════════════
// Centralized Application Configuration
// ═══════════════════════════════════════════════════════════════════════════
// All tunables live here. Change a value once and it propagates everywhere.
// For server-side parity, the backend reads the same knob from process.env.

// ── Authentication Strategy ─────────────────────────────────────────────

/** When true, use dual-token auth (15min access + 30d refresh) with auto-refresh.
 *  When false, revert to legacy single-JWT (7d) flow via /auto-login. */
export const USE_DUAL_TOKEN_AUTH = true;

/** Buffer in milliseconds before access token expiry to trigger proactive refresh.
 *  Prevents edge-case 401s from clock drift or network latency. */
export const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

/** Maximum interval (ms) between location syncs to backend. */
export const LOCATION_SYNC_THROTTLE_MS = 5 * 60 * 1000;

// ── Background Location Suppression ─────────────────────────────────────

/** Number of nightly notifications that trigger background-location suppression.
 *  Keep in sync with backend MAX_NIGHTLY_NOTIFICATIONS env var. */
export const MAX_NIGHTLY_NOTIFICATIONS_BEFORE_SUPPRESS = 3;

/** Battery percentage at or below which background location is suppressed. */
export const BATTERY_SUPPRESS_THRESHOLD = 0.25;

/** Battery percentage at or above which background location is re-enabled
 *  after a low-battery suppression (hysteresis band). */
export const BATTERY_RESUME_THRESHOLD = 0.30;

/** Local hour at which daytime suppression begins (inclusive). */
export const DAYTIME_SUPPRESS_START_HOUR = 5;

/** Local hour at which daytime suppression ends (exclusive). */
export const DAYTIME_SUPPRESS_END_HOUR = 15;
