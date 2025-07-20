import {View, Text, SafeAreaView} from 'react-native';
import React, {useState} from 'react';
import EventSelections from './EventSelections';
import LiveStreamContainer from './LiveStreamContainer';

const SwitcherContainer = () => {
  const [showStartLive, setShowStartLive] = useState(false);
    const [selectedEventType, setSelectedEventType] = useState<string | undefined>("");
  const handleCompleteSelection = (value: string) => {
    console.log('Selected value:', value);
    setSelectedEventType(value);
    setShowStartLive(true);
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#292929'}}>
      {!showStartLive ? (
        <EventSelections onCompleteSelection={handleCompleteSelection} />
      ) : (
        <LiveStreamContainer streamEventType={selectedEventType} />
      )}
    </SafeAreaView>
  );
};

export default SwitcherContainer;
