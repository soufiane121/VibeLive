import {
  BackgroundLocationService,
  LocationCoordinates,
} from '../Services/BackgroundLocationService';
import geofenceMonitor from '../Services/GeofenceMonitorService';
//TODO:: remove only for testing
/**
 * Simulates user walking by feeding coordinates to the location service
 * Useful for testing background location tracking without physical movement
 */

export interface WalkingPath {
  coordinates: Array<{ latitude: number; longitude: number }>;
  interval?: number; // milliseconds between points (default: 2000ms)
  repeat?: boolean; // whether to loop the path (default: false)
}

export interface SimulationCallbacks {
  onLocationUpdate?: (location: LocationCoordinates, index: number) => void;
  onPathComplete?: () => void;
  onError?: (error: Error) => void;
}

class LocationSimulator {
  private static instance: LocationSimulator;
  private isSimulating: boolean = false;
  private currentInterval: NodeJS.Timeout | null = null;
  private currentIndex: number = 0;

  private constructor() {}

  public static getInstance(): LocationSimulator {
    if (!LocationSimulator.instance) {
      LocationSimulator.instance = new LocationSimulator();
    }
    return LocationSimulator.instance;
  }

  /**
   * Simulate walking along a path of coordinates
   */
  public async simulateWalking(
    path: WalkingPath,
    callbacks: SimulationCallbacks = {}
  ): Promise<void> {
    if (this.isSimulating) {
      console.warn('[LocationSimulator] Simulation already in progress');
      return;
    }

    const { coordinates, interval = 3000, repeat = false } = path;
    const { onLocationUpdate, onPathComplete, onError } = callbacks;

    if (!coordinates || coordinates.length === 0) {
      const error = new Error('No coordinates provided for simulation');
      onError?.(error);
      throw error;
    }

    console.log(`[LocationSimulator] Starting simulation with ${coordinates.length} points`);
    console.log(`[LocationSimulator] Interval: ${interval}ms, Repeat: ${repeat}`);

    this.isSimulating = true;
    this.currentIndex = 0;

    const simulateNextPoint = () => {
      if (!this.isSimulating) {
        return;
      }

      const coord = coordinates[this.currentIndex];
      const timestamp = Date.now();

      // Create location object in the correct format expected by expo-location
      const locationObject = {
        coords: {
          latitude: coord.latitude,
          longitude: coord.longitude,
          altitude: null,
          accuracy: 10,
          speed: 1.5,
          heading: 0,
        },
        timestamp,
      };

      console.log(`[LocationSimulator] Point ${this.currentIndex + 1}/${coordinates.length}:`, {
        latitude: coord.latitude,
        longitude: coord.longitude,
      });

      try {
        // Feed to background location service with correct structure
        const locationService = BackgroundLocationService.getInstance();
        (locationService as any).handleLocationUpdate?.(locationObject);

        // Feed to geofence monitor
        geofenceMonitor.sendManualPosition(coord.latitude, coord.longitude);

        // Notify callback with flat LocationCoordinates structure
        onLocationUpdate?.(
          {
            latitude: coord.latitude,
            longitude: coord.longitude,
            timestamp,
            accuracy: 10,
            speed: 1.5,
            heading: 0,
          },
          this.currentIndex
        );

        // Move to next point
        this.currentIndex++;

        if (this.currentIndex >= coordinates.length) {
          if (repeat) {
            console.log('[LocationSimulator] Path complete, repeating...');
            this.currentIndex = 0;
          } else {
            console.log('[LocationSimulator] Path complete');
            this.stopSimulation();
            onPathComplete?.();
            return;
          }
        }
      } catch (error) {
        console.error('[LocationSimulator] Error simulating point:', error);
        onError?.(error as Error);
        this.stopSimulation();
      }
    };

    // Start simulation
    simulateNextPoint();
    this.currentInterval = setInterval(simulateNextPoint, interval);
  }

  /**
   * Stop the current simulation
   */
  public stopSimulation(): void {
    if (!this.isSimulating) {
      return;
    }

    console.log('[LocationSimulator] Stopping simulation');

    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }

    this.isSimulating = false;
    this.currentIndex = 0;
  }

  /**
   * Check if simulation is running
   */
  public isRunning(): boolean {
    return this.isSimulating;
  }

  /**
   * Get current simulation progress
   */
  public getProgress(): { currentIndex: number; isSimulating: boolean } {
    return {
      currentIndex: this.currentIndex,
      isSimulating: this.isSimulating,
    };
  }
}

// Predefined walking paths for testing
export const SAMPLE_PATHS = {
  // Small loop around a city block
  cityBlock: {
    coordinates: [
      {latitude: 35.2271, longitude: -80.8431},
      {latitude: 35.2272, longitude: -80.8432},
      {latitude: 35.2273, longitude: -80.8433},
      {latitude: 35.2274, longitude: -80.8434},
      {latitude: 35.2275, longitude: -80.8435},
      {latitude: 35.2276, longitude: -80.8436},
      {latitude: 35.2275, longitude: -80.8437},
      {latitude: 35.2274, longitude: -80.8438},
      {latitude: 35.2273, longitude: -80.8437},
      {latitude: 35.2272, longitude: -80.8436},
      {latitude: 35.2271, longitude: -80.8435},
      {latitude: 35.227, longitude: -80.8434},
    ],
    interval: 2000,
    repeat: true,
  },

  // Straight line (good for testing distance filters)
  straightLine: {
    coordinates: [
      {latitude: 35.227, longitude: -80.843},
      {latitude: 35.2271, longitude: -80.8431},
      {latitude: 35.2272, longitude: -80.8432},
      {latitude: 35.2273, longitude: -80.8433},
      {latitude: 35.2274, longitude: -80.8434},
      {latitude: 35.2275, longitude: -80.8435},
    ],
    interval: 3000,
    repeat: false,
  },

  // Venue approach (simulating walking toward a venue)
  venueApproachOld: {
    coordinates: [
      {latitude: 35.2258, longitude: -80.8536}, // Starting point
      {latitude: 35.226, longitude: -80.8534},
      {latitude: 35.2262, longitude: -80.8532},
      {latitude: 35.2264, longitude: -80.853},
      {latitude: 35.2266, longitude: -80.8528},
      {latitude: 35.2268, longitude: -80.8526}, // Near venue
      {latitude: 35.227, longitude: -80.8524}, // At venue
    ],
    interval: 2500,
    repeat: false,
  },
  // Venue approach with 3.5 min dwell (for testing 3-min threshold)
  venueApproach: {
    coordinates: [
      // Start directly at venue (no long walk that resets anchor)
      {latitude: 35.15398, longitude: -80.71379}, // point 1: set anchor

      // DWELL: same spot with tiny jitter for 3.5 min
      {latitude: 35.15398, longitude: -80.71379}, // 30s elapsed (0.5 min)
      {latitude: 35.153982, longitude: -80.713788}, // 60s elapsed (1 min)
      {latitude: 35.153978, longitude: -80.713792}, // 90s elapsed (1.5 min)
      {latitude: 35.153981, longitude: -80.713789}, // 120s elapsed (2 min)
      {latitude: 35.153979, longitude: -80.713791}, // 150s elapsed (2.5 min)
      {latitude: 35.15398, longitude: -80.71379}, // 180s elapsed (3 min) ← TRIGGERS!
      {latitude: 35.153982, longitude: -80.713788}, // 210s elapsed (3.5 min)
    ],
    interval: 30000, // 30 seconds between points during dwell
    repeat: false,
  },
};

export default LocationSimulator.getInstance();
