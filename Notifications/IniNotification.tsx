/**
 * @deprecated This file uses OneSignal and will be removed.
 * Use FCMNotificationService.ts instead for all notification handling.
 */

// Legacy exports kept as no-ops to avoid breaking any remaining imports.
// Remove this file entirely once all OneSignal references are cleaned up.

const requestUserPermission = async () => {
  console.warn('[IniNotification] Deprecated — use FCMNotificationService');
};

const fetchToken = async () => {
  console.warn('[IniNotification] Deprecated — use FCMNotificationService');
};

const initOneSignal = async (): Promise<void> => {
  console.warn('[IniNotification] Deprecated — use FCMNotificationService');
};

export {
  requestUserPermission,
  fetchToken,
  initOneSignal,
};
