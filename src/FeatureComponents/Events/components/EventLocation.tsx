import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CommonMaterialCommunityIcons } from '../../../UIComponents/Icons';
import GlobalColors from '../../../styles/GlobalColors';
import { MyVenue } from '../../../../features/Events/EventsApi';

const GlobalColorsLocal = GlobalColors.EventCreationFlow;

const colors = {
  background: GlobalColorsLocal.background,
  surface: GlobalColorsLocal.surface,
  surfaceVariant: GlobalColorsLocal.surfaceVariant,
  primary: GlobalColorsLocal.primary,
  text: GlobalColorsLocal.text,
  textSecondary: GlobalColorsLocal.textSecondary,
  textMuted: '#71717a',
  error: '#ef4444',
  border: '#374151',
  venueBg: 'rgba(99,102,241,0.08)',
  venueBorder: 'rgba(99,102,241,0.25)',
};

interface EventLocationProps {
  formData: {
    venueId: string;
    location: {
      address: string;
      address1: string;
      city: string;
      zip: string;
    };
  };
  errors: { [key: string]: string };
  onUpdateFormData: (updates: any) => void;
  venue: MyVenue | null;
}

const EventLocation: React.FC<EventLocationProps> = ({
  formData,
  errors,
  onUpdateFormData,
  venue,
}) => {

  const handleUseVenueAddress = () => {
    if (!venue) return;
    onUpdateFormData({
      venueId: venue._id,
      location: {
        ...formData.location,
        address1: venue.address?.street || '',
        city: venue.address?.city || '',
        zip: venue.address?.zip || '',
        address: [venue.address?.street, venue.address?.city, venue.address?.zip].filter(Boolean).join(', '),
      },
    });
  };

  const updateLocationField = (field: string, value: string) => {
    const updated = { ...formData.location, [field]: value };
    const fullAddress = [updated.address1, updated.city, updated.zip].filter(Boolean).join(', ');
    onUpdateFormData({
      location: { ...updated, address: fullAddress },
    });
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Location</Text>

      {venue && (
        <TouchableOpacity style={styles.venueButton} onPress={handleUseVenueAddress} activeOpacity={0.7}>
          <CommonMaterialCommunityIcons name="store" size={20} color={colors.primary} />
          <View style={styles.venueButtonTextContainer}>
            <Text style={styles.venueButtonLabel}>Use Venue Address</Text>
            <Text style={styles.venueButtonName}>{venue.name}</Text>
          </View>
          <CommonMaterialCommunityIcons name="arrow-right" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address 1 *</Text>
        <TextInput
          style={[styles.input, errors.address1 && styles.inputError]}
          value={formData.location.address1}
          onChangeText={(text) => updateLocationField('address1', text)}
          placeholder="Street address"
          placeholderTextColor={colors.textMuted}
        />
        {errors.address1 && <Text style={styles.errorText}>{errors.address1}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>City *</Text>
        <TextInput
          style={[styles.input, errors.city && styles.inputError]}
          value={formData.location.city}
          onChangeText={(text) => updateLocationField('city', text)}
          placeholder="City"
          placeholderTextColor={colors.textMuted}
        />
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Zip Code</Text>
        <TextInput
          style={[styles.input, errors.zip && styles.inputError]}
          value={formData.location.zip}
          onChangeText={(text) => updateLocationField('zip', text)}
          placeholder="Zip code"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
        />
        {errors.zip && <Text style={styles.errorText}>{errors.zip}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
  venueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.venueBg,
    borderWidth: 1,
    borderColor: colors.venueBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  venueButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  venueButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  venueButtonName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
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
