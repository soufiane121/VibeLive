import {TouchableOpacity, Text, GestureResponderEvent} from 'react-native';

type Props = {
  btnText: string;
  btnStyle?: string;
  textStyle?: string;
  onPress: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  children?: React.JSX.Element;
};

const Button = (props: Props) => {
  const {btnText, btnStyle, textStyle, onPress, disabled, children} = props;
  return (
    <TouchableOpacity
      className={btnStyle}
      onPress={onPress}
      disabled={disabled}>
      {!disabled && <Text className={textStyle}>{btnText}</Text>}
      {disabled && children}
    </TouchableOpacity>
  );
};

export default Button;
