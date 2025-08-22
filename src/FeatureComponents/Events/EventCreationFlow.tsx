import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateEventMutation } from '../../../features/Events/EventsApi';
import { CommonMaterialCommunityIcons } from '../../UIComponents/Icons';


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

const eventTypes = [
  { key: 'music', label: 'Music', icon: 'music-note' },
  { key: 'sports', label: 'Sports', icon: 'sports-football' },
  { key: 'nightlife', label: 'Nightlife', icon: 'local-bar' },
  { key: 'festival', label: 'Festival', icon: 'celebration' },
  { key: 'conference', label: 'Conference', icon: 'business' },
  { key: 'other', label: 'Other', icon: 'event' },
];

const EventCreationFlow: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [createEvent, { isLoading }] = useCreateEventMutation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    location: {
      coordinates: [-74.006, 40.7128] as [number, number],
      address: '',
    },
    eventType: 'other',
    ticketing: {
      isFree: true,
      price: 0,
      ticketLink: '',
      currency: 'USD',
    },
    tags: [] as string[],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Event title is required';
        if (!formData.description.trim()) newErrors.description = 'Event description is required';
        if (!formData.eventType) newErrors.eventType = 'Event type is required';
        break;
      case 2:
        if (formData.startDate <= new Date()) newErrors.startDate = 'Start date must be in the future';
        if (formData.endDate <= formData.startDate) newErrors.endDate = 'End date must be after start date';
        break;
      case 3:
        if (!formData.location.address.trim()) newErrors.address = 'Event location is required';
        break;
      case 4:
        if (!formData.ticketing.isFree && formData.ticketing.price <= 0) {
          newErrors.price = 'Price must be greater than 0 for paid events';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      const eventData = {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        source: 'app',
      };

      const result = await createEvent(eventData).unwrap();
      
      Alert.alert('Success!', 'Your event has been created successfully.', [
        {
          text: 'View Event',
          onPress: () => navigation.navigate('EventDetails', { eventId: result.data._id }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.data?.message || 'Failed to create event. Please try again.');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
              {step}
            </Text>
          </View>
          {step < 4 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Event Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
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
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Describe your event"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Type *</Text>
        <View style={styles.eventTypeGrid}>
          {eventTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.eventTypeItem, formData.eventType === type.key && styles.eventTypeItemActive]}
              onPress={() => setFormData(prev => ({ ...prev, eventType: type.key }))}
            >
              <CommonMaterialCommunityIcons
                name={type.icon as any}
                size={24}
                color={formData.eventType === type.key ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.eventTypeText, formData.eventType === type.key && styles.eventTypeTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.eventType && <Text style={styles.errorText}>{errors.eventType}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Date & Time</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Start Date & Time *</Text>
        <TouchableOpacity
          style={[styles.dateInput, errors.startDate && styles.inputError]}
          onPress={() => setShowStartDatePicker(true)}
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
          onPress={() => setShowEndDatePicker(true)}
        >
          <CommonMaterialCommunityIcons name="calendar" size={20} color={colors.textMuted} />
          <Text style={styles.dateText}>
            {formData.endDate.toLocaleDateString()} at {formData.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
        {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
      </View>

      {/* {showStartDatePicker && (
        <DateTimePicker
          value={formData.startDate}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setFormData(prev => ({ ...prev, startDate: selectedDate }));
            }
          }}
          minimumDate={new Date()}
        />
      )} */}

      {/* {showEndDatePicker && (
        <DateTimePicker
          value={formData.endDate}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setFormData(prev => ({ ...prev, endDate: selectedDate }));
            }
          }}
          minimumDate={formData.startDate}
        />
      )} */}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Location</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Address *</Text>
        <TextInput
          style={[styles.input, errors.address && styles.inputError]}
          value={formData.location.address}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            location: { ...prev.location, address: text }
          }))}
          placeholder="Enter event address"
          placeholderTextColor={colors.textMuted}
        />
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Ticketing</Text>
      
      <View style={styles.ticketingOptions}>
        <TouchableOpacity
          style={[styles.ticketOption, formData.ticketing.isFree && styles.ticketOptionActive]}
          onPress={() => setFormData(prev => ({
            ...prev,
            ticketing: { ...prev.ticketing, isFree: true, price: 0 }
          }))}
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
          onPress={() => setFormData(prev => ({
            ...prev,
            ticketing: { ...prev.ticketing, isFree: false }
          }))}
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
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  ticketing: { ...prev.ticketing, price: parseFloat(text) || 0 }
                }))}
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
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                ticketing: { ...prev.ticketing, ticketLink: text }
              }))}
              placeholder="https://tickets.example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
            />
          </View>
        </>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <CommonMaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={styles.headerRight} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 4 ? 'Create Event' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  headerRight: { width: 24 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, backgroundColor: colors.surface },
  stepContainer: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border,
  },
  stepCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNumber: { fontSize: 14, fontWeight: 'bold', color: colors.textMuted },
  stepNumberActive: { color: colors.text },
  stepLine: { width: 40, height: 2, backgroundColor: colors.border, marginHorizontal: 8 },
  stepLineActive: { backgroundColor: colors.primary },
  content: { flex: 1 },
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text,
  },
  inputError: { borderColor: colors.error },
  textArea: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text,
    minHeight: 100, textAlignVertical: 'top',
  },
  errorText: { fontSize: 14, color: colors.error, marginTop: 4 },
  eventTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  eventTypeItem: {
    width: '30%', aspectRatio: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', margin: '1.5%',
  },
  eventTypeItemActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  eventTypeText: { fontSize: 12, fontWeight: '500', color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  eventTypeTextActive: { color: colors.primary },
  dateInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center',
  },
  dateText: { fontSize: 16, color: colors.text, marginLeft: 12 },
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
  footer: { padding: 20, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  button: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  nextButton: { backgroundColor: colors.primary },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
});

export default EventCreationFlow;
