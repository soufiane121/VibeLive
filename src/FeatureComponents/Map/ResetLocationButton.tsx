import React from 'react';
import {IconButton} from '../../UIComponents/Buttons';
import {LocationIcon} from '../../UIComponents/Icons';
import {GestureResponderEvent} from 'react-native';

type Props = {
  onPress: (event: GestureResponderEvent) => void;
  styles: string;
  iconStyle?: {
    size?: number;
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    width?: number;
  };
};

const ResetLocationButton: React.FC<Props> = ({onPress, styles, iconStyle}) => {
  return (
    <IconButton onPress={onPress} styles={styles}>
      <LocationIcon style={iconStyle} />
    </IconButton>
  );
};

export default ResetLocationButton;
