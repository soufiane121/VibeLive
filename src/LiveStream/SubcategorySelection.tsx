import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {GlobalColors} from '../styles/GlobalColors';
import {tags} from '../../tags';

const colors = GlobalColors.BoostFOMOFlow;

interface SubcategorySelectionProps {
  route?: {
    params?: {
      parentCategory: string;
      categoryKey: string;
      title?: string;
      returnScreen?: string;
    };
  };
  navigation?: any;
}

const SubcategorySelection = ({route, navigation}: SubcategorySelectionProps) => {
  const params = route?.params;
  const parentCategory = params?.parentCategory || '';
  const categoryKey = params?.categoryKey || '';
  const title = params?.title || '';
  const returnScreen = params?.returnScreen || 'EventSelections';
  
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  // Find the parent category in tags and get its children
  const parentTag = tags.find(tag => tag.parent === parentCategory);
  const subcategories = parentTag?.children || [];

  const handleSubcategoryToggle = (subcategory: string) => {
    setSelectedSubcategories(prev => {
      if (prev.includes(subcategory)) {
        return prev.filter(item => item !== subcategory);
      } else {
        return [...prev, subcategory];
      }
    });
  };

  const handleContinue = () => {
    // Store data in global state for bottom navigation
    if (selectedSubcategories.length > 0) {
      console.log('Storing subcategories:', selectedSubcategories);
      // Store in global state that EventSelections can access
      (global as any).subcategoryData = {
        subcategories: selectedSubcategories,
        categoryKey: categoryKey,
        title: title,
        timestamp: Date.now()
      };
    }
    navigation?.goBack();
  };

  const handleBack = () => {
    navigation?.goBack();
  };

  const renderSubcategoryItem = ({item}: {item: string}) => {
    const isSelected = selectedSubcategories.includes(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.subcategoryCard,
          isSelected && styles.selectedSubcategoryCard,
        ]}
        onPress={() => handleSubcategoryToggle(item)}>
        <View style={styles.subcategoryContent}>
          <Text style={[
            styles.subcategoryText,
            isSelected && styles.selectedSubcategoryText,
          ]}>
            {item}
          </Text>
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Choose Your {parentCategory}</Text>
          <Text style={styles.headerSubtitle}>Select all that apply</Text>
        </View>
      </View>

      {/* Subcategories Grid */}
      <FlatList
        data={subcategories}
        keyExtractor={(item, index) => `${item}-${index}`}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        renderItem={renderSubcategoryItem}
        columnWrapperStyle={styles.row}
      />

      {/* Back Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}>
          <Text style={styles.continueButtonText}>
            {selectedSubcategories.length > 0 
              ? `Back with ${selectedSubcategories.length} selected` 
              : 'Back'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const {width} = Dimensions.get('window');
const cardWidth = (width - 60) / 3; // 3 cards per row with margins

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  gridContainer: {
    padding: 20,
    paddingBottom: 120, // Space for bottom button
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subcategoryCard: {
    width: cardWidth,
    height: cardWidth,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    position: 'relative',
  },
  selectedSubcategoryCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subcategoryContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  subcategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedSubcategoryText: {
    color: colors.background,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    backgroundColor: colors.background,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 20,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});

export default SubcategorySelection;
