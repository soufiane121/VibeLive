/**
 * LocationSuppressionService — Unit Tests
 *
 * Tests the suppression logic in isolation by directly manipulating
 * the service's internal state via exposed public methods and by
 * mocking time / battery values.
 */

// Save the real Date before any mock touches it
const RealDate = global.Date;

// ── Mocks ──────────────────────────────────────────────────────────

let mockBatteryLevel = 0.8;
let mockLowPowerMode = false;
let mockBatteryLevelCallback: ((e: { batteryLevel: number }) => void) | null = null;
let mockLowPowerCallback: ((e: { lowPowerMode: boolean }) => void) | null = null;
const mockRemoveBatteryLevelSub = jest.fn();
const mockRemoveLowPowerSub = jest.fn();

jest.mock('expo-battery', () => ({
  getBatteryLevelAsync: jest.fn(async () => mockBatteryLevel),
  isLowPowerModeEnabledAsync: jest.fn(async () => mockLowPowerMode),
  addBatteryLevelListener: jest.fn((cb: any) => {
    mockBatteryLevelCallback = cb;
    return { remove: mockRemoveBatteryLevelSub };
  }),
  addLowPowerModeListener: jest.fn((cb: any) => {
    mockLowPowerCallback = cb;
    return { remove: mockRemoveLowPowerSub };
  }),
}));

jest.mock('../src/Utils/LocalStorageHelper', () => ({
  getLocalData: jest.fn().mockResolvedValue(null),
  setLocalData: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/Config/AppConfig', () => ({
  MAX_NIGHTLY_NOTIFICATIONS_BEFORE_SUPPRESS: 3,
  BATTERY_SUPPRESS_THRESHOLD: 0.25,
  BATTERY_RESUME_THRESHOLD: 0.30,
  DAYTIME_SUPPRESS_START_HOUR: 5,
  DAYTIME_SUPPRESS_END_HOUR: 15,
}));

// ── Helper to mock Date.getHours() ─────────────────────────────────

function mockHour(hour: number, minutes = 0) {
  const fakeNow = new RealDate();
  fakeNow.setHours(hour, minutes, 0, 0);

  jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
    if (args.length === 0) return fakeNow as any;
    return new RealDate(...(args as [any])) as any;
  });
}

// ── Helper to get a fresh service instance per test ────────────────

function createService(): any {
  // Force the module to re-export a new instance each time by resetting
  // its _initialized flag. We can't use jest.resetModules() because that
  // breaks the mock wiring. Instead we access the singleton directly.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../src/Services/LocationSuppressionService');
  const svc = mod.default;
  // Reset internal state so each test starts fresh
  svc['_initialized'] = false;
  svc['_batteryLevel'] = 1;
  svc['_isBatterySuppressed'] = false;
  svc['_isLowPowerMode'] = false;
  svc['_nightlyNotificationCount'] = 0;
  svc['_nightlyDate'] = '';
  svc['_batteryLevelSub'] = null;
  svc['_lowPowerModeSub'] = null;
  return svc;
}

// ═══════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════

