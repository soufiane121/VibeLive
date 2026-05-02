import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import {CommonMaterialCommunityIcons} from '../../../UIComponents/Icons';
import { GlobalColors } from '../../../styles/GlobalColors';
import * as ImagePicker from 'expo-image-picker';
import {
  useGetUploadUrlMutation,
} from '../../../../features/Events/EventsApi';

const eventTypes = [
  {key: 'music', label: 'Music', icon: 'music-note'},
  {key: 'nightlife', label: 'Nightlife', icon: 'glass-cocktail'},
  {key: 'festival', label: 'Festival', icon: 'star-outline'},
  {key: 'conference', label: 'Conference', icon: 'calendar-blank'},
  {key: 'comedy', label: 'Comedy', icon: 'drama-masks'},
  {key: 'theater', label: 'Theater', icon: 'theater'},
  {key: 'art', label: 'Art', icon: 'palette'},
  {key: 'food', label: 'Food', icon: 'silverware-fork-knife'},
  {key: 'happyhour', label: 'Happy Hour', icon: 'glass-mug-variant'},
  {key: 'other', label: 'Other', icon: 'alert-circle-outline'},
];

interface EventBasicDetailsProps {
  formData: {
    title: string;
    description: string;
    eventType: string;
    coverImageUrl: string | null;
    coverImageUploadState: 'idle' | 'uploading' | 'success' | 'error';
  };
  errors: {[key: string]: string};
  onUpdateFormData: (updates: any) => void;
  isOperator?: boolean;
}

const colors = GlobalColors.EventCreationFlow;

