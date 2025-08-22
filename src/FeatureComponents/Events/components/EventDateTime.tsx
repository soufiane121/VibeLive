import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CommonMaterialCommunityIcons } from '../../../UIComponents/Icons';

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

interface EventDateTimeProps {
  formData: {
    startDate: Date;
    endDate: Date;
  };
  errors: { [key: string]: string };
  onUpdateFormData: (updates: any) => void;
  onShowStartDatePicker: () => void;
  onShowEndDatePicker: () => void;
}

const EventDateTime: React.FC<EventDateTimeProps> = ({
  formData,
  errors,
  onUpdateFormData,
  onShowStartDatePicker,
  onShowEndDatePicker,
}) => {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Date & Time</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Start Date & Time *</Text>
        <TouchableOpacity
          style={[styles.dateInput, errors.startDate && styles.inputError]}
          onPress={onShowStartDatePicker}
        >
          <CommonMaterialCommunityIcons name="calendar" size={20} color={colors.textMuted} />
          <Text style={styles.dateText}>
            {formData.startDate.toLocaleDateString()} at {formData.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
        {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>End Date & Time *</Text>
        <TouchableOpacity
          style={[styles.dateInput, errors.endDate && styles.inputError]}
          onPress={onShowEndDatePicker}
        >
          <CommonMaterialCommunityIcons name="calendar" size={20} color={colors.textMuted} />
          <Text style={styles.dateText}>
            {formData.endDate.toLocaleDateString()} at {formData.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
        {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  dateInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center',
  },
  inputError: { borderColor: colors.error },
  dateText: { fontSize: 16, color: colors.text, marginLeft: 12 },
  errorText: { fontSize: 14, color: colors.error, marginTop: 4 },
});

export default EventDateTime;
