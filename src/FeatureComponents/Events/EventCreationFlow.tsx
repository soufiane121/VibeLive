import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronBackIcon, CommonMaterialCommunityIcons } from '../../UIComponents/Icons';
import EventBasicDetails from './components/EventBasicDetails';
import EventDateTime from './components/EventDateTime';
import EventLocation from './components/EventLocation';
import EventTicketing from './components/EventTicketing';
import EventPromotion from './components/EventPromotion';
import StepIndicator from './components/StepIndicator';
import { useCreateEventMutation } from '../../../features/Events/EventsApi';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { GlobalColors } from '../../styles/GlobalColors';
import useGetLocation from '../../CustomHooks/useGetLocation';
import { KeyboardAvoidingView } from 'react-native';
import { Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const colors = GlobalColors.EventCreationFlow;

const EventCreationFlow: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [createEvent, { isLoading }] = useCreateEventMutation();
  const {coordinates} = useGetLocation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    location: {
      coordinates: coordinates as [number, number],
      address: '',
    },
    eventType: '',
    ticketing: {
      isFree: true,
      price: 0,
      ticketLink: '',
      currency: 'USD',
    },
    tags: [] as string[],
    promotion: {
      isPromoted: false,
      type: 'none' as 'none' | 'map' | 'list' | 'both',
      duration: 1,
      totalCost: 0,
    },
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
      case 5:
        // Promotion step validation (optional step)
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
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

  const calculatePromotionCost = (type: string, duration: number): number => {
    const basePrices = { map: 10, list: 7, both: 15 };
    const basePrice = basePrices[type as keyof typeof basePrices] || 0;
    return basePrice * duration;
  };

  const handlePromotionChange = (type: 'none' | 'map' | 'list' | 'both', duration: number = formData.promotion.duration) => {
    const isPromoted = type !== 'none';
    const totalCost = isPromoted ? calculatePromotionCost(type, duration) : 0;
    
    setFormData(prev => ({
      ...prev,
      promotion: {
        isPromoted,
        type,
        duration,
        totalCost,
      }
    }));
  };

  // Payment flow with IAP (commented for now)
  const handlePayment = async (promotionCost: number) => {
    // TODO: Implement IAP payment flow
    /*
    try {
      // Initialize IAP connection
      await RNIap.initConnection();
      
      // Get available products
      const products = await RNIap.getProducts(['event_promotion_map', 'event_promotion_list', 'event_promotion_both']);
      
      // Purchase product based on promotion type
      const productId = `event_promotion_${formData.promotion.type}`;
      const purchase = await RNIap.requestPurchase(productId);
      
      // Verify purchase with backend
      const verificationResult = await verifyPurchase(purchase);
      
      if (verificationResult.success) {
        return { success: true, transactionId: purchase.transactionId };
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    } finally {
      await RNIap.endConnection();
    }
    */
    
    // For now, return success to allow testing without payment
    return { success: true, transactionId: 'test_transaction_' + Date.now() };
  };

  const handleSubmit = async () => {
    try {
      // Check if promotion requires payment
      if (formData.promotion.isPromoted && formData.promotion.totalCost > 0) {
        // Show payment confirmation
        Alert.alert(
          'Payment Required',
          `This promotion costs $${formData.promotion.totalCost}. Proceed with payment?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pay & Create Event',
              onPress: async () => {
                try {
                  // Process payment (commented IAP flow)
                  const paymentResult = await handlePayment(formData.promotion.totalCost);
                  
                  if (paymentResult.success) {
                    await createEventWithPromotion(paymentResult.transactionId);
                  }
                } catch (error: any) {
                  Alert.alert('Payment Failed', error.message || 'Payment could not be processed. Please try again.');
                }
              }
            }
          ]
        );
      } else {
        // Create event without payment
        await createEventWithPromotion();
      }
    } catch (error: any) {
      Alert.alert('Error', error?.data?.message || 'Failed to create event. Please try again.');
    }
  };

  const createEventWithPromotion = async (transactionId?: string) => {
    try {
      const eventData = {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        source: 'app',
        promotionStatus: formData.promotion.isPromoted ? formData.promotion.type : 'normal',
        promotionExpiry: formData.promotion.isPromoted 
          ? new Date(Date.now() + formData.promotion.duration * 24 * 60 * 60 * 1000).toISOString()
          : null,
        // Include transaction ID if payment was processed
        ...(transactionId && { promotionTransactionId: transactionId })
      };

      const result = await createEvent(eventData).unwrap();
      
      Alert.alert('Success!', 'Your event has been created successfully.', [
        {
          text: 'View Event',
          onPress: () => navigation.navigate('EventDetails', { 
            eventId: result.data._id,
            fromEventCreation: true 
          }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.data?.message || 'Failed to create event. Please try again.');
    }
  };

  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };






  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <CommonMaterialCommunityIcons name="chevron-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={styles.headerRight} />
      </View>

      <StepIndicator currentStep={currentStep} totalSteps={5} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.stepWrapper}>
          {currentStep === 1 && (
            <EventBasicDetails
              formData={formData}
              errors={errors}
              onUpdateFormData={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <EventDateTime
              formData={formData}
              errors={errors}
              onUpdateFormData={updateFormData}
              onShowStartDatePicker={() => setShowStartDatePicker(true)}
              onShowEndDatePicker={() => setShowEndDatePicker(true)}
            />
          )}
          {currentStep === 3 && (
            <EventLocation
              formData={formData}
              errors={errors}
              onUpdateFormData={updateFormData}
            />
          )}
          {currentStep === 4 && (
            <EventTicketing
              formData={formData}
              errors={errors}
              onUpdateFormData={updateFormData}
            />
          )}
          {currentStep === 5 && (
            <EventPromotion
              formData={formData}
              onPromotionChange={handlePromotionChange}
              calculatePromotionCost={calculatePromotionCost}
            />
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.progressBarContainer}>
            <Text style={styles.progressText}>Step {currentStep} of 5</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${(currentStep / 5) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round((currentStep / 5) * 100)}%</Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.nextButton, currentStep === 5 && styles.createSubmitButton]} 
            onPress={handleNext} 
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={currentStep === 5 ? '#FFF' : colors.nextButtonText} />
            ) : (
              <View style={styles.nextButtonContent}>
                <Text style={[styles.nextButtonText, currentStep === 5 && styles.createSubmitButtonText]}>
                  {currentStep === 5 ? 'Create Event' : 'Next'}
                </Text>
                {currentStep < 5 && (
                  <CommonMaterialCommunityIcons 
                    name="arrow-right" 
                    size={20} 
                    color={colors.nextButtonText} 
                    style={{marginLeft: 8}} 
                  />
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: colors.background,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerRight: { width: 40 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backButton,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  stepWrapper: { flex: 1 },
  footer: { 
    padding: 24, 
    // backgroundColor: colors.background, 
    paddingBottom: 20,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: colors.stepIndicatorInactiveBox,
    marginHorizontal: 16,
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  button: { 
    borderRadius: 16, 
    paddingVertical: 18, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: { 
    backgroundColor: colors.nextButton, 
    borderColor: colors.borderLight,
    borderWidth: 1,
  },
  createSubmitButton: {
    backgroundColor: colors.createButton,
  },
  nextButtonText: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: colors.nextButtonText, 
  },
  createSubmitButtonText: {
    fontSize: 18, 
    fontWeight: '800', 
    color: colors.nextButtonText, 
  },
});

export default EventCreationFlow;
