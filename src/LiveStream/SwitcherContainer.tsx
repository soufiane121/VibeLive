import {View, Text, SafeAreaView} from 'react-native';
import React, {useState} from 'react';
import EventSelections, {VenueTagData} from './EventSelections';
import LiveStreamContainer from './LiveStreamContainer';
import GlobalColors from '../styles/GlobalColors';

const colors = GlobalColors.BoostFOMOFlow;
const SwitcherContainer = () => {
  const [showStartLive, setShowStartLive] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string | undefined>("");
  const [boostData, setBoostData] = useState<any>(null);
  const [subcategoriesTags, setSubcategoriesTags] = useState<string[]>([]);
  const [parentCategory, setParentCategory] = useState<string>('');
  const [venueTag, setVenueTag] = useState<VenueTagData | null>(null);
  
  const handleCompleteSelection = (args: {
    value: string;
    boostData?: any;
    title?: string;
    subcategories?: string[];
    parentCategory?: string;
    venueTag?: VenueTagData | null;
  }) => {
    const {value, boostData: boostInfo, title: titleValue, subcategories: subcategoriesValue, parentCategory: parentCategoryValue, venueTag: venueTagValue} = args || {};
    
    setSelectedEventType(value);
    setBoostData(boostInfo);
    setShowStartLive(true);
    setTitle(titleValue || "");
    setSubcategoriesTags(subcategoriesValue || []);
    setParentCategory(parentCategoryValue || '');
    setVenueTag(venueTagValue || null);
    
    console.log('✅ SwitcherContainer state updated - proceeding to LiveStreamContainer');
  };

  // Handle going back to EventSelections from LiveStreamContainer
  const handleBackToEventSelections = () => {
    setShowStartLive(false);
    // Reset boost data to allow new selection
    setBoostData(null);
    setVenueTag(null);
  };
  const handleChangeTitle = (title: string) => {
    console.log('Title changed:', title);
    setTitle(title);
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {!showStartLive ? (
        <EventSelections onCompleteSelection={handleCompleteSelection} onTitleChange={handleChangeTitle} />
      ) : (
        <LiveStreamContainer 
          streamEventType={selectedEventType || 'default'} 
          streamTitle={title || 'default'} 
          boostData={boostData}
          subcategoriesTags={subcategoriesTags}
          parentCategory={parentCategory}
          venueTag={venueTag}
          onBackToEventSelections={handleBackToEventSelections}
        />
      )}
    </View>
  );
};

export default SwitcherContainer;
