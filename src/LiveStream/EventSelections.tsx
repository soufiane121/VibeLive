import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import React from 'react';

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
}

const EventSelections = ({onCompleteSelection}: EventSelectionsProps) => {
  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{
          padding: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
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
              backgroundColor: '#393E46',
              borderRadius: 50,
              borderWidth: 1,
              borderColor: '#affff',
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
    backgroundColor: '#393E46',
    height: '100%',
  },
  text: {
    fontSize: 18,
    // fontWeight: 'bold',
  },
});

export default EventSelections;
