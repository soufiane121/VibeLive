import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {CommonMaterialCommunityIcons, CommonMaterialIcons} from '../../../UIComponents/Icons';
import GlobalColors from '../../../styles/GlobalColors';

const eventTypes = [
  {key: 'music', label: 'Music', icon: 'music-note'},
  {key: 'sports', label: 'Sports', icon: 'sports-football'},
  {key: 'nightlife', label: 'Nightlife', icon: 'local-bar'},
  {key: 'festival', label: 'Festival', icon: 'celebration'},
  {key: 'conference', label: 'Conference', icon: 'business'},
  {key: 'other', label: 'Other', icon: 'event'},
];

interface EventBasicDetailsProps {
  formData: {
    title: string;
    description: string;
    eventType: string;
  };
  errors: {[key: string]: string};
  onUpdateFormData: (updates: any) => void;
}
const Globalcolors = GlobalColors.EventCreationFlow;

const colors = {
  background: Globalcolors.background,
  surface: Globalcolors.surface,
  surfaceVariant: '#2a2a2a',
  primary: Globalcolors.primary,
  text: Globalcolors.text,
  textSecondary: Globalcolors.textSecondary,
  textMuted: Globalcolors.textMuted,
  error: Globalcolors.error,
  border: Globalcolors.border,
};

const EventBasicDetails: React.FC<EventBasicDetailsProps> = ({
  formData,
  errors,
  onUpdateFormData,
}) => {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Event Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={formData.title}
          onChangeText={text => onUpdateFormData({title: text})}
          placeholder="Enter event title"
          placeholderTextColor={colors.textMuted}
          maxLength={100}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          value={formData.description}
          onChangeText={text => onUpdateFormData({description: text})}
          placeholder="Describe your event"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Type *</Text>
        <View style={styles.eventTypeGrid}>
          {eventTypes.map(type => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.eventTypeItem,
                formData.eventType === type.key && styles.eventTypeItemActive,
              ]}
              onPress={() => onUpdateFormData({eventType: type.key})}>
              <CommonMaterialIcons
                name={type.icon as any}
                size={24}
                color={
                  formData.eventType === type.key
                    ? colors.primary
                    : colors.textMuted
                }
              />
              <Text
                style={[
                  styles.eventTypeText,
                  formData.eventType === type.key && styles.eventTypeTextActive,
                ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.eventType && (
          <Text style={styles.errorText}>{errors.eventType}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: {padding: 20},
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  inputGroup: {marginBottom: 20},
  label: {fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8},
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {borderColor: colors.error},
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {fontSize: 14, color: colors.error, marginTop: 4},
  eventTypeGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 8},
  eventTypeItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
  },
  eventTypeItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  eventTypeTextActive: {color: colors.primary},
});

export default EventBasicDetails;
