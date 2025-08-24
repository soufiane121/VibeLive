import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { GlobalColors } from '../../../styles/GlobalColors';

const colors = GlobalColors.EventCreationFlow;

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
              {step}
            </Text>
          </View>
          {step < totalSteps && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.background,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor: colors.stepIndicatorInactive,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  stepCircleActive: {
    backgroundColor: colors.stepIndicatorActive,
    borderColor: colors.stepIndicatorActive,
  },
  stepNumber: {
    fontSize: 14,
    // fontWeight: 'bold',
    color: colors.textMuted,
  },
  stepNumberActive: {
    color: colors.text,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.stepIndicatorInactive,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.stepIndicatorActive,
  },
});

export default StepIndicator;
