import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import LocationSimulator, { SAMPLE_PATHS } from '../../Utils/LocationSimulator';
import { LocationCoordinates } from '../../Services/BackgroundLocationService';
//TODO:: remove only for testing
export default function LocationSimulatorTest() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [locationLog, setLocationLog] = useState<string[]>([]);
  const [progress, setProgress] = useState({ currentIndex: 0, isSimulating: false });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLocationLog(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const startSimulation = (pathName: string) => {
    if (isSimulating) {
      Alert.alert('Simulation Already Running', 'Stop current simulation first');
      return;
    }

    const path = SAMPLE_PATHS[pathName as keyof typeof SAMPLE_PATHS];
    if (!path) {
      Alert.alert('Error', 'Path not found');
      return;
    }

    addLog(`Starting simulation: ${pathName}`);
    addLog(`Path has ${path.coordinates.length} points`);
    addLog(`Interval: ${path.interval}ms, Repeat: ${path.repeat}`);

    LocationSimulator.simulateWalking(path, {
      onLocationUpdate: (location: LocationCoordinates, index: number) => {
        addLog(`Point ${index + 1}: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      },
      onPathComplete: () => {
        addLog('Path completed!');
        setIsSimulating(false);
      },
      onError: (error: Error) => {
        addLog(`Error: ${error.message}`);
        setIsSimulating(false);
      },
    });

    setIsSimulating(true);
  };

  const stopSimulation = () => {
    LocationSimulator.stopSimulation();
    addLog('Simulation stopped');
    setIsSimulating(false);
  };

  const clearLogs = () => {
    setLocationLog([]);
  };

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const prog = LocationSimulator.getProgress();
      setProgress(prog);
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Simulator Test</Text>
      <Text style={styles.subtitle}>Test background location tracking without physical movement</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isSimulating ? '🟢 Running' : '🔴 Stopped'}
        </Text>
        {isSimulating && (
          <Text style={styles.progressText}>
            Point: {progress.currentIndex + 1}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="City Block Loop"
          onPress={() => startSimulation('cityBlock')}
          disabled={isSimulating}
        />
        <Button
          title="Straight Line"
          onPress={() => startSimulation('straightLine')}
          disabled={isSimulating}
        />
        <Button
          title="Venue Approach"
          onPress={() => startSimulation('venueApproach')}
          disabled={isSimulating}
        />
        <Button
          title="Stop Simulation"
          onPress={stopSimulation}
          disabled={!isSimulating}
          color="#FF3B30"
        />
        <Button
          title="Clear Logs"
          onPress={clearLogs}
          color="#FF9500"
        />
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Location Log</Text>
        <ScrollView style={styles.logScroll}>
          {locationLog.length === 0 ? (
            <Text style={styles.emptyLog}>No logs yet. Start a simulation to see data.</Text>
          ) : (
            locationLog.map((log, index) => (
              <Text key={index} style={styles.logEntry}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How It Works</Text>
        <Text style={styles.infoText}>
          This simulator feeds coordinates to the BackgroundLocationService and
          GeofenceMonitorService to test if background tracking works without
          physical movement. Use this to verify:
        </Text>
        <Text style={styles.infoText}>• Location updates are received</Text>
        <Text style={styles.infoText}>• Geofence triggers work correctly</Text>
        <Text style={styles.infoText}>• Background logging is functional</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    color: '#00CED1',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  logContainer: {
    flex: 1,
    marginBottom: 20,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  logScroll: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 10,
  },
  logEntry: {
    fontSize: 12,
    color: '#00CED1',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptyLog: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  infoContainer: {
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 4,
  },
});
