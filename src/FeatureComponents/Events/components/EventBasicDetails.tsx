import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {CommonMaterialCommunityIcons} from '../../../UIComponents/Icons';
import { GlobalColors } from '../../../styles/GlobalColors';

const eventTypes = [
  {key: 'music', label: 'Music', icon: 'music-note'},
  {key: 'sports', label: 'Sports', icon: 'basketball'},
  {key: 'nightlife', label: 'Nightlife', icon: 'glass-cocktail'},
  {key: 'festival', label: 'Festival', icon: 'star-outline'},
  {key: 'conference', label: 'Conference', icon: 'calendar-blank'},
  {key: 'other', label: 'Other', icon: 'alert-circle-outline'},
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

const colors = GlobalColors.EventCreationFlow;

const EventBasicDetails: React.FC<EventBasicDetailsProps> = ({
  formData,
  errors,
  onUpdateFormData,
}) => {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepSubtitle}>STEP 1 OF 5</Text>
      <Text style={styles.stepTitle}>Event details</Text>

      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <View style={styles.labelDot} />
          <Text style={styles.label}>Event title</Text>
        </View>
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
        <View style={styles.labelContainer}>
          <View style={styles.labelDot} />
          <Text style={styles.label}>Description</Text>
        </View>
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
        <View style={styles.labelContainer}>
          <View style={styles.labelDot} />
          <Text style={styles.label}>Event type</Text>
        </View>
        <View style={styles.eventTypeGrid}>
          {eventTypes.map(type => {
            const isActive = formData.eventType === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.eventTypeItem,
                  isActive && styles.eventTypeItemActive,
                ]}
                onPress={() => onUpdateFormData({eventType: type.key})}>
                <View style={[styles.eventIconWrapper, isActive && styles.eventIconWrapperActive]}>
                  <CommonMaterialCommunityIcons
                    name={type.icon as any}
                    size={20}
                    color={isActive ? colors.background : colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.eventTypeText,
                    isActive && styles.eventTypeTextActive,
                  ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.eventType && (
          <Text style={styles.errorText}>{errors.eventType}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  stepSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14, 
    color: colors.error, 
    marginTop: 6,
    fontWeight: '600',
  },
  eventTypeGrid: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginTop: 4,
  },
  eventTypeItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeItemActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySurface,
  },
  eventIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderLight, // matches inner gray line
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIconWrapperActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eventTypeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  eventTypeTextActive: {
    color: colors.primary,
  },
});

export default EventBasicDetails;
