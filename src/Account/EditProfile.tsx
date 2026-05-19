import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  ActionSheetIOS,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { GlobalColors } from '../styles/GlobalColors';
import { useAnalytics } from '../Hooks/useAnalytics';
import {
  useUpdateProfileMutation,
  useGetProfileImageUploadUrlMutation,
} from '../../features/settings/SettingsSliceApi';
import { useValidateFieldsMutation } from '../../features/registrations/LoginSliceApi';
import { setCurrentUser } from '../../features/registrations/CurrentUser';

const colors = GlobalColors.Account;

const EditProfile = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { currentUser } = useSelector((state: any) => state?.currentUser);

  const [displayName, setDisplayName] = useState(
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
  );
  const [userName, setUserName] = useState(currentUser?.userName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
    currentUser?.profilePicture || null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [showAndroidSheet, setShowAndroidSheet] = useState(false);

  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [getUploadUrl] = useGetProfileImageUploadUrlMutation();
  const [validateFields] = useValidateFieldsMutation();

  const hasChanges =
    displayName !== `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
    userName !== (currentUser?.userName || '') ||
    uploadedImageUrl !== (currentUser?.profilePicture || null);

  useEffect(() => {
    trackEvent('app_opened', {
      screen_name: 'EditProfile',
      user_id: currentUser?._id,
    });
  }, []);

  // ---------- Photo Upload ----------
  const showPickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Library', 'Take Photo'],
          cancelButtonIndex: 0,
        },
        idx => {
          if (idx === 1) pickImageFromLibrary();
          if (idx === 2) takePhoto();
        },
      );
    } else {
      setShowAndroidSheet(true);
    }
  };

  const pickImageFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  };

  const handleImageSelected = async (uri: string) => {
    setLocalImageUri(uri);
    setIsUploading(true);
    try {
      const uploadUrlRes = await getUploadUrl(currentUser._id).unwrap();
      if (!uploadUrlRes.success) throw new Error('Failed to get upload URL');

      const { uploadUrl } = uploadUrlRes.data;
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'profile-photo.jpg',
      } as any);

      const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload failed');

      const cloudflareResult = await uploadRes.json();
      const imageUrl = cloudflareResult.result?.variants?.[0];
      if (!imageUrl) throw new Error('No image URL returned');

      setUploadedImageUrl(imageUrl);
    } catch (err) {
      console.error('Image upload error:', err);
      setLocalImageUri(null);
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ---------- Save ----------
  const handleSave = async () => {
    const nameParts = displayName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (!firstName) {
      Alert.alert('Validation', 'Display name is required.');
      return;
    }

    // Validate username if changed
    if (userName !== currentUser?.userName) {
      try {
        await validateFields({ userName }).unwrap();
      } catch (err: any) {
        Alert.alert('Username Taken', err?.data?.message || 'That username is already in use.');
        return;
      }
    }

    try {
      const payload: any = { firstName, lastName };
      if (userName !== currentUser?.userName) payload.userName = userName;
      if (uploadedImageUrl && uploadedImageUrl !== currentUser?.profilePicture) {
        payload.profilePicture = uploadedImageUrl;
      }

      const res = await updateProfile({ userId: currentUser._id, profile: payload }).unwrap();
      if (res.success) {
        dispatch(
          setCurrentUser({
            ...currentUser,
            firstName,
            lastName,
            userName: userName || currentUser.userName,
            profilePicture: uploadedImageUrl || currentUser.profilePicture,
          }),
        );
        trackEvent('profile_updated', { user_id: currentUser._id });
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleDiscard = () => {
    if (hasChanges) {
      Alert.alert('Discard Changes', 'Are you sure you want to discard your changes?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const displayImage = localImageUri || uploadedImageUrl;
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={showPickerOptions} activeOpacity={0.7}>
            <View style={styles.avatarWrapper}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.usernameInputRow}>
              <Text style={styles.usernamePrefix}>@</Text>
              <TextInput
                style={[styles.input, { flex: 1, paddingLeft: 0 }]}
                value={userName}
                onChangeText={setUserName}
                placeholder="username"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, { color: colors.textMuted }]}
              value={email}
              editable={false}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.inputHint}>Email cannot be changed here. Go to Settings → Email.</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.saveBtn, (!hasChanges || isSaving || isUploading) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || isSaving || isUploading}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
            <Text style={styles.discardBtnText}>Discard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Android ActionSheet */}
      <Modal
        visible={showAndroidSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAndroidSheet(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAndroidSheet(false)}>
          <View style={styles.actionSheetContainer}>
            <TouchableOpacity
              style={styles.actionSheetOption}
              onPress={() => {
                setShowAndroidSheet(false);
                pickImageFromLibrary();
              }}
            >
              <MaterialCommunityIcons name="image" size={24} color={colors.text} />
              <Text style={styles.actionSheetText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetOption}
              onPress={() => {
                setShowAndroidSheet(false);
                takePhoto();
              }}
            >
              <MaterialCommunityIcons name="camera" size={24} color={colors.text} />
              <Text style={styles.actionSheetText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetOption, { borderTopWidth: 1, borderTopColor: colors.border }]}
              onPress={() => setShowAndroidSheet(false)}
            >
              <Text style={[styles.actionSheetText, { color: colors.textSecondary, textAlign: 'center' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 10,
  },

  // Form
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inputLabel,
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.inputText,
    fontWeight: '600',
  },
  usernameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  usernamePrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    marginRight: 2,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Buttons
  buttonSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  saveBtn: {
    backgroundColor: colors.primaryButton,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryButtonText,
  },
  discardBtn: {
    backgroundColor: colors.secondaryButton,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.secondaryButtonBorder,
  },
  discardBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondaryButtonText,
  },

  // ActionSheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
});
