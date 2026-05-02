import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { GlobalColors } from '../styles/GlobalColors';
import { useAnalytics } from '../Hooks/useAnalytics';
import {
  useGetAccountProfileQuery,
  useUpdateInterestsMutation,
} from '../../features/settings/SettingsSliceApi';

const colors = GlobalColors.Account;

const MAX_INTERESTS = 10;

import { tags } from '../../tags';

// Flatten the nested tags structure from tags.js into a single array of strings
const ALL_INTERESTS = tags.reduce((acc: string[], category) => {
  return [...acc, ...category.children];
}, []);

const MyInterests = () => {
  const navigation = useNavigation<any>();
  const { trackEvent } = useAnalytics();
  const { currentUser } = useSelector((state: any) => state?.currentUser);
  const userId = currentUser?._id;

  const { data: profileData } = useGetAccountProfileQuery(userId, { skip: !userId });
  const [updateInterests, { isLoading: isSaving }] = useUpdateInterestsMutation();

  const initialInterests = profileData?.data?.interests || [];
  const [selected, setSelected] = useState<string[]>(initialInterests);

  useEffect(() => {
    if (profileData?.data?.interests) {
      setSelected(profileData.data.interests);
    }
  }, [profileData?.data?.interests]);

  const hasChanges = JSON.stringify([...selected].sort()) !== JSON.stringify([...initialInterests].sort());

  const toggleInterest = (label: string) => {
    setSelected(prev => {
      if (prev.includes(label)) {
        return prev.filter(i => i !== label);
      }
      if (prev.length >= MAX_INTERESTS) {
        Alert.alert('Maximum reached', `You can select up to ${MAX_INTERESTS} interests.`);
        return prev;
      }
      return [...prev, label];
    });
  };

  const handleSave = async () => {
    try {
      await updateInterests({ userId, interests: selected }).unwrap();
      trackEvent('interests_updated', {
        user_id: userId,
        count: selected.length,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save interests. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.titleLabel}>PERSONALIZE YOUR FEED</Text>
          <Text style={styles.titleText}>My Interests</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="zap" size={18} color={colors.accent} />
            <Text style={styles.infoTitle}>Personalize your feed</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {selected.length}/{MAX_INTERESTS}
              </Text>
            </View>
          </View>
          <Text style={styles.infoDesc}>
            Select up to 10 interests to see more relevant content and recommendations tailored to you.
          </Text>
        </View>

        {/* Interest Chips Grid */}
        <View style={styles.chipsContainer}>
          {ALL_INTERESTS.map((interestLabel: string) => {
            const isSelected = selected.includes(interestLabel);
            return (
              <TouchableOpacity
                key={interestLabel}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
                onPress={() => toggleInterest(interestLabel)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {interestLabel}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.chipSelectedText}
                    style={{ marginLeft: 6 }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, !hasChanges && styles.saveBtnTextDisabled]}>
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MyInterests;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },

  // Title
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.sectionLabel,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  // Info Card
  infoCard: {
    marginHorizontal: 16,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  infoDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.chipUnselectedBorder,
    backgroundColor: colors.chipUnselected,
  },
  chipSelected: {
    borderColor: colors.chipSelectedBorder,
    backgroundColor: colors.chipSelected,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.chipUnselectedText,
  },
  chipTextSelected: {
    color: colors.chipSelectedText,
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    backgroundColor: colors.background,
  },
  saveBtn: {
    backgroundColor: colors.primaryButton,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryButtonText,
  },
  saveBtnTextDisabled: {
    color: colors.textMuted,
  },
});
