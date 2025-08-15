import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { ChevronBackIcon, DollarSignIcon, CalendarIcon, TrendingUpIcon, ClockIcon } from '../../UIComponents/Icons';

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
}

const AdPricing: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const analytics = useAnalytics();
  const params = (route.params as RouteParams) || {};
  
  const [pricePerDay, setPricePerDay] = useState(25);
  const [duration, setDuration] = useState(1);
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [primeTimeBoost, setPrimeTimeBoost] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  const totalCost = pricePerDay * duration;
  const primeTimeCost = primeTimeBoost ? Math.round(totalCost * 0.5) : 0;
  const finalCost = totalCost + primeTimeCost;
  
  const estimatedViews = Math.round((params.targeting?.estimatedReach || 2400) * 0.5 * duration);
  const estimatedClicks = Math.round(estimatedViews * 0.05);

  useEffect(() => {
    analytics.trackEvent('ad_pricing_viewed', {
      ad_type: params.adType,
      estimated_reach: params.targeting?.estimatedReach,
      timestamp: new Date().toISOString(),
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse animation for FOMO elements
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handleBack = () => {
    analytics.trackEvent('ad_pricing_back', {
      ad_type: params.adType,
      price_per_day: pricePerDay,
      duration: duration,
      total_cost: finalCost,
    });
    navigation.goBack();
  };

  const handleContinue = () => {
    analytics.trackEvent('ad_pricing_completed', {
      ad_type: params.adType,
      price_per_day: pricePerDay,
      duration: duration,
      total_cost: finalCost,
      prime_time_boost: primeTimeBoost,
      schedule_for_later: scheduleForLater,
      estimated_views: estimatedViews,
      estimated_clicks: estimatedClicks,
    });

    navigation.navigate('AdPreview' as never, {
      ...params,
      pricing: {
        pricePerDay,
        duration,
        totalCost: finalCost,
        primeTimeBoost,
        scheduleForLater,
        estimatedViews,
        estimatedClicks,
      },
    } as never);
  };

  return (
    <Animated.View style={[tw`flex-1 bg-black`, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-12 pb-4`}>
        <TouchableOpacity onPress={handleBack} style={tw`p-2`}>
          <ChevronBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-bold`}>Pricing</Text>
        <Text style={tw`text-gray-400 text-sm`}>Step 4 of 5</Text>
      </View>

      {/* Progress Bar */}
      <View style={tw`px-4 mb-6`}>
        <View style={tw`flex-row justify-between mb-2`}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={[
                tw`w-3 h-3 rounded-full`,
                step <= 4 ? tw`bg-purple-500` : tw`bg-gray-600`,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={tw`text-white text-2xl font-bold mb-2`}>
          Set Your Budget
        </Text>
        <Text style={tw`text-gray-400 text-base mb-6`}>
          Choose how much you want to spend
        </Text>

        {/* Price per Day */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-white text-lg font-bold mb-4`}>
            Price per Day: ${pricePerDay}
          </Text>
          <Slider
            style={tw`w-full h-10`}
            minimumValue={10}
            maximumValue={200}
            value={pricePerDay}
            onValueChange={setPricePerDay}
            step={5}
            minimumTrackTintColor="#A855F7"
            maximumTrackTintColor="#374151"
            thumbTintColor='#A855F7'
          />
          <View style={tw`flex-row justify-between mt-2`}>
            <Text style={tw`text-gray-500 text-xs`}>$10</Text>
            <Text style={tw`text-gray-500 text-xs`}>$200+</Text>
          </View>
        </View>

        {/* Duration */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-white text-lg font-bold mb-4`}>
            Duration: {duration} day{duration > 1 ? 's' : ''}
          </Text>
          <Slider
            style={tw`w-full h-10`}
            minimumValue={1}
            maximumValue={30}
            value={duration}
            onValueChange={setDuration}
            step={1}
            minimumTrackTintColor="#A855F7"
            maximumTrackTintColor="#374151"
            thumbTintColor='#A855F7'
          />
          <View style={tw`flex-row justify-between mt-2`}>
            <Text style={tw`text-gray-500 text-xs`}>1 day</Text>
            <Text style={tw`text-gray-500 text-xs`}>30 days</Text>
          </View>
        </View>

        {/* Schedule for Later */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-row items-center`}>
              <CalendarIcon size={20} color="#A855F7" />
              <Text style={tw`text-white text-lg font-bold ml-2`}>
                Schedule for Later
              </Text>
            </View>
            <Switch
              value={scheduleForLater}
              onValueChange={setScheduleForLater}
              trackColor={{ false: '#374151', true: '#A855F7' }}
              thumbColor={scheduleForLater ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
          <Text style={tw`text-gray-400 text-sm`}>
            Start your ad on a specific date
          </Text>
        </View>

        {/* Prime Time Boost */}
        <Animated.View 
          style={[
            tw`bg-gradient-to-r from-yellow-900 to-orange-900 rounded-xl p-4 mb-6 border-2 border-yellow-500`,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center`}>
              <ClockIcon size={20} color="#FFD700" />
              <Text style={tw`text-yellow-400 text-lg font-bold ml-2`}>
                Prime Time Boost Available!
              </Text>
            </View>
            <Switch
              value={primeTimeBoost}
              onValueChange={setPrimeTimeBoost}
              trackColor={{ false: '#374151', true: '#FFD700' }}
              thumbColor={primeTimeBoost ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
          <Text style={tw`text-yellow-200 text-sm mb-2`}>
            Pay 50% more to show during peak hours (6PM - 2AM) for 3x the visibility
          </Text>
          {primeTimeBoost && (
            <Text style={tw`text-yellow-300 text-xs font-bold`}>
              +${primeTimeCost} for prime time boost
            </Text>
          )}
        </Animated.View>

        {/* Total Cost */}
        <View style={tw`bg-green-900 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-green-400 text-lg font-bold mb-2`}>
            Total Cost
          </Text>
          <View style={tw`flex-row items-center justify-between`}>
            <Text style={tw`text-white text-3xl font-bold`}>
              ${finalCost}
            </Text>
            <View style={tw`items-end`}>
              <Text style={tw`text-green-300 text-sm`}>
                ~{estimatedViews.toLocaleString()} views
              </Text>
              <Text style={tw`text-green-300 text-sm`}>
                ~{estimatedClicks} clicks
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Prediction */}
        <View style={tw`bg-blue-900 rounded-xl p-4 mb-6`}>
          <View style={tw`flex-row items-center mb-3`}>
            <TrendingUpIcon size={20} color="#60A5FA" />
            <Text style={tw`text-blue-400 text-lg font-bold ml-2`}>
              Performance Prediction
            </Text>
          </View>
          <View style={tw`space-y-2`}>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-blue-200 text-sm`}>Expected Views:</Text>
              <Text style={tw`text-white text-sm font-bold`}>
                {estimatedViews.toLocaleString()}
              </Text>
            </View>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-blue-200 text-sm`}>Expected Clicks:</Text>
              <Text style={tw`text-white text-sm font-bold`}>
                {estimatedClicks}
              </Text>
            </View>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-blue-200 text-sm`}>Cost per Click:</Text>
              <Text style={tw`text-white text-sm font-bold`}>
                ${(finalCost / Math.max(estimatedClicks, 1)).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* FOMO Urgency */}
        <View style={tw`bg-red-900 rounded-xl p-4 mb-8`}>
          <Text style={tw`text-red-400 font-bold mb-2`}>
            ⚡ Limited Time Offer
          </Text>
          <Text style={tw`text-red-200 text-sm mb-2`}>
            First ad 50% off - this weekend only!
          </Text>
          <Text style={tw`text-red-300 text-xs`}>
            47 creators have used this offer in the last 24 hours
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={tw`px-4 pb-8`}>
        <TouchableOpacity
          onPress={handleContinue}
          style={tw`bg-purple-500 rounded-xl py-4 px-6`}
        >
          <Text style={tw`text-white text-center font-bold text-lg`}>
            Continue →
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default AdPricing;
