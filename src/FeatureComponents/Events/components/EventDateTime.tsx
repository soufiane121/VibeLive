import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { CommonMaterialCommunityIcons } from '../../../UIComponents/Icons';
import DateTimePicker from 'react-native-ui-datepicker';
import { GlobalColors } from '../../../styles/GlobalColors';

const colors = GlobalColors.EventCreationFlow;
const commonColors = GlobalColors.Common;

interface EventDateTimeProps {
  formData: {
    startDate: Date;
    endDate: Date;
  };
  errors: { [key: string]: string };
  onUpdateFormData: (updates: any) => void;
  // Kept for backward compatibility if needed, but we handle state locally now
  onShowStartDatePicker?: () => void;
  onShowEndDatePicker?: () => void;
}

const EventDateTime: React.FC<EventDateTimeProps> = ({
  formData,
  errors,
  onUpdateFormData,
  onShowStartDatePicker,
  onShowEndDatePicker,
}) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleShowStartPicker = () => {
    setShowStartPicker(true);
    onShowStartDatePicker?.();
  };

  const handleShowEndPicker = () => {
    setShowEndPicker(true);
    onShowEndDatePicker?.();
  };

  const getDatePickerStyles = () => ({
    header: { backgroundColor: colors.surface },
    month_selector_label: { color: colors.text },
    year_selector_label: { color: colors.text },
    weekdays: { backgroundColor: colors.surface },
    weekday_label: { color: colors.textSecondary },
    day_label: { color: colors.text },
    selected: { backgroundColor: colors.primary },
    selected_label: { color: '#FFF' },
    time_label: { color: colors.text },
    time_selector_label: { color: colors.text },
    time_selected_indicator: { backgroundColor: colors.primarySurface },
    button_prev: { backgroundColor: colors.surfaceVariant },
    button_next: { backgroundColor: colors.surfaceVariant },
  });

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Date & Time</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Start Date & Time *</Text>
        <TouchableOpacity
          style={[styles.dateInput, errors.startDate && styles.inputError]}
          onPress={handleShowStartPicker}
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
          onPress={handleShowEndPicker}
        >
          <CommonMaterialCommunityIcons name="calendar" size={20} color={colors.textMuted} />
          <Text style={styles.dateText}>
            {formData.endDate.toLocaleDateString()} at {formData.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
        {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
      </View>

      {/* Start Date Modal */}
      <Modal visible={showStartPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <DateTimePicker
              mode='single'
              date={formData.startDate}
              onChange={(params) => onUpdateFormData({ startDate: params.date })}
              timePicker={true}
              use12Hours={true}
              styles={getDatePickerStyles()}
            />
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowStartPicker(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* End Date Modal */}
      <Modal visible={showEndPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <DateTimePicker
              mode='single'
              date={formData.endDate}
              onChange={(params) => onUpdateFormData({ endDate: params.date })}
              timePicker={true}
              use12Hours={true}
              styles={getDatePickerStyles()}
            />
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowEndPicker(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  dateInput: {
    backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center',
  },
  inputError: { borderColor: colors.error },
  dateText: { fontSize: 16, color: colors.text, marginLeft: 12 },
  errorText: { fontSize: 14, color: colors.error, marginTop: 4 },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: commonColors.modalBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventDateTime;
