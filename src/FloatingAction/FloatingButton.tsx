// Floating Action Button Example in React Native
// Main button shows other action buttons in a half-circle when clicked

import React, {useState} from 'react';
import {View, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {emojis} from '../Utils/emojis';
import {HappyFaceEmojiIcon} from '../UIComponents/Icons';
// import {Ionicons} from '@expo/vector-icons';

interface Props {
  sendReactions: (reaction: string) => void;
}

const FloatingActionButton: React.FC<Props> = ({sendReactions}) => {
  const [isOpen, setIsOpen] = useState(false);

  const buttons = [
    {label: 'Like', emoji: emojis.like},
    {label: 'Beer', emoji: emojis.beer},
    {label: 'Hot', emoji: emojis.hot},
    {label: 'Music', emoji: emojis.music},
    {label: 'Boring', emoji: emojis.boring},
    {label: 'Dislike', emoji: emojis.dislike},
  ];

  return (
    <View style={{}}>
      {/* Main Floating Button */}
      <TouchableOpacity
        style={styles.containr}
        onPress={() => setIsOpen(!isOpen)}>
        <HappyFaceEmojiIcon size={30} style={styles.parentIcon} />
      </TouchableOpacity>

      {/* Action Buttons - Half Circle Around Main Button */}
      {isOpen && (
        <View style={styles.actionIconsWrapper}>
          {buttons.map((btn, index) => (
            <TouchableOpacity key={index} style={styles.actionIconsContainer} onPress={() => sendReactions(btn.label)}>   
              <Image source={btn.emoji} style={styles.img} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containr: {
    borderRadius: 30,
    width: 60,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parentIcon: {
    color: 'rgba(230, 232, 235, 0.6)',
  },
  actionIconsWrapper: {
    position: 'absolute',
    bottom: 70,
    right: 10,
    alignItems: 'center',
  },
  actionIconsContainer: {
    alignItems: 'center',
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  img: {
    width: 25,
    height: 25,
  },
});

export default FloatingActionButton;