describe('LocationSuppressionService', () => {
  beforeEach(() => {
    // Reset mock state
    mockBatteryLevel = 0.8;
    mockLowPowerMode = false;
    mockBatteryLevelCallback = null;
    mockLowPowerCallback = null;
    mockRemoveBatteryLevelSub.mockClear();
    mockRemoveLowPowerSub.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Daytime suppression ────────────────────────────────────────

  describe('Daytime suppression', () => {
    it('should suppress during daytime hours (10 AM)', async () => {
      mockHour(10);
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('daytime');
    });

    it('should NOT suppress at night (22:00)', async () => {
      mockHour(22);
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(false);
      expect(service.getSuppressionReason()).toBeNull();
    });

    it('should suppress at exactly 5 AM (boundary inclusive)', async () => {
      mockHour(5);
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('daytime');
    });

    it('should NOT suppress at exactly 3 PM (boundary exclusive)', async () => {
      mockHour(15);
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(false);
    });

    it('should NOT suppress at 4:59 AM (just before daytime)', async () => {
      mockHour(4, 59);
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(false);
    });

    it('should suppress at 14:59 (just before end)', async () => {
      mockHour(14, 59);
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(true);
    });

    it('should NOT suppress at midnight (0:00)', async () => {
      mockHour(0);
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(false);
    });
  });

  // ── Battery suppression ────────────────────────────────────────

  describe('Battery suppression', () => {
    beforeEach(() => mockHour(22));

    it('should suppress when battery ≤ 25%', async () => {
      mockBatteryLevel = 0.20;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('low_battery');
    });

    it('should suppress at exactly 25% boundary', async () => {
      mockBatteryLevel = 0.25;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('low_battery');
    });

    it('should NOT suppress when battery is 80%', async () => {
      mockBatteryLevel = 0.80;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(false);
    });

    it('should NOT suppress at 26% (above suppress threshold, never triggered)', async () => {
      mockBatteryLevel = 0.26;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(false);
    });

    it('should respect hysteresis — stays suppressed at 27%', async () => {
      mockBatteryLevel = 0.20;
      const service = createService();
      await service.initialize();
      expect(service.shouldSuppress()).toBe(true);

      // Simulate battery rising to 27% via listener
      mockBatteryLevelCallback!({ batteryLevel: 0.27 });

      // 27% is in the hysteresis band (25–30%) → still suppressed
      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('low_battery');
    });

    it('should resume when battery reaches 30% (resume threshold)', async () => {
      mockBatteryLevel = 0.20;
      const service = createService();
      await service.initialize();
      expect(service.shouldSuppress()).toBe(true);

      // Simulate charging to 30%
      mockBatteryLevelCallback!({ batteryLevel: 0.30 });

      expect(service.shouldSuppress()).toBe(false);
      expect(service.getSuppressionReason()).toBeNull();
    });

    it('should resume when battery reaches 50% (well above resume)', async () => {
      mockBatteryLevel = 0.15;
      const service = createService();
      await service.initialize();
      expect(service.shouldSuppress()).toBe(true);

      mockBatteryLevelCallback!({ batteryLevel: 0.50 });

      expect(service.shouldSuppress()).toBe(false);
    });
  });

  // ── Low power mode ─────────────────────────────────────────────

  describe('Low power mode suppression', () => {
    beforeEach(() => mockHour(22));

    it('should suppress when low power mode is ON at init', async () => {
      mockLowPowerMode = true;
      mockBatteryLevel = 0.80;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('power_save_mode');
    });

    it('should NOT suppress when low power mode is OFF', async () => {
      mockLowPowerMode = false;
      mockBatteryLevel = 0.80;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(false);
    });

    it('should react to low power mode toggle via listener', async () => {
      mockLowPowerMode = false;
      mockBatteryLevel = 0.80;
      const service = createService();
      await service.initialize();
      expect(service.shouldSuppress()).toBe(false);

      // User enables low power mode
      mockLowPowerCallback!({ lowPowerMode: true });

      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('power_save_mode');
    });

    it('should stop suppressing when low power mode is toggled OFF', async () => {
      mockLowPowerMode = true;
      mockBatteryLevel = 0.80;
      const service = createService();
      await service.initialize();
      expect(service.shouldSuppress()).toBe(true);

      mockLowPowerCallback!({ lowPowerMode: false });

      expect(service.shouldSuppress()).toBe(false);
    });
  });

  // ── Nightly notification cap ───────────────────────────────────

  describe('Nightly notification cap', () => {
    beforeEach(() => mockHour(22));

    it('should NOT suppress when notification count is below cap', async () => {
      const service = createService();
      await service.initialize();

      await service.incrementNightlyNotificationCount(); // 1
      await service.incrementNightlyNotificationCount(); // 2

      expect(service.getNightlyNotificationCount()).toBe(2);
      expect(service.shouldSuppress()).toBe(false);
    });

    it('should suppress when notification count reaches cap (3)', async () => {
      const service = createService();
      await service.initialize();

      await service.incrementNightlyNotificationCount(); // 1
      await service.incrementNightlyNotificationCount(); // 2
      await service.incrementNightlyNotificationCount(); // 3

      expect(service.getNightlyNotificationCount()).toBe(3);
      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('nightly_notification_cap');
    });

    it('should suppress when notification count exceeds cap', async () => {
      const service = createService();
      await service.initialize();

      for (let i = 0; i < 5; i++) {
        await service.incrementNightlyNotificationCount();
      }

      expect(service.getNightlyNotificationCount()).toBe(5);
      expect(service.shouldSuppress()).toBe(true);
    });

    it('should NOT suppress at exactly count = 2 (one below cap)', async () => {
      const service = createService();
      await service.initialize();

      await service.incrementNightlyNotificationCount(); // 1
      await service.incrementNightlyNotificationCount(); // 2

      expect(service.shouldSuppress()).toBe(false);
    });
  });

  // ── Suppression priority ───────────────────────────────────────

  describe('Suppression priority', () => {
    it('daytime takes priority over low battery', async () => {
      mockHour(10);
      mockBatteryLevel = 0.10;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('daytime');
    });

    it('low battery takes priority over low power mode', async () => {
      mockHour(22);
      mockBatteryLevel = 0.15;
      mockLowPowerMode = true;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('low_battery');
    });

    it('low power mode takes priority over notification cap', async () => {
      mockHour(22);
      mockBatteryLevel = 0.80;
      mockLowPowerMode = true;
      const service = createService();
      await service.initialize();

      for (let i = 0; i < 5; i++) {
        await service.incrementNightlyNotificationCount();
      }

      expect(service.getSuppressionReason()).toBe('power_save_mode');
    });
  });

  // ── Combined: night + low battery ──────────────────────────────

  describe('Night + low battery interaction', () => {
    it('should suppress at night when battery is low', async () => {
      mockHour(22);
      mockBatteryLevel = 0.20;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(true);
      expect(service.getSuppressionReason()).toBe('low_battery');
    });

    it('should NOT resume at night until battery reaches 30%', async () => {
      mockHour(22);
      mockBatteryLevel = 0.20;
      const service = createService();
      await service.initialize();
      expect(service.shouldSuppress()).toBe(true);

      // Charge to 28% — still in hysteresis band
      mockBatteryLevelCallback!({ batteryLevel: 0.28 });
      expect(service.shouldSuppress()).toBe(true);

      // Charge to 30% — resumes
      mockBatteryLevelCallback!({ batteryLevel: 0.30 });
      expect(service.shouldSuppress()).toBe(false);
    });
  });

  // ── No suppression (all clear) ────────────────────────────────

  describe('No suppression', () => {
    it('should NOT suppress when all conditions are clear', async () => {
      mockHour(22);
      mockBatteryLevel = 0.80;
      mockLowPowerMode = false;
      const service = createService();
      await service.initialize();

      expect(service.shouldSuppress()).toBe(false);
      expect(service.getSuppressionReason()).toBeNull();
    });
  });

  // ── Lifecycle ──────────────────────────────────────────────────

  describe('Lifecycle', () => {
    it('initialize should be idempotent', async () => {
      mockHour(22);
      const Battery = require('expo-battery');
      const service = createService();
      await service.initialize();
      await service.initialize(); // second call is a no-op

      expect(Battery.getBatteryLevelAsync).toHaveBeenCalledTimes(1);
    });

    it('destroy should clean up listeners', async () => {
      mockHour(22);
      const service = createService();
      await service.initialize();
      service.destroy();

      expect(mockRemoveBatteryLevelSub).toHaveBeenCalledTimes(1);
      expect(mockRemoveLowPowerSub).toHaveBeenCalledTimes(1);
    });

    it('destroy should allow re-initialization', async () => {
      mockHour(22);
      const Battery = require('expo-battery');
      const service = createService();
      await service.initialize();
      service.destroy();
      await service.initialize();

      expect(Battery.getBatteryLevelAsync).toHaveBeenCalledTimes(2);
    });
  });
});
