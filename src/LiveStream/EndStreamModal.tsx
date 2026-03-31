import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { CloseIcon, CheckmarkIcon, CommonMaterialCommunityIcons } from '../UIComponents/Icons';
import { GlobalColors } from '../styles/GlobalColors';

const colors = GlobalColors.EndStreamModal;

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
          <View style={styles.handleBar} />
          
          <View style={styles.modalHeader}>
            <View>
              <View style={styles.actionRequiredWrapper}>
                <Text style={styles.actionIcon}>!</Text>
                <Text style={styles.actionText}>ACTION REQUIRED</Text>
              </View>
              <Text style={styles.modalTitle}>End live stream?</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <CloseIcon size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
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
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>VIEWERS</Text>
              <Text style={styles.statValue}>{viewerCount}</Text>
              <Text style={styles.statSubInfo}>right now</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{formatDuration(streamDuration)}</Text>
              <Text style={styles.statSubInfo}>elapsed</Text>
            </View>
          </View>

          <View style={styles.warningStrip}>
            <View style={styles.warningStripIconWrapper}>
              <Text style={styles.warningStripIcon}>!</Text>
            </View>
            <Text style={styles.warningStripText}>
              This will end your stream for all viewers and cannot be undone
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Keep going</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.endStreamButton} 
              onPress={() => onConfirm(keepPlayback)}
            >
              <View style={styles.stopIconOutline} />
              <Text style={styles.endStreamButtonText}>End stream</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  actionRequiredWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    color: colors.warningText,
    fontWeight: '900',
    fontSize: 14,
    marginRight: 6,
  },
  actionText: {
    color: colors.warningText,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.buttonBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.buttonBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 2,
  },
  statSubInfo: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  warningStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningBackground,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningStripIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.warningText,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  warningStripIcon: {
    color: colors.warningText,
    fontSize: 12,
    fontWeight: '800',
  },
  warningStripText: {
    flex: 1,
    color: colors.warningText,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.buttonBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  endStreamButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.buttonBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIconOutline: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: colors.text,
    marginRight: 8,
    borderRadius: 3,
  },
  endStreamButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  playbackSection: {
    backgroundColor: colors.buttonBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  playbackDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
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
    borderColor: colors.border,
    backgroundColor: colors.buttonBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: GlobalColors.LiveStreamContainer.controlsActive,
    borderColor: GlobalColors.LiveStreamContainer.controlsActive,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  playbackNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default EndStreamModal;
