import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {GlobalColors} from '../../styles/GlobalColors';
import {useSubmitOutcomeMutation} from '../../../features/squad/SquadApi';

const colors = GlobalColors.SquadMode;

interface SquadOutcomeScreenProps {
  squadCode: string;
  venueName: string;
  onDismiss: () => void;
}

const SquadOutcomeScreen: React.FC<SquadOutcomeScreenProps> = ({
  squadCode,
  venueName,
  onDismiss,
}) => {
  const [submitOutcome, {isLoading}] = useSubmitOutcomeMutation();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    async (rating: 'positive' | 'negative') => {
      try {
        await submitOutcome({squad_code: squadCode, rating}).unwrap();
        setSubmitted(true);
      } catch (err: any) {
        if (err?.status === 409) {
          setSubmitted(true);
        } else {
          Alert.alert('Error', err?.data?.error || 'Failed to submit feedback');
        }
      }
    },
    [squadCode, submitOutcome],
  );

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.thankYouEmoji}>🙏</Text>
          <Text style={styles.thankYouTitle}>Thanks!</Text>
          <Text style={styles.thankYouSub}>
            Your feedback helps us find better spots next time.
          </Text>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>How was {venueName}?</Text>
        <Text style={styles.subtitle}>
          Quick tap — this helps us improve recommendations
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.ratingButton, styles.positiveButton]}
            onPress={() => handleSubmit('positive')}
            disabled={isLoading}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <>
                <Text style={styles.ratingEmoji}>👍</Text>
                <Text style={styles.ratingLabel}>Great pick</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ratingButton, styles.negativeButton]}
            onPress={() => handleSubmit('negative')}
            disabled={isLoading}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Text style={styles.ratingEmoji}>👎</Text>
                <Text style={styles.ratingLabelDark}>Not great</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onDismiss} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positiveButton: {
    backgroundColor: colors.confirmButton,
  },
  negativeButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  ratingLabelDark: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  // Thank you state
  thankYouEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  thankYouTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  thankYouSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  dismissButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  dismissButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SquadOutcomeScreen;
