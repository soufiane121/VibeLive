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

const Colors = GlobalColors.EventCreationFlow;
const colors = {
  background: Colors.background,
  surface: Colors.surface,
  surfaceVariant: '#2a2a2a',
  primary: Colors.primary,
  text: Colors.text,
  textSecondary: Colors.textSecondary,
  textMuted: Colors.textMuted,
  error: Colors.error,
  border: Colors.border,
};

interface EventTicketingProps {
  formData: {
    ticketing: {
      isFree: boolean;
      price: number;
      ticketLink: string;
    };
  };
  errors: { [key: string]: string };
  onUpdateFormData: (updates: any) => void;
}

const EventTicketing: React.FC<EventTicketingProps> = ({
  formData,
  errors,
  onUpdateFormData,
}) => {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Ticketing</Text>
      
      <View style={styles.ticketingOptions}>
        <TouchableOpacity
          style={[styles.ticketOption, formData.ticketing.isFree && styles.ticketOptionActive]}
          onPress={() => onUpdateFormData({
            ticketing: { ...formData.ticketing, isFree: true, price: 0 }
          })}
        >
          <CommonMaterialCommunityIcons
            name="gift"
            size={24}
            color={formData.ticketing.isFree ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.ticketOptionText, formData.ticketing.isFree && styles.ticketOptionTextActive]}>
            Free Event
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ticketOption, !formData.ticketing.isFree && styles.ticketOptionActive]}
          onPress={() => onUpdateFormData({
            ticketing: { ...formData.ticketing, isFree: false }
          })}
        >
          <CommonMaterialCommunityIcons
            name="ticket"
            size={24}
            color={!formData.ticketing.isFree ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.ticketOptionText, !formData.ticketing.isFree && styles.ticketOptionTextActive]}>
            Paid Event
          </Text>
        </TouchableOpacity>
      </View>

      {!formData.ticketing.isFree && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ticket Price *</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.priceInput, errors.price && styles.inputError]}
                value={formData.ticketing.price.toString()}
                onChangeText={(text) => onUpdateFormData({
                  ticketing: { ...formData.ticketing, price: parseFloat(text) || 0 }
                })}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ticket Link</Text>
            <TextInput
              style={styles.input}
              value={formData.ticketing.ticketLink}
              onChangeText={(text) => onUpdateFormData({
                ticketing: { ...formData.ticketing, ticketLink: text }
              })}
              placeholder="https://tickets.example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
            />
          </View>
        </>
      )}
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
  ticketingOptions: { flexDirection: 'row', marginBottom: 20 },
  ticketOption: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingVertical: 20, alignItems: 'center', marginHorizontal: 6,
  },
  ticketOptionActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  ticketOptionText: { fontSize: 14, fontWeight: '600', color: colors.textMuted, marginTop: 8 },
  ticketOptionTextActive: { color: colors.primary },
  priceInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16,
  },
  currencySymbol: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginRight: 8 },
  priceInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text },
});

export default EventTicketing;
