import React, {useEffect, useState, useRef} from 'react';
import {StyleSheet, Image, View, Animated} from 'react-native';
import {MarkerView} from '@rnmapbox/maps';

export const FloatingEmoji = ({emoji, coordinates, mapRef, onComplete}) => {
  const positionY = useRef(new Animated.Value(0)).current;
  const positionX = useRef(new Animated.Value(0)).current; // For horizontal movement
  const opacity = useRef(new Animated.Value(1)).current; 

  useEffect(() => {
    const randomStartX = Math.random() * -10 + 10; // Random start position
    const randomEndX = Math.random() * 3 + 10; // Random end position

    positionX.setValue(randomStartX); // Set the initial horizontal position

    Animated.parallel([
      Animated.timing(positionY, {
        toValue: -70, // Moves the emoji up
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0, // Fades out the emoji
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(positionX, {
        toValue: randomEndX, // Animates the emoji horizontally
        duration: 3000,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, []);

  return (
      <Animated.Image
        source={emoji} // Ensure emoji is a valid image URI or require
        style={[
          styles.emoji,
          {
            transform: [
              {translateY: positionY},
              {translateX: positionX}, // Apply the horizontal movement
            ],
            opacity,
          },
        ]}
      />
  );
};

const styles = StyleSheet.create({
  emoji: {
    // position:'relative' ,
    width: 20, // Adjusted the size for visibility
    height: 20, // Adjusted the size for visibility
    zIndex: 1, // Ensure it's rendered above other elements
  },
});
