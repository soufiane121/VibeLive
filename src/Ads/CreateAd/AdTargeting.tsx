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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { ChevronBackIcon, LocationIcon, TargetIcon, UsersIcon } from '../../UIComponents/Icons';
import { useEstimateAdReachMutation, AdData } from '../../Services/AdsApi';
import { useGetCurrentLocation, GeolocationCoordinates } from '../../CustomHooks/useGetLocation';

interface RouteParams {
  adType: 'map_marker' | 'story_carousel';
  media: any;
  mediaType: 'image' | 'video';
  eventTitle: string;
  eventDescription: string;
  targeting?: {
    useCurrentLocation: boolean;
    radius: number;
    categories: string[];
    estimatedReach: number;
  };
}

type NavigationType = NativeStackNavigationProp<any>;

const AdTargeting: React.FC = () => {
  const navigation = useNavigation<NavigationType>();
  const route = useRoute();
  const analytics = useAnalytics();
  const params = (route.params as RouteParams) || {};
  
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [targetingRadius, setTargetingRadius] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [estimatedReach, setEstimatedReach] = useState(2400);
  const [estimateAdReach] = useEstimateAdReachMutation();
  
  // Get current location
  const locationData = useGetCurrentLocation();

  const interestCategories = [
    { id: 'bars', name: 'Bars', icon: '🍻' },
    { id: 'clubs', name: 'Clubs', icon: '🕺' },
    { id: 'restaurants', name: 'Restaurants', icon: '🍽️' },
    { id: 'gaming', name: 'Gaming', icon: '🎮' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'art', name: 'Art', icon: '🎨' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'food', name: 'Food', icon: '🍕' },
  ];

  useEffect(() => {
    analytics.trackEvent('ad_targeting_viewed', {
      ad_type: params.adType,
      timestamp: new Date().toISOString(),
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Calculate estimated reach using the API
    const estimateReach = async () => {
      try {
        // Prepare ad data for reach estimation
        const adData: Partial<AdData> = {
          adType: params.adType,
          targeting: {
            radius: targetingRadius,
            interestTags: selectedCategories,
          },
          dailyBudget: 25, // This will be set in the pricing step
          duration: 1, // This will be set in the pricing step
          primeTimeBoost: false, // This will be set in the pricing step
          status: 'draft',
        };
        
        // Ensure targeting object is properly initialized
        if (!adData.targeting) {
          adData.targeting = {
            radius: targetingRadius,
            interestTags: selectedCategories,
          };
        }
        
        // Add location data if available and using current location
        if (useCurrentLocation && locationData) {
          adData.targeting.location = {
            type: 'Point',
            coordinates: [locationData.longitude, locationData.latitude],
          };
        }
        
        const result = await estimateAdReach(adData).unwrap();
        
        if (result?.totalReach) {
          setEstimatedReach(result.totalReach);
        }
      } catch (error) {
        console.error('Failed to estimate ad reach:', error);
        // Fallback to simple calculation if API fails
        const baseReach = targetingRadius * 480;
        const categoryMultiplier = selectedCategories.length > 0 ? selectedCategories.length * 0.3 + 1 : 1;
        const newReach = Math.round(baseReach * categoryMultiplier);
        setEstimatedReach(newReach);
      }
    };
    
    estimateReach();
  }, [targetingRadius, selectedCategories, useCurrentLocation]);

  const handleBack = () => {
    analytics.trackEvent('ad_targeting_back', {
      ad_type: params.adType,
      use_current_location: useCurrentLocation,
      targeting_radius: targetingRadius,
      selected_categories: selectedCategories,
    });
    navigation.goBack();
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newCategories);
    
    analytics.trackEvent('targeting_category_toggled', {
      category: categoryId,
      action: selectedCategories.includes(categoryId) ? 'removed' : 'added',
      total_categories: newCategories.length,
    });
  };

  const handleContinue = () => {
    analytics.trackEvent('ad_targeting_completed', {
      ad_type: params.adType,
      use_current_location: useCurrentLocation,
      targeting_radius: targetingRadius,
      selected_categories: selectedCategories,
      estimated_reach: estimatedReach,
    });

    navigation.navigate('AdPricing', {
      ...params,
      targeting: {
        useCurrentLocation,
        radius: targetingRadius,
        categories: selectedCategories,
        estimatedReach,
      },
    });
  };

  return (
    <Animated.View style={[tw`flex-1 bg-black`, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-12 pb-4`}>
        <TouchableOpacity onPress={handleBack} style={tw`p-2`}>
          <ChevronBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-bold`}>Targeting</Text>
        <Text style={tw`text-gray-400 text-sm`}>Step 3 of 5</Text>
      </View>

      {/* Progress Bar */}
      <View style={tw`px-4 mb-6`}>
        <View style={tw`flex-row justify-between mb-2`}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={[
                tw`w-3 h-3 rounded-full`,
                step <= 3 ? tw`bg-purple-500` : tw`bg-gray-600`,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={tw`text-white text-2xl font-bold mb-2`}>
          Target Your Audience
        </Text>
        <Text style={tw`text-gray-400 text-base mb-6`}>
          Choose who will see your ad
        </Text>

        {/* Location Targeting */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View style={tw`flex-row items-center`}>
              <LocationIcon size={20} color="#A855F7" />
              <Text style={tw`text-white text-lg font-bold ml-2`}>
                Use My Current Location
              </Text>
            </View>
            <Switch
              value={useCurrentLocation}
              onValueChange={setUseCurrentLocation}
              trackColor={{ false: '#374151', true: '#A855F7' }}
              thumbColor={useCurrentLocation ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
          <Text style={tw`text-gray-400 text-sm`}>
            Automatically target people near you
          </Text>
        </View>

        {/* Targeting Radius */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-white text-lg font-bold mb-4`}>
            Targeting Radius: {targetingRadius} miles
          </Text>
          <Slider
            style={tw`w-full h-10`}
            minimumValue={1}
            maximumValue={50}
            value={targetingRadius}
            onValueChange={setTargetingRadius}
            minimumTrackTintColor="#A855F7"
            maximumTrackTintColor="#374151"
            thumbTintColor="#A855F7"
          />
          <View style={tw`flex-row justify-between mt-2`}>
            <Text style={tw`text-gray-500 text-xs`}>1 mile</Text>
            <Text style={tw`text-gray-500 text-xs`}>50 miles</Text>
          </View>
        </View>

        {/* Interest Categories */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-white text-lg font-bold mb-4`}>
            Interest Categories
          </Text>
          <Text style={tw`text-gray-400 text-sm mb-4`}>
            Select what type of crowd you want to attract
          </Text>
          
          <View style={tw`flex-row flex-wrap`}>
            {interestCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => toggleCategory(category.id)}
                style={[
                  tw`rounded-xl p-3 m-1 border-2`,
                  selectedCategories.includes(category.id)
                    ? tw`bg-purple-900 border-purple-500`
                    : tw`bg-gray-900 border-gray-700`,
                ]}
              >
                <View style={tw`items-center`}>
                  <Text style={tw`text-2xl mb-1`}>{category.icon}</Text>
                  <Text
                    style={[
                      tw`text-sm font-semibold`,
                      selectedCategories.includes(category.id)
                        ? tw`text-purple-300`
                        : tw`text-gray-300`,
                    ]}
                  >
                    {category.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estimated Reach */}
        <View style={tw`bg-blue-900 rounded-xl p-4 mb-6`}>
          <View style={tw`flex-row items-center mb-2`}>
            <UsersIcon size={20} color="#60A5FA" />
            <Text style={tw`text-blue-400 text-lg font-bold ml-2`}>
              Estimated Reach
            </Text>
          </View>
          <Text style={tw`text-white text-2xl font-bold mb-1`}>
            {estimatedReach.toLocaleString()} - {Math.round(estimatedReach * 1.6).toLocaleString()} people
          </Text>
          <Text style={tw`text-blue-200 text-sm`}>
            Based on your targeting settings
          </Text>
        </View>

        {/* FOMO Section */}
        <View style={tw`bg-gradient-to-r from-yellow-900 to-orange-900 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-yellow-400 font-bold mb-2`}>
            🎯 Targeting Tip
          </Text>
          <Text style={tw`text-yellow-200 text-sm`}>
            Ads with 2-3 interest categories get 40% more engagement than untargeted ads!
          </Text>
        </View>

        {/* Competitor Insights */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-8`}>
          <Text style={tw`text-white font-bold mb-3`}>
            🔥 Live Insights
          </Text>
          <View style={tw`space-y-2`}>
            <Text style={tw`text-gray-300 text-sm`}>
              • 23 events targeting bars/clubs in your area this week
            </Text>
            <Text style={tw`text-gray-300 text-sm`}>
              • Peak engagement time: 6-10 PM weekends
            </Text>
            <Text style={tw`text-gray-300 text-sm`}>
              • Music + Bars combo has highest conversion rate
            </Text>
          </View>
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

export default AdTargeting;
