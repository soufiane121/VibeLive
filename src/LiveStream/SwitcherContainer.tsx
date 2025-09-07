import {View, Text, SafeAreaView} from 'react-native';
import React, {useState} from 'react';
import EventSelections from './EventSelections';
import LiveStreamContainer from './LiveStreamContainer';

const SwitcherContainer = () => {
  const [showStartLive, setShowStartLive] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string | undefined>("");
  const [boostData, setBoostData] = useState<any>(null);
  const [subcategoriesTags, setSubcategoriesTags] = useState<string[]>([]);
  const [parentCategory, setParentCategory] = useState<string>('');
  
  const handleCompleteSelection = (args: {
    value: string;
    boostData?: any;
    title?: string;
    subcategories?: string[];
    parentCategory?: string;
  }) => {
    const {value, boostData: boostInfo, title: titleValue, subcategories: subcategoriesValue, parentCategory: parentCategoryValue} = args || {};
    
    setSelectedEventType(value);
    setBoostData(boostInfo);
    setShowStartLive(true);
    setTitle(titleValue || "");
    setSubcategoriesTags(subcategoriesValue || []);
    setParentCategory(parentCategoryValue || '');
    
    console.log('✅ SwitcherContainer state updated - proceeding to LiveStreamContainer');
  };

  // Handle going back to EventSelections from LiveStreamContainer
  const handleBackToEventSelections = () => {
    setShowStartLive(false);
    // Reset boost data to allow new selection
    setBoostData(null);
  };
  const handleChangeTitle = (title: string) => {
    console.log('Title changed:', title);
    setTitle(title);
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#292929'}}>
      {!showStartLive ? (
        <EventSelections onCompleteSelection={handleCompleteSelection} onTitleChange={handleChangeTitle} />
      ) : (
        <LiveStreamContainer 
          streamEventType={selectedEventType || 'default'} 
          streamTitle={title || 'default'} 
          boostData={boostData}
          subcategoriesTags={subcategoriesTags}
          parentCategory={parentCategory}
          onBackToEventSelections={handleBackToEventSelections}
        />
      )}
    </SafeAreaView>
  );
};

export default SwitcherContainer;
