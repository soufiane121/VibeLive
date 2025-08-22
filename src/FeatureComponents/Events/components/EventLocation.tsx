import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceVariant: '#2a2a2a',
  primary: '#4f46e5',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  error: '#ef4444',
  border: '#374151',
};

interface EventLocationProps {
  formData: {
    location: {
      address: string;
    };
  };
  errors: { [key: string]: string };
  onUpdateFormData: (updates: any) => void;
}

const EventLocation: React.FC<EventLocationProps> = ({
  formData,
  errors,
  onUpdateFormData,
}) => {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Location</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Address *</Text>
        <TextInput
          style={[styles.input, errors.address && styles.inputError]}
          value={formData.location.address}
          onChangeText={(text) => onUpdateFormData({
            location: { ...formData.location, address: text }
          })}
          placeholder="Enter event address"
          placeholderTextColor={colors.textMuted}
        />
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text,
  },
  inputError: { borderColor: colors.error },
  errorText: { fontSize: 14, color: colors.error, marginTop: 4 },
});

export default EventLocation;
