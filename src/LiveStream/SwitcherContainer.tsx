import {View, Text, SafeAreaView} from 'react-native';
import React, {useState} from 'react';
import EventSelections from './EventSelections';
import LiveStreamContainer from './LiveStreamContainer';

const SwitcherContainer = () => {
  const [showStartLive, setShowStartLive] = useState(false);
  const [title, setTitle] = useState('');
    const [selectedEventType, setSelectedEventType] = useState<string | undefined>("");
  const handleCompleteSelection = (value: string) => {
    console.log('Selected value:', value);
    setSelectedEventType(value);
    setShowStartLive(true);
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
        <LiveStreamContainer streamEventType={selectedEventType} streamTitle={title} />
      )}
    </SafeAreaView>
  );
};

export default SwitcherContainer;
