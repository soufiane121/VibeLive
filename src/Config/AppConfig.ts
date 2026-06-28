// ═══════════════════════════════════════════════════════════════════════════
// Centralized Application Configuration
// ═══════════════════════════════════════════════════════════════════════════
// All tunables live here. Change a value once and it propagates everywhere.
// For server-side parity, the backend reads the same knob from process.env.

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
