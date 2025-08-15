import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { ChevronBackIcon, SparklesIcon, TrendingUpIcon } from '../../UIComponents/Icons';

const { width } = Dimensions.get('window');

interface CreateAdFlowProps {
  route?: {
    params?: {
      entryPoint?: 'floating_button' | 'map_boost' | 'profile_promote' | 'settings_ads';
    };
  };
}

const CreateAdFlow: React.FC<CreateAdFlowProps> = ({ route }) => {
  const navigation = useNavigation();
  const analytics = useAnalytics();
  const [currentStep, setCurrentStep] = useState(1);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  
  const entryPoint = route?.params?.entryPoint || 'direct';

  useEffect(() => {
    analytics.trackEvent('ad_creation_started', {
      entry_point: entryPoint,
      timestamp: new Date().toISOString(),
    });

    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse animation for FOMO elements
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handleBack = () => {
    analytics.trackEvent('ad_creation_abandoned', {
      step: currentStep,
      entry_point: entryPoint,
    });
    navigation.goBack();
  };

  const navigateToStep = (step: string) => {
    analytics.trackEvent('ad_creation_step_navigation', {
      from_step: currentStep,
      to_step: step,
      entry_point: entryPoint,
    });
    
    switch (step) {
      case 'ad_type':
        navigation.navigate('AdTypeSelection' as never);
        break;
      case 'upload_media':
        navigation.navigate('AdMediaUpload' as never);
        break;
      case 'targeting':
        navigation.navigate('AdTargeting' as never);
        break;
      case 'pricing':
        navigation.navigate('AdPricing' as never);
        break;
      default:
        break;
    }
  };

  return (
    <Animated.View style={[tw`flex-1 bg-black`, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-12 pb-4`}>
        <TouchableOpacity onPress={handleBack} style={tw`p-2`}>
          <ChevronBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-bold`}>Create Ad</Text>
        <View style={tw`w-8`} />
      </View>

      {/* Progress Bar */}
      <View style={tw`px-4 mb-6`}>
        <View style={tw`flex-row justify-between mb-2`}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={[
                tw`w-3 h-3 rounded-full`,
                step <= currentStep
                  ? tw`bg-purple-500`
                  : tw`bg-gray-600`,
              ]}
            />
          ))}
        </View>
        <Text style={tw`text-gray-400 text-xs text-center`}>
          Step {currentStep} of 5
        </Text>
      </View>

      <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
        {/* FOMO Header */}
        <Animated.View 
          style={[
            tw`bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-4 mb-6`,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={tw`flex-row items-center mb-2`}>
            <SparklesIcon size={20} color="#FFD700" />
            <Text style={tw`text-yellow-400 text-sm font-bold ml-2`}>
              🔥 PRIME TIME SPECIAL
            </Text>
          </View>
          <Text style={tw`text-white text-lg font-bold mb-1`}>
            50% OFF First Ad!
          </Text>
          <Text style={tw`text-gray-300 text-sm`}>
            Limited time: 47 creators used this offer today
          </Text>
          <View style={tw`flex-row items-center mt-2`}>
            <TrendingUpIcon size={16} color="#10B981" />
            <Text style={tw`text-green-400 text-xs ml-1`}>
              89% see 3x more engagement
            </Text>
          </View>
        </Animated.View>

        {/* Quick Start Options */}
        <Text style={tw`text-white text-xl font-bold mb-4`}>
          Get Started Quickly
        </Text>

        {/* Ad Type Selection Preview */}
        <TouchableOpacity
          onPress={() => navigateToStep('ad_type')}
          style={tw`bg-gray-900 rounded-xl p-4 mb-4 border border-purple-500`}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white text-lg font-semibold mb-1`}>
                Choose Ad Type
              </Text>
              <Text style={tw`text-gray-400 text-sm`}>
                Map marker or story carousel
              </Text>
            </View>
            <View style={tw`bg-purple-500 rounded-full p-2`}>
              <Text style={tw`text-white text-lg`}>1</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Upload Media Preview */}
        <TouchableOpacity
          onPress={() => navigateToStep('upload_media')}
          style={tw`bg-gray-900 rounded-xl p-4 mb-4 border border-gray-700`}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white text-lg font-semibold mb-1`}>
                Upload Media
              </Text>
              <Text style={tw`text-gray-400 text-sm`}>
                Eye-catching image or video
              </Text>
            </View>
            <View style={tw`bg-gray-600 rounded-full p-2`}>
              <Text style={tw`text-white text-lg`}>2</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Targeting Preview */}
        <TouchableOpacity
          onPress={() => navigateToStep('targeting')}
          style={tw`bg-gray-900 rounded-xl p-4 mb-4 border border-gray-700`}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white text-lg font-semibold mb-1`}>
                Target Audience
              </Text>
              <Text style={tw`text-gray-400 text-sm`}>
                Location + interests
              </Text>
            </View>
            <View style={tw`bg-gray-600 rounded-full p-2`}>
              <Text style={tw`text-white text-lg`}>3</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Pricing Preview */}
        <TouchableOpacity
          onPress={() => navigateToStep('pricing')}
          style={tw`bg-gray-900 rounded-xl p-4 mb-6 border border-gray-700`}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white text-lg font-semibold mb-1`}>
                Set Budget
              </Text>
              <Text style={tw`text-gray-400 text-sm`}>
                Price per day + duration
              </Text>
            </View>
            <View style={tw`bg-gray-600 rounded-full p-2`}>
              <Text style={tw`text-white text-lg`}>4</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Social Proof */}
        <View style={tw`bg-gray-900 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-white text-lg font-bold mb-3`}>
            Success Stories
          </Text>
          <View style={tw`space-y-3`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-8 h-8 bg-purple-500 rounded-full mr-3`} />
              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-sm font-semibold`}>
                  @nightlife_queen
                </Text>
                <Text style={tw`text-gray-400 text-xs`}>
                  "Got 500+ attendees with a $25 ad!"
                </Text>
              </View>
            </View>
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-8 h-8 bg-pink-500 rounded-full mr-3`} />
              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-sm font-semibold`}>
                  @rooftop_vibes
                </Text>
                <Text style={tw`text-gray-400 text-xs`}>
                  "Best ROI for event promotion!"
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Urgency Footer */}
        <View style={tw`bg-yellow-900 rounded-xl p-4 mb-8`}>
          <Text style={tw`text-yellow-400 text-center font-bold`}>
            ⏰ Special pricing ends in 2 hours!
          </Text>
          <Text style={tw`text-yellow-200 text-center text-sm mt-1`}>
            Join 1,247 creators who boosted their events this week
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default CreateAdFlow;
