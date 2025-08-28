import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { CloseIcon } from '../UIComponents/Icons';

interface EndStreamModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  viewerCount: number;
  streamDuration: number;
}

const EndStreamModal: React.FC<EndStreamModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  viewerCount,
  streamDuration,
}) => {
  // Format duration for display (MM:SS)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>End Live Stream?</Text>
            <TouchableOpacity onPress={onCancel}>
              <CloseIcon size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Are you sure you want to end your live stream? This action cannot be undone.
          </Text>
          
          <View style={styles.modalStats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Current viewers:</Text>
              <Text style={styles.statValue}>{viewerCount}K</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Stream duration:</Text>
              <Text style={styles.statValue}>{formatDuration(streamDuration)}</Text>
            </View>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.endStreamButton} onPress={onConfirm}>
              <Text style={styles.endStreamButtonText}>End Stream</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: width - 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalStats: {
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  endStreamButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  endStreamButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default EndStreamModal;
