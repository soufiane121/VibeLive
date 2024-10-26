import {TouchableOpacity, Text, GestureResponderEvent} from 'react-native';

type Props = {
  btnText: string;
  btnStyle?: string;
  textStyle?: string;
  onPress: (e: GestureResponderEvent) => void;
};

const Button = (props: Props) => {
  const {btnText, btnStyle, textStyle, onPress} = props;
  return (
    <TouchableOpacity className={btnStyle} onPress={onPress}>
      <Text className={textStyle}>{btnText}</Text>
    </TouchableOpacity>
  );
};

export default Button;
