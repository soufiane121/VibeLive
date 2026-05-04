import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {GlobalColors} from '../../../styles/GlobalColors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {tags} from '../../../../tags';
import useTranslation from '../../../Hooks/useTranslation';

interface OnboardingInterestsProps {
  navigation: any;
  route: any;
}

interface Tag {
  parent: string;
  children: string[];
}

const OnboardingInterests: React.FC<OnboardingInterestsProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    
    // Find the parent category for this tag and add it to selectedCategories
    const parentCategory = tags.find(tagGroup => tagGroup.children.includes(tag))?.parent;
    if (parentCategory && !selectedCategories.includes(parentCategory)) {
      setSelectedCategories(prev => [...prev, parentCategory]);
    }
  };

  const validateAndContinue = () => {
    // Validation: Ensure at least one interest is selected
    if (selectedTags.length === 0) {
      Alert.alert(
        t('onboarding.selectInterests'),
        t('onboarding.interestsDesc'),
        [
          {text: t('common.ok'), style: 'default'}
        ]
      );
      return;
    }

    // Validation: Recommend selecting more interests for better experience
    if (selectedTags.length < 3) {
      Alert.alert(
        t('onboarding.enhanceExperience'),
        t('onboarding.interestsRecommend', { count: selectedTags.length }),
        [
          {text: t('onboarding.addMore'), style: 'cancel'},
          {text: t('common.continue'), onPress: proceedToNext, style: 'default'},
        ]
      );
      return;
    }

    proceedToNext();
  };

  const proceedToNext = () => {
    const signupData = route.params?.signupData || {};
    navigation.navigate('OnboardingNotifications', {
      signupData: {
        ...signupData,
        interests: selectedTags,
        interestCategories: selectedCategories,
      },
    });
  };

    const renderParentTag = (tag: Tag) => {
    const isExpanded = expandedCategories.includes(tag.parent);
    const selectedChildrenCount = tag.children.filter(child =>
      selectedTags.includes(child)
    ).length;

    return (
      <View key={tag.parent} style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.parentTagButton}
          onPress={() => toggleCategory(tag.parent)}
          activeOpacity={0.8}>
          <Text style={styles.parentTagText}>
            {tag.parent}
          </Text>
          <View style={styles.parentTagRight}>
            {selectedChildrenCount > 0 && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>{selectedChildrenCount}</Text>
              </View>
            )}
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={GlobalColors.Onboarding.textMuted}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.childTagsContainer}>
            <View style={styles.childTagsRow}>
              {tag.children.map(child => {
                const isSelected = selectedTags.includes(child);
                return (
                  <TouchableOpacity
                    key={child}
                    style={[
                      styles.childTagButton,
                      isSelected && styles.childTagButtonActive,
                    ]}
                    onPress={() => toggleTag(child)}
                    activeOpacity={0.8}>
                    {isSelected && (
                      <Icon
                        name="check"
                        size={14}
                        color={GlobalColors.Onboarding.background}
                        style={styles.childTagCheck}
                      />
                    )}
                    <Text style={[
                      styles.childTagText,
                      isSelected && styles.childTagTextActive,
                    ]}>
                      {child}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}>
        <Icon name="arrow-left" size={20} color={GlobalColors.Onboarding.textSecondary} />
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarsRow}>
          <View style={[styles.progressBar, styles.progressBarFilled]} />
          <View style={[styles.progressBar, styles.progressBarFilled]} />
          <View style={[styles.progressBar, styles.progressBarActive]} />
          <View style={styles.progressBar} />
        </View>
        <Text style={styles.progressText}>{t('onboarding.step3Of4')}</Text>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{t('onboarding.whatExcitesYou')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.selectInterestsSubtitle')}
        </Text>
      </View>

      {/* Selection Counter Badge */}
      <View style={[
        styles.counterBadge,
        selectedTags.length > 0 && styles.counterBadgeActive,
      ]}>
        <Text style={[
          styles.counterBadgeText,
          selectedTags.length > 0 && styles.counterBadgeTextActive,
        ]}>
          {t('onboarding.interestsSelected', { count: selectedTags.length })}
        </Text>
      </View>

      {/* Tags List */}
      <ScrollView
        style={styles.tagsScrollView}
        showsVerticalScrollIndicator={false}>
        {tags.map(renderParentTag)}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedTags.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={validateAndContinue}
          disabled={selectedTags.length === 0}
          activeOpacity={0.9}>
          <Text style={[
            styles.continueButtonText,
            selectedTags.length === 0 && styles.continueButtonTextDisabled,
          ]}>
            {t('common.continue')}
          </Text>
          {selectedTags.length > 0 && (
            <Icon name="arrow-right" size={18} color={GlobalColors.Onboarding.background} style={styles.buttonArrow} />
          )}
        </TouchableOpacity>

        {selectedTags.length === 0 && (
          <Text style={styles.helpText}>
            {t('onboarding.selectOneInterest')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.Onboarding.background,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  progressBarsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: GlobalColors.Onboarding.surfaceSecondary,
    borderRadius: 2,
  },
  progressBarFilled: {
    backgroundColor: GlobalColors.Onboarding.accent,
    opacity: 0.5,
  },
  progressBarActive: {
    backgroundColor: GlobalColors.Onboarding.accent,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: GlobalColors.Onboarding.accent,
    letterSpacing: 0.5,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: GlobalColors.Onboarding.text,
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: GlobalColors.Onboarding.textSecondary,
    lineHeight: 20,
  },
  counterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  counterBadgeActive: {
    backgroundColor: GlobalColors.Onboarding.accent,
    borderColor: GlobalColors.Onboarding.accent,
  },
  counterBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: GlobalColors.Onboarding.textMuted,
  },
  counterBadgeTextActive: {
    color: GlobalColors.Onboarding.background,
    fontWeight: '600',
  },
  tagsScrollView: {
    flex: 1,
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  parentTagButton: {
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parentTagText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.text,
    flex: 1,
  },
  parentTagRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedBadge: {
    backgroundColor: GlobalColors.Onboarding.accent,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: GlobalColors.Onboarding.background,
  },
  childTagsContainer: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  childTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childTagButton: {
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  childTagButtonActive: {
    backgroundColor: GlobalColors.Onboarding.accent,
    borderColor: GlobalColors.Onboarding.accent,
  },
  childTagCheck: {
    marginRight: 6,
  },
  childTagText: {
    fontSize: 13,
    color: GlobalColors.Onboarding.textSecondary,
  },
  childTagTextActive: {
    color: GlobalColors.Onboarding.background,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: GlobalColors.Onboarding.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  continueButtonDisabled: {
    backgroundColor: GlobalColors.Onboarding.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Onboarding.border,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalColors.Onboarding.background,
  },
  continueButtonTextDisabled: {
    color: GlobalColors.Onboarding.textMuted,
  },
  buttonArrow: {
    marginLeft: 6,
  },
  helpText: {
    fontSize: 12,
    color: GlobalColors.Onboarding.accent,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default OnboardingInterests;
