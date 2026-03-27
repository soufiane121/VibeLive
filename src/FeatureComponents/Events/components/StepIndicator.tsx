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
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        const isActive = currentStep === step;
        const isPast = currentStep > step;
        const isCompletedOrActive = currentStep >= step;

        return (
          <React.Fragment key={step}>
            <View style={[styles.stepCircle, isCompletedOrActive && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, isCompletedOrActive && styles.stepNumberActive]}>
                {step}
              </Text>
            </View>
            {step < totalSteps && (
              <View style={[styles.stepLine, isPast && styles.stepLineActive]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.stepIndicatorInactiveBox,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircleActive: {
    backgroundColor: colors.stepIndicatorActive,
    borderColor: colors.stepIndicatorActive,
    borderWidth:1
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: colors.stepIndicatorActive,
  },
});

export default StepIndicator;
