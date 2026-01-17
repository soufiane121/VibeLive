import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  PanResponder,
} from 'react-native';
import {GlobalColors, ColorScheme} from '../styles/GlobalColors';

const {height: screenHeight} = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.7; // 70% of screen height for more content

interface FreeStreamLimitModalProps {
  visible: boolean;
  onBoostAndGoLive: () => void;
  onCancel: () => void;
  freeStreamingStatus?: {
    weeklyStreamsUsed: number;
    maxWeeklyStreams: number;
    nextResetDate?: string;
    message: string;
  };
}

// Get typed colors from GlobalColors
const colors = GlobalColors.ModalBottom;

const FreeStreamLimitModal: React.FC<FreeStreamLimitModalProps> = ({
  visible,
  onBoostAndGoLive,
  onCancel,
  freeStreamingStatus,
}) => {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MODAL_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  // Pan responder for swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > MODAL_HEIGHT * 0.3) {
          // Close if dragged down more than 30% of modal height
          onCancel();
        } else {
          // Snap back to open position
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const formatResetDate = (dateString?: string) => {
    if (!dateString) return 'Next Friday';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        {/* Background overlay */}
        <TouchableWithoutFeedback onPress={onCancel}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: opacityAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Modal content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{translateY: slideAnim}],
            },
          ]}
          {...panResponder.panHandlers}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Free Streaming Limit Reached</Text>
            <Text style={styles.subtitle}>
              {freeStreamingStatus?.weeklyStreamsUsed || 2}/2 weekly streams used
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              {freeStreamingStatus?.message || 
               "You've used your 2 free streams for this week. Each free stream allows up to 10 minutes of streaming time."}
            </Text>

            <View style={styles.resetInfo}>
              <Text style={styles.resetText}>
                🔄 Free streams reset: {formatResetDate(freeStreamingStatus?.nextResetDate)}
              </Text>
            </View>

            <View style={styles.boostBenefits}>
              <Text style={styles.boostTitle}>Boost Benefits:</Text>
              <Text style={styles.benefit}>• Unlimited streaming time</Text>
              <Text style={styles.benefit}>• Higher visibility in discovery</Text>
              <Text style={styles.benefit}>• Priority placement on map</Text>
              <Text style={styles.benefit}>• No weekly limits</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.boostButton}
              onPress={onBoostAndGoLive}>
              <Text style={styles.boostButtonText}>Boost & Go Live</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Continue Anyway</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay || 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: colors.shadow || '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.dragHandle || 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: colors.text || '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.error || '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  message: {
    color: colors.textSecondary || '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  resetInfo: {
    backgroundColor: colors.infoBackground || 'rgba(0, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.infoBorder || 'rgba(0, 255, 255, 0.3)',
  },
  resetText: {
    color: colors.infoText || '#00FFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  boostBenefits: {
    backgroundColor: colors.highlightBackground || 'rgba(255, 215, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.highlightBorder || 'rgba(255, 215, 0, 0.2)',
  },
  boostTitle: {
    color: colors.highlight || '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  benefit: {
    color: colors.textSecondary || '#CCCCCC',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border || 'rgba(255, 255, 255, 0.1)',
  },
  boostButton: {
    backgroundColor: colors.primary || '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: colors.primary || '#FFD700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  boostButtonText: {
    color: colors.buttonText || '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: colors.textSecondary || '#CCCCCC',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FreeStreamLimitModal;
