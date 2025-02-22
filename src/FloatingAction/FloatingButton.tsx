// Floating Action Button Example in React Native
// Main button shows other action buttons in a half-circle when clicked

import React, {useState} from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import { emojis } from '../Utils/emojis';
import { HappyFaceEmojiIcon } from '../UIComponents/Icons';
// import {Ionicons} from '@expo/vector-icons';

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const buttons = [
    { label: 'Like', emoji: emojis.like},
    { label: 'Cheers', emoji: emojis.beer},
    { label: 'Hot', emoji: emojis.hot},
    { label: 'Music', emoji: emojis.music},
    { label: 'Angry', emoji: emojis.angery},
    { label: 'Dislike', emoji: emojis.dislike},
  ];

  return (
    <View style={{}}>
      {/* Main Floating Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#6200ea',
          borderRadius: 30,
          width: 60,
          height: 60,
          justifyContent: 'center',
          alignItems: 'center',
          
        }}
        onPress={() => setIsOpen(!isOpen)}>
        {/* <Ionicons name={isOpen ? 'close' : 'add'} size={30} color="#fff" /> */}
        <HappyFaceEmojiIcon size={30} color="#fff" />
      </TouchableOpacity>

      {/* Action Buttons - Half Circle Around Main Button */}
      {isOpen && (
        <View
          style={{
            position: 'absolute',
            bottom: 70,
            right: 10,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#6200ea',

          }}>
          {buttons.map((btn, index) => (
            <TouchableOpacity
              key={index}
              style={{
                marginBottom: 10,
                alignItems: 'center',
                backgroundColor: '#03DAC6',
                borderRadius: 30,
                padding: 10,
                width: 50,
                height: 50,
                justifyContent: 'center',
              }}>
              {/* <Ionicons name={btn.icon} size={24} color="#fff" /> */}
              <Text>{btn.emoji}</Text>
              <Text style={{color: '#fff'}}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
