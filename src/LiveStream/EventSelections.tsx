import {View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput} from 'react-native';
import React, { useState } from 'react';

const eventsList = [
  {key: 'nightlife', label: 'Nightlife & Parties', emoji: '🎉'},
  {key: 'bars', label: 'Bars & Lounges', emoji: '🍸'},
  {key: 'concerts', label: 'Concerts & Music', emoji: '🎵'},
  {key: 'sports', label: 'Sports Events', emoji: '🏟️'},
  {key: 'festivals', label: 'Festivals & Fairs', emoji: '🎪'},
  {key: 'food', label: 'Food & Drink events', emoji: '🍽️'},
  {key: 'art', label: 'Art & Culture', emoji: '🎨'},
  {key: 'show', label: 'Show & Performances', emoji: '🎭'},
  {key: 'shopping', label: 'Markets & Pop-ups', emoji: '🛍️'},
];

interface EventSelectionsProps {
  onCompleteSelection: (value: string) => void;
  onTitleChange?: (title: string) => void;
}

const EventSelections = ({onCompleteSelection, onTitleChange}: EventSelectionsProps) => {
  const [title, setTitle] = useState('');

  const handleTitleChange = (text: string) => {
    if (text.length <= 60) {
      setTitle(text);
      onTitleChange && onTitleChange(text);
    }
  };
  return (
    <View
      style={styles.container}
      className="flex-1 bg-gray-900 justify-center px-8">
      <TextInput
        style={styles.titleInput}
        placeholder="Give your stream a vibe, party? chill? wild?"
        placeholderTextColor="#ccc"
        value={title}
        onChangeText={handleTitleChange}
        maxLength={60}
      />
      <FlatList
        contentContainerStyle={{
          // padding: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 25,
          marginRight: 10,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        numColumns={2}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        data={eventsList}
        renderItem={({item}) => (
          <TouchableOpacity
            style={{
              padding: 6,
              gap: 10,
              backgroundColor: 'rgba(57,62,70,0.5)',
              borderRadius: 50,
              borderWidth: 1,
              borderColor: '#CFD6DF',
            }}
            onPress={() => onCompleteSelection(item.key)}>
            <Text style={styles.text}>
              {item.emoji} {item.label}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.key}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#393E46',
    height: '100%',
  },
  text: {
    fontSize: 18,
    color: '#CFD6DF',
    // fontWeight: 'bold',
  },
  titleInput: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
    // marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(57,62,70,0.3)', // transparent background
    color: '#CFD6DF',
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 35,
    // borderColor: '#888',
  },
});

export default EventSelections;
