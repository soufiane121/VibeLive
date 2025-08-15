import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { CheckmarkCircleIcon, TrendingUpIcon, ShareIcon, CalendarIcon } from '../../UIComponents/Icons';

const { width } = Dimensions.get('window');

interface RouteParams {
  adType: 'map_marker' | 'story_carousel';
  eventTitle: string;
  pricing: {
    totalCost: number;
    duration: number;
    estimatedViews: number;
    estimatedClicks: number;
  };
  adId: string;
  paymentMethod: string;
}

const AdSuccess: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const analytics = useAnalytics();
  const params = (route.params as RouteParams) || {};
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    analytics.trackEvent('ad_success_viewed', {
      ad_type: params.adType,
      ad_id: params.adId,
      total_cost: params.pricing?.totalCost,
      timestamp: new Date().toISOString(),
    });

    // Success animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleViewAds = () => {
    analytics.trackEvent('ad_success_view_ads', {
      ad_id: params.adId,
    });
    navigation.navigate('AdDashboard' as never);
  };

  const handleBackToMap = () => {
    analytics.trackEvent('ad_success_back_to_map', {
      ad_id: params.adId,
    });
    navigation.navigate('Map' as never);
  };

  const handleShareAd = () => {
    analytics.trackEvent('ad_success_share', {
      ad_id: params.adId,
    });
    // Implement share functionality
  };

  return (
    <Animated.View 
      style={[
        tw`flex-1 bg-black justify-center items-center px-4`,
        { opacity: fadeAnim }
      ]}
    >
      {/* Success Icon */}
      <Animated.View 
        style={[
          tw`mb-8`,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={tw`bg-green-500 rounded-full p-6`}>
          <CheckmarkCircleIcon size={64} color="#FFFFFF" />
        </View>
      </Animated.View>

      {/* Confetti Effect */}
      <Animated.View 
        style={[
          tw`absolute top-20 left-0 right-0`,
          {
            opacity: confettiAnim,
            transform: [{
              translateY: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 100],
              })
            }]
          }
        ]}
      >
        <Text style={tw`text-center text-4xl`}>🎉 🎊 ✨ 🎉 🎊</Text>
      </Animated.View>

      {/* Success Message */}
      <Text style={tw`text-white text-3xl font-bold text-center mb-4`}>
        Ad Published Successfully!
      </Text>
      
      <Text style={tw`text-gray-300 text-lg text-center mb-8`}>
        Your "{params.eventTitle}" ad is now live and reaching your audience
      </Text>

      {/* Ad Details */}
      <View style={tw`bg-gray-900 rounded-xl p-6 mb-8 w-full`}>
        <Text style={tw`text-white text-lg font-bold mb-4 text-center`}>
          Ad Details
        </Text>
        
        <View style={tw`space-y-3`}>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-gray-300 text-sm`}>Ad ID:</Text>
            <Text style={tw`text-white text-sm font-mono`}>
              {params.adId}
            </Text>
          </View>
          
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-gray-300 text-sm`}>Type:</Text>
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
            <Text style={tw`text-gray-300 text-sm`}>Investment:</Text>
            <Text style={tw`text-green-400 text-sm font-bold`}>
              ${params.pricing?.totalCost}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Expectations */}
      <View style={tw`bg-blue-900 rounded-xl p-4 mb-8 w-full`}>
        <View style={tw`flex-row items-center mb-3`}>
          <TrendingUpIcon size={20} color="#60A5FA" />
          <Text style={tw`text-blue-400 text-lg font-bold ml-2`}>
            Expected Results
          </Text>
        </View>
        
        <View style={tw`flex-row justify-around`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-white text-xl font-bold`}>
              {params.pricing?.estimatedViews?.toLocaleString()}
            </Text>
            <Text style={tw`text-blue-200 text-xs`}>Views</Text>
          </View>
          
          <View style={tw`items-center`}>
            <Text style={tw`text-white text-xl font-bold`}>
              {params.pricing?.estimatedClicks}
            </Text>
            <Text style={tw`text-blue-200 text-xs`}>Clicks</Text>
          </View>
          
          <View style={tw`items-center`}>
            <Text style={tw`text-white text-xl font-bold`}>
              {Math.round((params.pricing?.estimatedClicks || 0) * 0.1)}
            </Text>
            <Text style={tw`text-blue-200 text-xs`}>Conversions</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={tw`w-full space-y-4`}>
        {/* View Ad Dashboard */}
        <TouchableOpacity
          onPress={handleViewAds}
          style={tw`bg-purple-500 rounded-xl py-4 px-6`}
        >
          <Text style={tw`text-white text-center font-bold text-lg`}>
            View Ad Dashboard
          </Text>
        </TouchableOpacity>

        {/* Share Ad */}
        <TouchableOpacity
          onPress={handleShareAd}
          style={tw`bg-gray-700 rounded-xl py-4 px-6 flex-row items-center justify-center`}
        >
          <ShareIcon size={20} color="#FFFFFF" />
          <Text style={tw`text-white font-bold text-lg ml-2`}>
            Share Your Ad
          </Text>
        </TouchableOpacity>

        {/* Back to Map */}
        <TouchableOpacity
          onPress={handleBackToMap}
          style={tw`bg-transparent border border-gray-600 rounded-xl py-4 px-6`}
        >
          <Text style={tw`text-gray-300 text-center font-bold text-lg`}>
            Back to Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Next Steps */}
      <View style={tw`mt-8 bg-yellow-900 rounded-xl p-4 w-full`}>
        <Text style={tw`text-yellow-400 font-bold mb-2 text-center`}>
          📈 What's Next?
        </Text>
        <Text style={tw`text-yellow-200 text-sm text-center`}>
          Track your ad performance in real-time. You'll get notifications about engagement and can optimize future campaigns.
        </Text>
      </View>
    </Animated.View>
  );
};

export default AdSuccess;
