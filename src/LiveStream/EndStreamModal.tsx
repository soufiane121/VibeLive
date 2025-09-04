import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { CloseIcon, CheckmarkIcon } from '../UIComponents/Icons';

interface EndStreamModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (keepPlayback: boolean) => void;
  viewerCount: number;
  streamDuration: number;
  isBoosted?: boolean;
}

const EndStreamModal: React.FC<EndStreamModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  viewerCount,
  streamDuration,
  isBoosted = false,
}) => {
  const [keepPlayback, setKeepPlayback] = useState(true); // Default to true
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
            Are you sure you want to end your live stream?
          </Text>
          
          {isBoosted && (
            <View style={styles.playbackSection}>
              <Text style={styles.playbackTitle}>Stream Playback</Text>
              <Text style={styles.playbackDescription}>
                Since this is a boosted stream, viewers can watch the playback for up to 12 hours after it ends.
              </Text>
              
              <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setKeepPlayback(!keepPlayback)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, keepPlayback && styles.checkboxChecked]}>
                  {keepPlayback && <CheckmarkIcon size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Keep stream available for playback</Text>
              </TouchableOpacity>
              
              <Text style={styles.playbackNote}>
                {keepPlayback 
                  ? "✅ Viewers will be able to watch your stream for 12 hours"
                  : "⚠️ Stream will be immediately unavailable after ending"
                }
              </Text>
            </View>
          )}
          
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
            <TouchableOpacity 
              style={styles.endStreamButton} 
              onPress={() => onConfirm(keepPlayback)}
            >
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
  playbackSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  playbackDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  playbackNote: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default EndStreamModal;
