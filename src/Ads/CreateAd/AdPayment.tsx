import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { ChevronBackIcon, CreditCardIcon, ShieldCheckmarkIcon, CheckmarkIcon } from '../../UIComponents/Icons';

interface RouteParams {
  adType: 'map_marker' | 'story_carousel';
  media: any;
  mediaType: 'image' | 'video';
  eventTitle: string;
  eventDescription: string;
  targeting: {
    useCurrentLocation: boolean;
    radius: number;
    categories: string[];
    estimatedReach: number;
  };
  pricing: {
    pricePerDay: number;
    duration: number;
    totalCost: number;
    primeTimeBoost: boolean;
    scheduleForLater: boolean;
    estimatedViews: number;
    estimatedClicks: number;
  };
}

const AdPayment: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const analytics = useAnalytics();
  const params = (route.params as RouteParams) || {};
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    analytics.trackEvent('ad_payment_viewed', {
      ad_type: params.adType,
      total_cost: params.pricing?.totalCost,
      timestamp: new Date().toISOString(),
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    analytics.trackEvent('ad_payment_back', {
      ad_type: params.adType,
      selected_payment_method: selectedPaymentMethod,
    });
    navigation.goBack();
  };

  const handlePaymentMethodSelect = (method: 'card' | 'apple_pay' | 'google_pay') => {
    setSelectedPaymentMethod(method);
    analytics.trackEvent('payment_method_selected', {
      payment_method: method,
      ad_type: params.adType,
      total_cost: params.pricing?.totalCost,
    });
  };

  const processPayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue.');
      return;
    }

    setIsProcessing(true);
    
    analytics.trackEvent('ad_payment_initiated', {
      ad_type: params.adType,
      payment_method: selectedPaymentMethod,
      total_cost: params.pricing?.totalCost,
      estimated_reach: params.targeting?.estimatedReach,
    });

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock successful payment
      analytics.trackEvent('ad_payment_completed', {
        ad_type: params.adType,
        payment_method: selectedPaymentMethod,
        total_cost: params.pricing?.totalCost,
        ad_id: `ad_${Date.now()}`,
      });

      navigation.navigate('AdSuccess' as never, {
        ...params,
        adId: `ad_${Date.now()}`,
        paymentMethod: selectedPaymentMethod,
      } as never);
      
    } catch (error) {
      analytics.trackEvent('ad_payment_failed', {
        ad_type: params.adType,
        payment_method: selectedPaymentMethod,
        error: error.toString(),
      });
      
      Alert.alert('Payment Failed', 'There was an issue processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Animated.View 
      style={[
        tw`flex-1 bg-black`,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-12 pb-4`}>
        <TouchableOpacity onPress={handleBack} style={tw`p-2`} disabled={isProcessing}>
          <ChevronBackIcon size={24} color={isProcessing ? "#6B7280" : "#FFFFFF"} />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-bold`}>Payment</Text>
        <View style={tw`w-8`} />
      </View>

      <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={tw`text-white text-2xl font-bold mb-2`}>
          Complete Your Purchase
        </Text>
        <Text style={tw`text-gray-400 text-base mb-6`}>
          Secure payment to launch your ad
        </Text>

        {/* Order Summary */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-white text-lg font-bold mb-4`}>Order Summary</Text>
          
          <View style={tw`space-y-3`}>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-gray-300 text-sm`}>Ad Type:</Text>
              <Text style={tw`text-white text-sm font-semibold`}>
                {params.adType === 'map_marker' ? 'Map Marker' : 'Story Carousel'}
              </Text>
            </View>
            
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-gray-300 text-sm`}>Duration:</Text>
              <Text style={tw`text-white text-sm font-semibold`}>
                {params.pricing?.duration} day{(params.pricing?.duration || 0) > 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-gray-300 text-sm`}>Base Cost:</Text>
              <Text style={tw`text-white text-sm font-semibold`}>
                ${(params.pricing?.pricePerDay || 0) * (params.pricing?.duration || 1)}
              </Text>
            </View>
            
            {params.pricing?.primeTimeBoost && (
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-yellow-400 text-sm`}>Prime Time Boost:</Text>
                <Text style={tw`text-yellow-400 text-sm font-semibold`}>
                  +${Math.round((params.pricing?.totalCost || 0) * 0.33)}
                </Text>
              </View>
            )}
            
            <View style={tw`border-t border-gray-700 pt-3`}>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-white text-lg font-bold`}>Total:</Text>
                <Text style={tw`text-green-400 text-lg font-bold`}>
                  ${params.pricing?.totalCost}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-white text-lg font-bold mb-4`}>Payment Method</Text>
          
          {/* Credit Card */}
          <TouchableOpacity
            onPress={() => handlePaymentMethodSelect('card')}
            disabled={isProcessing}
            style={[
              tw`bg-gray-900 rounded-xl p-4 mb-3 border-2`,
              selectedPaymentMethod === 'card'
                ? tw`border-purple-500`
                : tw`border-gray-700`,
            ]}
          >
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center`}>
                <CreditCardIcon size={24} color="#A855F7" />
                <Text style={tw`text-white text-lg font-semibold ml-3`}>
                  Credit/Debit Card
                </Text>
              </View>
              {selectedPaymentMethod === 'card' && (
                <CheckmarkIcon size={20} color="#A855F7" />
              )}
            </View>
            <Text style={tw`text-gray-400 text-sm mt-2 ml-9`}>
              Visa, Mastercard, American Express
            </Text>
          </TouchableOpacity>

          {/* Apple Pay */}
          <TouchableOpacity
            onPress={() => handlePaymentMethodSelect('apple_pay')}
            disabled={isProcessing}
            style={[
              tw`bg-gray-900 rounded-xl p-4 mb-3 border-2`,
              selectedPaymentMethod === 'apple_pay'
                ? tw`border-purple-500`
                : tw`border-gray-700`,
            ]}
          >
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-6 h-6 bg-white rounded mr-3`} />
                <Text style={tw`text-white text-lg font-semibold`}>
                  Apple Pay
                </Text>
              </View>
              {selectedPaymentMethod === 'apple_pay' && (
                <CheckmarkIcon size={20} color="#A855F7" />
              )}
            </View>
            <Text style={tw`text-gray-400 text-sm mt-2 ml-9`}>
              Touch ID or Face ID
            </Text>
          </TouchableOpacity>

          {/* Google Pay */}
          <TouchableOpacity
            onPress={() => handlePaymentMethodSelect('google_pay')}
            disabled={isProcessing}
            style={[
              tw`bg-gray-900 rounded-xl p-4 mb-6 border-2`,
              selectedPaymentMethod === 'google_pay'
                ? tw`border-purple-500`
                : tw`border-gray-700`,
            ]}
          >
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-6 h-6 bg-blue-500 rounded mr-3`} />
                <Text style={tw`text-white text-lg font-semibold`}>
                  Google Pay
                </Text>
              </View>
              {selectedPaymentMethod === 'google_pay' && (
                <CheckmarkIcon size={20} color="#A855F7" />
              )}
            </View>
            <Text style={tw`text-gray-400 text-sm mt-2 ml-9`}>
              Quick and secure
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={tw`bg-green-900 rounded-xl p-4 mb-6`}>
          <View style={tw`flex-row items-center mb-2`}>
            <ShieldCheckmarkIcon size={20} color="#10B981" />
            <Text style={tw`text-green-400 text-lg font-bold ml-2`}>
              Secure Payment
            </Text>
          </View>
          <Text style={tw`text-green-200 text-sm`}>
            Your payment information is encrypted and secure. We never store your card details.
          </Text>
        </View>

        {/* Terms */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-8`}>
          <Text style={tw`text-gray-300 text-xs leading-5`}>
            By completing this purchase, you agree to our Terms of Service and Privacy Policy. 
            Your ad will be reviewed and go live within 15 minutes. Refunds are available within 
            24 hours if your ad hasn't started running.
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={tw`px-4 pb-8`}>
        <TouchableOpacity
          onPress={processPayment}
          disabled={!selectedPaymentMethod || isProcessing}
          style={[
            tw`rounded-xl py-4 px-6 flex-row items-center justify-center`,
            selectedPaymentMethod && !isProcessing
              ? tw`bg-gradient-to-r from-purple-500 to-pink-500`
              : tw`bg-gray-700`,
          ]}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={tw`text-white font-bold text-lg ml-2`}>
                Processing...
              </Text>
            </>
          ) : (
            <Text
              style={[
                tw`text-center font-bold text-lg`,
                selectedPaymentMethod ? tw`text-white` : tw`text-gray-400`,
              ]}
            >
              Pay ${params.pricing?.totalCost} & Launch Ad
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default AdPayment;
