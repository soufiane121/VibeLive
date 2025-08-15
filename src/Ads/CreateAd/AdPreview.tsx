import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { ChevronBackIcon, EditIcon, PlayCircleIcon, MapIcon, CalendarIcon, UsersIcon, DollarSignIcon } from '../../UIComponents/Icons';

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

const AdPreview: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const analytics = useAnalytics();
  const params = (route.params as RouteParams) || {};
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    analytics.trackEvent('ad_preview_viewed', {
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
    analytics.trackEvent('ad_preview_back', {
      ad_type: params.adType,
    });
    navigation.goBack();
  };

  const handleEdit = (section: string) => {
    analytics.trackEvent('ad_preview_edit', {
      section: section,
      ad_type: params.adType,
    });
    
    switch (section) {
      case 'media':
        navigation.navigate('AdMediaUpload' as never, params as never);
        break;
      case 'targeting':
        navigation.navigate('AdTargeting' as never, params as never);
        break;
      case 'pricing':
        navigation.navigate('AdPricing' as never, params as never);
        break;
    }
  };

  const handlePublish = () => {
    analytics.trackEvent('ad_publish_initiated', {
      ad_type: params.adType,
      total_cost: params.pricing?.totalCost,
      estimated_reach: params.targeting?.estimatedReach,
    });

    navigation.navigate('AdPayment' as never, params as never);
  };

  const formatCategories = (categories: string[]) => {
    if (!categories || categories.length === 0) return 'All audiences';
    return categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)).join(', ');
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
        <TouchableOpacity onPress={handleBack} style={tw`p-2`}>
          <ChevronBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-bold`}>Preview</Text>
        <Text style={tw`text-gray-400 text-sm`}>Step 5 of 5</Text>
      </View>

      {/* Progress Bar */}
      <View style={tw`px-4 mb-6`}>
        <View style={tw`flex-row justify-between mb-2`}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={tw`w-3 h-3 rounded-full bg-purple-500`}
            />
          ))}
        </View>
      </View>

      <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={tw`text-white text-2xl font-bold mb-2`}>
          Preview Your Ad
        </Text>
        <Text style={tw`text-gray-400 text-base mb-6`}>
          Review everything before publishing
        </Text>

        {/* Ad Preview */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-white text-lg font-bold`}>
              {params.adType === 'map_marker' ? 'Map Marker Preview' : 'Story Preview'}
            </Text>
            <TouchableOpacity
              onPress={() => handleEdit('media')}
              style={tw`bg-purple-500 rounded-full p-2`}
            >
              <EditIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Media Preview */}
          <View style={tw`mb-4`}>
            {params.mediaType === 'image' ? (
              <Image
                source={{ uri: params.media?.uri }}
                style={tw`w-full h-48 rounded-lg`}
                resizeMode="cover"
              />
            ) : (
              <View style={tw`w-full h-48 bg-gray-800 rounded-lg items-center justify-center`}>
                <PlayCircleIcon size={48} color="#FFFFFF" />
                <Text style={tw`text-white mt-2`}>Video Ad</Text>
              </View>
            )}
            
            {/* Ad Type Badge */}
            <View style={tw`absolute top-2 left-2`}>
              <View style={tw`bg-purple-500 rounded-full px-3 py-1 flex-row items-center`}>
                {params.adType === 'map_marker' ? (
                  <MapIcon size={12} color="#FFFFFF" />
                ) : (
                  <PlayCircleIcon size={12} color="#FFFFFF" />
                )}
                <Text style={tw`text-white text-xs ml-1 font-bold`}>
                  {params.adType === 'map_marker' ? 'MAP' : 'STORY'}
                </Text>
              </View>
            </View>
          </View>

          {/* Event Details */}
          <View>
            <Text style={tw`text-white text-lg font-bold mb-1`}>
              {params.eventTitle}
            </Text>
            {params.eventDescription && (
              <Text style={tw`text-gray-300 text-sm`}>
                {params.eventDescription}
              </Text>
            )}
          </View>
        </View>

        {/* Targeting Summary */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-white text-lg font-bold`}>Targeting</Text>
            <TouchableOpacity
              onPress={() => handleEdit('targeting')}
              style={tw`bg-purple-500 rounded-full p-2`}
            >
              <EditIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={tw`space-y-3`}>
            <View style={tw`flex-row items-center`}>
              <UsersIcon size={16} color="#A855F7" />
              <Text style={tw`text-gray-300 text-sm ml-2`}>
                {params.targeting?.estimatedReach?.toLocaleString()} - {Math.round((params.targeting?.estimatedReach || 0) * 1.6).toLocaleString()} people
              </Text>
            </View>
            
            <View style={tw`flex-row items-center`}>
              <MapIcon size={16} color="#A855F7" />
              <Text style={tw`text-gray-300 text-sm ml-2`}>
                {params.targeting?.radius} mile radius
              </Text>
            </View>
            
            <View style={tw`flex-row items-start`}>
              <Text style={tw`text-purple-400 text-sm mr-2`}>🎯</Text>
              <Text style={tw`text-gray-300 text-sm flex-1`}>
                {formatCategories(params.targeting?.categories)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Summary */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-white text-lg font-bold`}>Budget & Schedule</Text>
            <TouchableOpacity
              onPress={() => handleEdit('pricing')}
              style={tw`bg-purple-500 rounded-full p-2`}
            >
              <EditIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={tw`space-y-3`}>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-gray-300 text-sm`}>Price per day:</Text>
              <Text style={tw`text-white text-sm font-bold`}>
                ${params.pricing?.pricePerDay}
              </Text>
            </View>
            
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-gray-300 text-sm`}>Duration:</Text>
              <Text style={tw`text-white text-sm font-bold`}>
                {params.pricing?.duration} day{(params.pricing?.duration || 0) > 1 ? 's' : ''}
              </Text>
            </View>
            
            {params.pricing?.primeTimeBoost && (
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-yellow-400 text-sm`}>Prime Time Boost:</Text>
                <Text style={tw`text-yellow-400 text-sm font-bold`}>
                  +${Math.round((params.pricing?.totalCost || 0) * 0.33)}
                </Text>
              </View>
            )}
            
            <View style={tw`border-t border-gray-700 pt-3`}>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-white text-lg font-bold`}>Total Cost:</Text>
                <Text style={tw`text-green-400 text-lg font-bold`}>
                  ${params.pricing?.totalCost}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Expectations */}
        <View style={tw`bg-blue-900 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-blue-400 text-lg font-bold mb-3`}>
            Expected Performance
          </Text>
          <View style={tw`space-y-2`}>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-blue-200 text-sm`}>Estimated Views:</Text>
              <Text style={tw`text-white text-sm font-bold`}>
                {params.pricing?.estimatedViews?.toLocaleString()}
              </Text>
            </View>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-blue-200 text-sm`}>Estimated Clicks:</Text>
              <Text style={tw`text-white text-sm font-bold`}>
                {params.pricing?.estimatedClicks}
              </Text>
            </View>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-blue-200 text-sm`}>Cost per Click:</Text>
              <Text style={tw`text-white text-sm font-bold`}>
                ${((params.pricing?.totalCost || 0) / Math.max(params.pricing?.estimatedClicks || 1, 1)).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Final FOMO Push */}
        <View style={tw`bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-4 mb-8`}>
          <Text style={tw`text-yellow-400 text-center font-bold mb-2`}>
            🚀 Ready to Launch!
          </Text>
          <Text style={tw`text-white text-center text-sm mb-2`}>
            Your ad will go live immediately after payment
          </Text>
          <Text style={tw`text-gray-300 text-center text-xs`}>
            Join 1,200+ creators who promoted events this week
          </Text>
        </View>
      </ScrollView>

      {/* Publish Button */}
      <View style={tw`px-4 pb-8`}>
        <TouchableOpacity
          onPress={handlePublish}
          style={tw`bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl py-4 px-6`}
        >
          <Text style={tw`text-white text-center font-bold text-lg`}>
            Publish Ad - ${params.pricing?.totalCost}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default AdPreview;
