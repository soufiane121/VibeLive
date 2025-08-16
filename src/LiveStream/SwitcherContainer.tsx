import {View, Text, SafeAreaView} from 'react-native';
import React, {useState} from 'react';
import EventSelections from './EventSelections';
import LiveStreamContainer from './LiveStreamContainer';

const SwitcherContainer = () => {
  const [showStartLive, setShowStartLive] = useState(false);
  const [title, setTitle] = useState('');
    const [selectedEventType, setSelectedEventType] = useState<string | undefined>("");
  const handleCompleteSelection = (args: {
    value: string;
    boostData?: any;
    title?: string;
  }) => {
    const {value, boostData, title: titleValue} = args || {};
    console.log('Selected value:', value);
    setSelectedEventType(value);
    setShowStartLive(true);
    setTitle(titleValue || "");
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
        <LiveStreamContainer streamEventType={selectedEventType || 'default'   } streamTitle={title || 'default'} />
      )}
    </SafeAreaView>
  );
};

export default SwitcherContainer;
