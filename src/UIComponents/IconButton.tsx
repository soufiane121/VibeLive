import React, {ReactNode} from 'react';
import {GestureResponderEvent, Pressable} from 'react-native';

interface Props {
  children: ReactNode;
  onPress: (event: GestureResponderEvent) => void;
  styles: string;
}

const IconButton: React.FC<Props> = props => {
  const {children, onPress, styles} = props;
  return (
    <Pressable onPress={onPress} className={styles}>
      {children}
    </Pressable>
  );
};

export {IconButton};
