import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import {GlobalColors} from '../../../styles/GlobalColors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Button from '../../UIComponents/Button';
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
          style={[
            styles.parentTagButton,
            selectedChildrenCount > 0 && styles.parentTagButtonActive
          ]}
          onPress={() => toggleCategory(tag.parent)}>
          <Text style={[
            styles.parentTagText,
            selectedChildrenCount > 0 && styles.parentTagTextActive
          ]}>
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
              size={20}
              color={selectedChildrenCount > 0 ? GlobalColors.Settings.background : GlobalColors.Settings.textMuted}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.childTagsContainer}>
            <FlatList
              data={tag.children}
              numColumns={2}
              scrollEnabled={false}
              keyExtractor={(item, index) => `${tag.parent}-${index}`}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.childTagButton,
                    selectedTags.includes(item) && styles.childTagButtonActive
                  ]}
                  onPress={() => toggleTag(item)}>
                  <Text style={[
                    styles.childTagText,
                    selectedTags.includes(item) && styles.childTagTextActive
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              columnWrapperStyle={styles.childTagRow}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={GlobalColors.Settings.text} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: '75%'}]} />
        </View>
        <Text style={styles.progressText}>{t('onboarding.step3Of4')}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.whatExcitesYou')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.selectInterestsSubtitle')}
        </Text>

        {/* Selection Counter */}
        <View style={styles.selectionCounter}>
          <Text style={styles.selectionText}>
            {t('onboarding.interestsSelected', { count: selectedTags.length })}
          </Text>
          {selectedTags.length >= 3 && (
            <View style={styles.recommendedBadge}>
              <Icon name="check-circle" size={16} color={GlobalColors.Common.successIcon} />
              <Text style={styles.recommendedText}>{t('onboarding.greatSelection')}</Text>
            </View>
          )}
        </View>

        {/* Tags List */}
        <ScrollView 
          style={styles.tagsScrollView}
          showsVerticalScrollIndicator={false}>
          {tags.map(renderParentTag)}
        </ScrollView>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedTags.length === 0 && styles.continueButtonDisabled
          ]}
          onPress={validateAndContinue}
          disabled={selectedTags.length === 0}>
          <Text style={styles.continueButtonText}>
            {selectedTags.length > 0 
              ? t('onboarding.continueWithCount', { count: selectedTags.length })
              : t('common.continue')}
          </Text>
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
    backgroundColor: GlobalColors.Settings.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: GlobalColors.Settings.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GlobalColors.Settings.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: GlobalColors.Settings.textMuted,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GlobalColors.Settings.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: GlobalColors.Settings.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  selectionCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  selectionText: {
    fontSize: 16,
    color: GlobalColors.Settings.text,
    fontWeight: '600',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalColors.Settings.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recommendedText: {
    fontSize: 14,
    color: GlobalColors.Common.successText,
    marginLeft: 6,
    fontWeight: '600',
  },
  tagsScrollView: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  parentTagButton: {
    backgroundColor: GlobalColors.Settings.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Settings.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parentTagButtonActive: {
    backgroundColor: GlobalColors.Settings.accent + '20',
    borderColor: GlobalColors.Settings.accent,
  },
  parentTagText: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalColors.Settings.text,
    flex: 1,
  },
  parentTagTextActive: {
    color: GlobalColors.Settings.accent,
  },
  parentTagRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedBadge: {
    backgroundColor: GlobalColors.Settings.accent,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: GlobalColors.Settings.background,
  },
  childTagsContainer: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  childTagRow: {
    justifyContent: 'space-between',
  },
  childTagButton: {
    backgroundColor: GlobalColors.Settings.surface,
    borderWidth: 1,
    borderColor: GlobalColors.Settings.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  childTagButtonActive: {
    backgroundColor: GlobalColors.Settings.accent,
    borderColor: GlobalColors.Settings.accent,
  },
  childTagText: {
    fontSize: 14,
    color: GlobalColors.Settings.text,
    textAlign: 'center',
  },
  childTagTextActive: {
    color: GlobalColors.Settings.background,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingTop: 20,
  },
  continueButton: {
    backgroundColor: GlobalColors.Settings.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: GlobalColors.Settings.border,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalColors.Settings.background,
  },
  helpText: {
    fontSize: 14,
    color: GlobalColors.Settings.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default OnboardingInterests;