const EventBasicDetails: React.FC<EventBasicDetailsProps> = ({
  formData,
  errors,
  onUpdateFormData,
  isOperator = true,
}) => {
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [showAndroidActionSheet, setShowAndroidActionSheet] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const [getUploadUrl] = useGetUploadUrlMutation();

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Library', 'Take Photo'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImageFromLibrary();
          } else if (buttonIndex === 2) {
            takePhoto();
          }
        }
      );
    } else {
      setShowAndroidActionSheet(true);
    }
  };

  const pickImageFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the camera is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  };

  const handleImageSelected = async (uri: string) => {
    setLocalImageUri(uri);
    onUpdateFormData({ coverImageUploadState: 'uploading' });

    try {
      const uploadUrlResponse = await getUploadUrl().unwrap();
      
      if (!uploadUrlResponse.success) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl } = uploadUrlResponse.data;

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'event-cover.jpg',
      } as any);

      console.log('Uploading to Cloudflare:', uploadUrl);
      console.log('Image URI:', uri);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Cloudflare upload status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Cloudflare upload error:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`);
      }

      // Extract the public URL from Cloudflare's response
      const cloudflareResult = await uploadResponse.json();
      const coverImageUrl = cloudflareResult.result?.variants?.[0];
      
      if (!coverImageUrl) {
        throw new Error('Failed to get image URL from Cloudflare response');
      }

      onUpdateFormData({
        coverImageUrl,
        coverImageUploadState: 'success',
      });
    } catch (error) {
      console.error('Image upload error:', error);
      setLocalImageUri(null);
      onUpdateFormData({
        coverImageUrl: null,
        coverImageUploadState: 'error',
      });
    }
  };

  const handleRemovePhoto = () => {
    setShowRemoveConfirm(true);
  };

  const confirmRemovePhoto = () => {
    setLocalImageUri(null);
    onUpdateFormData({
      coverImageUrl: null,
      coverImageUploadState: 'idle',
    });
    setShowRemoveConfirm(false);
  };

  const renderPhotoUploadSection = () => {
    const { coverImageUrl, coverImageUploadState } = formData;
    const hasImage = coverImageUrl || localImageUri;
    const isUploading = coverImageUploadState === 'uploading';
    const hasError = coverImageUploadState === 'error';

    if (isUploading && localImageUri) {
      return (
        <View style={styles.photoContainer}>
          <Image source={{ uri: localImageUri }} style={styles.photoImage} />
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </View>
      );
    }

    if (hasImage && !isUploading) {
      const imageUri = coverImageUrl || localImageUri;
      return (
        <View style={styles.photoContainer}>
          <Image source={{ uri: imageUri! }} style={styles.photoImage} />
          <TouchableOpacity
            style={styles.editButton}
            onPress={showImagePickerOptions}
            activeOpacity={0.8}
          >
            <CommonMaterialCommunityIcons name="pencil" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemovePhoto}
            activeOpacity={0.8}
          >
            <CommonMaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.uploadArea}
        onPress={showImagePickerOptions}
        activeOpacity={0.7}
      >
        <CommonMaterialCommunityIcons
          name="cloud-upload-outline"
          size={45}
          color={colors.primary}
        />
        <Text style={styles.uploadLabel}>Add Event Photo</Text>
        <Text style={styles.uploadHint}>
          Optional · Tap to choose from library or take a photo
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepSubtitle}>STEP 1 OF 5</Text>
      <Text style={styles.stepTitle}>Event details</Text>

      {/* Photo Upload Section */}
      <View style={styles.photoSection}>
        {renderPhotoUploadSection()}
        {formData.coverImageUploadState === 'error' && (
          <Text style={styles.uploadError}>
            Photo upload failed. Please try again.
          </Text>
        )}
      </View>

      {/* Android Action Sheet Modal */}
      <Modal
        visible={showAndroidActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAndroidActionSheet(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAndroidActionSheet(false)}
        >
          <View style={styles.actionSheetContainer}>
            <TouchableOpacity
              style={styles.actionSheetOption}
              onPress={() => {
                setShowAndroidActionSheet(false);
                pickImageFromLibrary();
              }}
            >
              <CommonMaterialCommunityIcons name="image" size={24} color={colors.text} />
              <Text style={styles.actionSheetText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetOption}
              onPress={() => {
                setShowAndroidActionSheet(false);
                takePhoto();
              }}
            >
              <CommonMaterialCommunityIcons name="camera" size={24} color={colors.text} />
              <Text style={styles.actionSheetText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetOption, styles.actionSheetCancel]}
              onPress={() => setShowAndroidActionSheet(false)}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Remove Photo Confirmation Modal */}
      <Modal
        visible={showRemoveConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRemoveConfirm(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowRemoveConfirm(false)}
        >
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmTitle}>Remove photo?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowRemoveConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmRemoveButton}
                onPress={confirmRemovePhoto}
              >
                <Text style={styles.confirmRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <View style={styles.labelDot} />
          <Text style={styles.label}>Event title</Text>
        </View>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={formData.title}
          onChangeText={text => onUpdateFormData({title: text})}
          placeholder="Enter event title"
          placeholderTextColor={colors.textMuted}
          maxLength={100}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <View style={styles.labelDot} />
          <Text style={styles.label}>Description</Text>
        </View>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          value={formData.description}
          onChangeText={text => onUpdateFormData({description: text})}
          placeholder="Describe your event"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
      </View>

      {isOperator ? (
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <View style={styles.labelDot} />
            <Text style={styles.label}>Event type</Text>
          </View>
          <View style={styles.eventTypeGrid}>
            {eventTypes.map(type => {
              const isActive = formData.eventType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.eventTypeItem,
                    isActive && styles.eventTypeItemActive,
                  ]}
                  onPress={() => onUpdateFormData({eventType: type.key})}>
                  <View style={[styles.eventIconWrapper, isActive && styles.eventIconWrapperActive]}>
                    <CommonMaterialCommunityIcons
                      name={type.icon as any}
                      size={20}
                      color={isActive ? colors.background : colors.textMuted}
                    />
                  </View>
                  <Text
                    style={[
                      styles.eventTypeText,
                      isActive && styles.eventTypeTextActive,
                    ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.eventType && (
            <Text style={styles.errorText}>{errors.eventType}</Text>
          )}
        </View>
      ) : (
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <View style={styles.labelDot} />
            <Text style={styles.label}>Event type</Text>
          </View>
          <View style={[styles.eventTypeItem, styles.eventTypeItemActive, { width: '100%', aspectRatio: undefined, paddingVertical: 16, flexDirection: 'row' }]}>
            <View style={[styles.eventIconWrapper, styles.eventIconWrapperActive, { marginBottom: 0, marginRight: 12 }]}>
              <CommonMaterialCommunityIcons name="glass-mug-variant" size={20} color={colors.background} />
            </View>
            <Text style={[styles.eventTypeText, styles.eventTypeTextActive, { fontSize: 16 }]}>Happy Hour</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  stepSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 6,
    fontWeight: '600',
  },
  eventTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  eventTypeItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeItemActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySurface,
  },
  eventIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderLight, // matches inner gray line
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIconWrapperActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eventTypeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  eventTypeTextActive: {
    color: colors.primary,
  },
  // Photo Upload Styles
  photoSection: {
    marginBottom: 24,
  },
  photoContainer: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    // backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadArea: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  uploadLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '700'
  },
  uploadError: {
    fontSize: 14,
    color: colors.error,
    marginTop: 8,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingTop: 8,
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionSheetText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 16,
  },
  actionSheetCancel: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    justifyContent: 'center',
  },
  actionSheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  confirmContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 34,
    borderRadius: 16,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmRemoveButton: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  confirmRemoveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EventBasicDetails;
