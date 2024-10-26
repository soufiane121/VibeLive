import {TouchableOpacity, Text, GestureResponderEvent} from 'react-native';

type Props = {
  btnText: string;
  btnStyle?: string;
  textStyle?: string;
  onPress: (e: GestureResponderEvent) => void;
  disabled?: boolean
};

const Button = (props: Props) => {
  const {btnText, btnStyle, textStyle, onPress, disabled} = props;
  return (
    <TouchableOpacity
      className={btnStyle}
      onPress={onPress}
      disabled={disabled}>
      <Text className={textStyle}>{btnText}</Text>
    </TouchableOpacity>
  );
};

export default Button;
