import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import {GlobalColors} from '../styles/GlobalColors';

const colors = GlobalColors.BoostFOMOFlow;

interface MonthlyLimitModalProps {
  visible: boolean;
  onBoostAndGoLive: () => void;
  onCancel: () => void;
}

const MonthlyLimitModal: React.FC<MonthlyLimitModalProps> = ({
  visible,
  onBoostAndGoLive,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Title */}
            <Text style={styles.title}>You've hit your free limit.</Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>
              You've used up your free 30 minutes.{'\n'}
              Boost to go live instantly.
            </Text>
            
            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {/* Primary Button - Boost & Go Live */}
              <TouchableOpacity
                style={styles.boostButton}
                onPress={onBoostAndGoLive}
                activeOpacity={0.8}>
                <Text style={styles.boostButtonText}>Boost & Go Live 🚀</Text>
              </TouchableOpacity>
              
              {/* Secondary Button - Cancel & Go Back */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Cancel & Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContent: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  boostButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  boostButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default MonthlyLimitModal;
