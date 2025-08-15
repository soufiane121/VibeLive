import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import tw from '../../../tw';
import { useAnalytics } from '../../Hooks/useAnalytics';
import { ChevronBackIcon, CameraIcon, VideocamIcon, UploadIcon } from '../../UIComponents/Icons';

const { width } = Dimensions.get('window');

interface RouteParams {
  adType: 'map_marker' | 'story_carousel';
}

const AdMediaUpload: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const analytics = useAnalytics();
  const { adType } = (route.params as RouteParams) || {};
  
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [uploadProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    analytics.trackEvent('ad_media_upload_viewed', {
      ad_type: adType,
      timestamp: new Date().toISOString(),
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleBack = () => {
    analytics.trackEvent('ad_media_upload_back', {
      ad_type: adType,
      has_media: !!selectedMedia,
      has_title: !!eventTitle,
    });
    navigation.goBack();
  };

  const selectMedia = (type: 'image' | 'video') => {
    // const mediaType: MediaType = type === 'video' ? 'video' : 'photo';
    
    const options = {
      mediaType,
      quality: 0.8,
      videoQuality: 'high' as const,
      durationLimit: 30, // 30 seconds max for videos
    };

    // launchImageLibrary(options, (response) => {
    //   if (response.didCancel || response.errorMessage) {
    //     analytics.trackEvent('media_selection_cancelled', {
    //       media_type: type,
    //       ad_type: adType,
    //     });
    //     return;
    //   }

    //   if (response.assets && response.assets[0]) {
    //     const asset = response.assets[0];
    //     setSelectedMedia(asset);
    //     setMediaType(type);
        
    //     analytics.trackEvent('media_selected', {
    //       media_type: type,
    //       file_size: asset.fileSize,
    //       duration: asset.duration,
    //       ad_type: adType,
    //     });

    //     // Simulate upload progress
    //     Animated.timing(uploadProgress, {
    //       toValue: 1,
    //       duration: 2000,
    //       useNativeDriver: false,
    //     }).start();
    //   }
    // });
  };

  const handleContinue = () => {
    if (!selectedMedia || !eventTitle.trim()) {
      Alert.alert('Missing Information', 'Please upload media and add an event title.');
      return;
    }

    analytics.trackEvent('ad_media_upload_completed', {
      ad_type: adType,
      media_type: mediaType,
      title_length: eventTitle.length,
      description_length: eventDescription.length,
    });

    // navigation.navigate('AdTargeting' as never, {
    //   adType,
    //   media: selectedMedia,
    //   mediaType,
    //   eventTitle,
    //   eventDescription,
    // } as never);
  };

  return (
    <Animated.View style={[tw`flex-1 bg-black`, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-12 pb-4`}>
        <TouchableOpacity onPress={handleBack} style={tw`p-2`}>
          <ChevronBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-bold`}>Upload Media</Text>
        <Text style={tw`text-gray-400 text-sm`}>Step 2 of 5</Text>
      </View>

      {/* Progress Bar */}
      <View style={tw`px-4 mb-6`}>
        <View style={tw`flex-row justify-between mb-2`}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={[
                tw`w-3 h-3 rounded-full`,
                step <= 2 ? tw`bg-purple-500` : tw`bg-gray-600`,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={tw`flex-1 px-4`}>
        {/* Title */}
        <Text style={tw`text-white text-2xl font-bold mb-2`}>
          Upload Your Media
        </Text>
        <Text style={tw`text-gray-400 text-base mb-6`}>
          Add an eye-catching image or video
        </Text>

        {/* Media Selection */}
        {!selectedMedia ? (
          <View style={tw`mb-6`}>
            {/* Image Option */}
            <TouchableOpacity
              onPress={() => selectMedia('image')}
              style={tw`bg-gray-900 border-2 border-dashed border-purple-500 rounded-xl p-8 mb-4`}
            >
              <View style={tw`items-center`}>
                <CameraIcon size={48} color="#A855F7" />
                <Text style={tw`text-white text-lg font-bold mt-3`}>Image</Text>
                <Text style={tw`text-gray-400 text-sm text-center mt-1`}>
                  PNG, JPG or JPEG (MAX 10MB)
                </Text>
              </View>
            </TouchableOpacity>

            {/* Video Option */}
            <TouchableOpacity
              onPress={() => selectMedia('video')}
              style={tw`bg-gray-900 border-2 border-dashed border-pink-500 rounded-xl p-8`}
            >
              <View style={tw`items-center`}>
                <VideocamIcon size={48} color="#EC4899" />
                <Text style={tw`text-white text-lg font-bold mt-3`}>Video</Text>
                <Text style={tw`text-gray-400 text-sm text-center mt-1`}>
                  MP4 format, 30 seconds max
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          /* Media Preview */
          <View style={tw`mb-6`}>
            <View style={tw`bg-gray-900 rounded-xl p-4 mb-4`}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <Text style={tw`text-white font-bold`}>Selected Media</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMedia(null);
                    setMediaType(null);
                    uploadProgress.setValue(0);
                  }}
                  style={tw`bg-red-500 rounded-full px-3 py-1`}
                >
                  <Text style={tw`text-white text-xs`}>Change</Text>
                </TouchableOpacity>
              </View>
              
              {mediaType === 'image' && (
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={tw`w-full h-48 rounded-lg`}
                  resizeMode="cover"
                />
              )}
              
              {mediaType === 'video' && (
                <View style={tw`w-full h-48 bg-gray-800 rounded-lg items-center justify-center`}>
                  <VideocamIcon size={48} color="#FFFFFF" />
                  <Text style={tw`text-white mt-2`}>Video Selected</Text>
                  <Text style={tw`text-gray-400 text-xs`}>
                    {Math.round((selectedMedia.duration || 0) / 1000)}s duration
                  </Text>
                </View>
              )}

              {/* Upload Progress */}
              <View style={tw`mt-3`}>
                <View style={tw`bg-gray-700 h-2 rounded-full overflow-hidden`}>
                  <Animated.View
                    style={[
                      tw`h-full bg-green-500`,
                      {
                        width: uploadProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={tw`text-green-400 text-xs mt-1`}>✓ Upload complete</Text>
              </View>
            </View>
          </View>
        )}

        {/* Event Details */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-white text-lg font-bold mb-4`}>Event Details</Text>
          
          {/* Event Title */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-300 text-sm mb-2`}>Event Title *</Text>
            <TextInput
              style={tw`bg-gray-900 text-white p-4 rounded-xl border border-gray-700`}
              placeholder="Enter your event title..."
              placeholderTextColor="#6B7280"
              value={eventTitle}
              onChangeText={setEventTitle}
              maxLength={50}
            />
            <Text style={tw`text-gray-500 text-xs mt-1`}>
              {eventTitle.length}/50 characters
            </Text>
          </View>

          {/* Event Description */}
          <View>
            <Text style={tw`text-gray-300 text-sm mb-2`}>Description</Text>
            <TextInput
              style={tw`bg-gray-900 text-white p-4 rounded-xl border border-gray-700 h-24`}
              placeholder="Tell people what makes your event special..."
              placeholderTextColor="#6B7280"
              value={eventDescription}
              onChangeText={setEventDescription}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={tw`text-gray-500 text-xs mt-1`}>
              {eventDescription.length}/200 characters
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View style={tw`bg-blue-900 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-blue-400 font-bold mb-2`}>💡 Pro Tips</Text>
          <Text style={tw`text-blue-200 text-sm`}>
            • Use bright, high-contrast images{'\n'}
            • Include your event date/time in the title{'\n'}
            • Videos get 3x more engagement{'\n'}
            • Show people having fun at your venue
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <View style={tw`px-4 pb-8`}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedMedia || !eventTitle.trim()}
          style={[
            tw`rounded-xl py-4 px-6`,
            selectedMedia && eventTitle.trim()
              ? tw`bg-purple-500`
              : tw`bg-gray-700`,
          ]}
        >
          <Text
            style={[
              tw`text-center font-bold text-lg`,
              selectedMedia && eventTitle.trim() ? tw`text-white` : tw`text-gray-400`,
            ]}
          >
            Continue →
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default AdMediaUpload;
