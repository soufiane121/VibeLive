import React, {useEffect, useRef} from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
} from 'react-native';
import {GlobalColors} from '../styles/GlobalColors';

const {height: screenHeight} = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight / 3; // 1/3 of screen height

interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  backgroundColor?: string;
}

const colors = GlobalColors.ModalBottom;

const BottomModal: React.FC<BottomModalProps> = ({
  visible,
  onClose,
  children,
  backgroundColor = GlobalColors.StreamPlayer.background,
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
          onClose();
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

  return (
    <Modal
      // transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      style={styles.container}
      >
      
      <View style={styles.overlay}>
        {/* Background overlay */}
        <TouchableWithoutFeedback onPress={onClose}>
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
              // backgroundColor,
              transform: [{translateY: slideAnim}],
            },
          ]}
          {...panResponder.panHandlers}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />
          
          {/* Modal content */}
          <View style={styles.content}>
            {children}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default BottomModal;
