import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { ChevronBackIcon, MapIcon, PlayCircleIcon, SparklesIcon } from '../../UIComponents/Icons';

const { width } = Dimensions.get('window');

const AdTypeSelection: React.FC = () => {
  const navigation = useNavigation();
  const analytics = useAnalytics();
  const [selectedType, setSelectedType] = useState<'map_marker' | 'story_carousel' | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    analytics.trackEvent('ad_type_selection_viewed', {
      timestamp: new Date().toISOString(),
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    analytics.trackEvent('ad_type_selection_back', {
      selected_type: selectedType,
    });
    navigation.goBack();
  };

  const handleTypeSelection = (type: 'map_marker' | 'story_carousel') => {
    setSelectedType(type);
    analytics.trackEvent('ad_type_selected', {
      ad_type: type,
      timestamp: new Date().toISOString(),
    });
  };

  const handleContinue = () => {
    if (!selectedType) return;
    
    analytics.trackEvent('ad_type_confirmed', {
      ad_type: selectedType,
    });
    
    navigation.navigate('AdMediaUpload' as never, { adType: selectedType } as never);
  };

  return (
    <Animated.View 
      style={[
        tw`flex-1 bg-black`,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-12 pb-4`}>
        <TouchableOpacity onPress={handleBack} style={tw`p-2`}>
          <ChevronBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-bold`}>Ad Type</Text>
        <Text style={tw`text-gray-400 text-sm`}>Step 1 of 5</Text>
      </View>

      {/* Progress Bar */}
      <View style={tw`px-4 mb-8`}>
        <View style={tw`flex-row justify-between mb-2`}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={[
                tw`w-3 h-3 rounded-full`,
                step === 1 ? tw`bg-purple-500` : tw`bg-gray-600`,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={tw`flex-1 px-4`}>
        {/* Title */}
        <Text style={tw`text-white text-2xl font-bold mb-2`}>
          Choose Your Ad Type
        </Text>
        <Text style={tw`text-gray-400 text-base mb-8`}>
          How do you want people to discover your event?
        </Text>

        {/* Map Marker Option */}
        <TouchableOpacity
          onPress={() => handleTypeSelection('map_marker')}
          style={[
            tw`rounded-xl p-6 mb-4 border-2`,
            selectedType === 'map_marker'
              ? tw`bg-purple-900 border-purple-500`
              : tw`bg-gray-900 border-gray-700`,
          ]}
        >
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`bg-purple-500 rounded-full p-3 mr-4`}>
              <MapIcon size={24} color="#FFFFFF" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white text-lg font-bold`}>Map Marker</Text>
              <Text style={tw`text-purple-400 text-sm font-semibold`}>
                High visibility
              </Text>
            </View>
            {selectedType === 'map_marker' && (
              <View style={tw`bg-purple-500 rounded-full p-1`}>
                <Text style={tw`text-white text-xs px-2`}>✓</Text>
              </View>
            )}
          </View>
          <Text style={tw`text-gray-300 text-sm mb-3`}>
            Show as a special marker on the map
          </Text>
          <View style={tw`flex-row items-center`}>
            <SparklesIcon size={16} color="#FFD700" />
            <Text style={tw`text-yellow-400 text-xs ml-1 font-semibold`}>
              Premium placement available
            </Text>
          </View>
        </TouchableOpacity>

        {/* Story Carousel Option */}
        <TouchableOpacity
          onPress={() => handleTypeSelection('story_carousel')}
          style={[
            tw`rounded-xl p-6 mb-6 border-2`,
            selectedType === 'story_carousel'
              ? tw`bg-pink-900 border-pink-500`
              : tw`bg-gray-900 border-gray-700`,
          ]}
        >
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`bg-pink-500 rounded-full p-3 mr-4`}>
              <PlayCircleIcon size={24} color="#FFFFFF" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white text-lg font-bold`}>Story Carousel</Text>
              <Text style={tw`text-pink-400 text-sm font-semibold`}>
                Trending reach
              </Text>
            </View>
            {selectedType === 'story_carousel' && (
              <View style={tw`bg-pink-500 rounded-full p-1`}>
                <Text style={tw`text-white text-xs px-2`}>✓</Text>
              </View>
            )}
          </View>
          <Text style={tw`text-gray-300 text-sm mb-3`}>
            Appear in the top stories carousel
          </Text>
          <View style={tw`flex-row items-center`}>
            <SparklesIcon size={16} color="#FFD700" />
            <Text style={tw`text-yellow-400 text-xs ml-1 font-semibold`}>
              Featured in trending section
            </Text>
          </View>
        </TouchableOpacity>

        {/* FOMO Banner */}
        <View style={tw`bg-gradient-to-r from-yellow-900 to-orange-900 rounded-xl p-4 mb-8`}>
          <Text style={tw`text-yellow-400 text-center font-bold text-sm`}>
            🔥 LIMITED TIME: 50% off first ad!
          </Text>
          <Text style={tw`text-yellow-200 text-center text-xs mt-1`}>
            23 creators booked ads in the last hour
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <View style={tw`px-4 pb-8`}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedType}
          style={[
            tw`rounded-xl py-4 px-6`,
            selectedType
              ? tw`bg-purple-500`
              : tw`bg-gray-700`,
          ]}
        >
          <Text
            style={[
              tw`text-center font-bold text-lg`,
              selectedType ? tw`text-white` : tw`text-gray-400`,
            ]}
          >
            Continue →
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default AdTypeSelection;
