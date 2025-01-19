import {Text, View} from 'react-native';
import {useNavigationState} from '@react-navigation/native';

type Props = {
  streamId: string;
};

const StreamPlayer = (props: Props) => {
  const {properties} = useNavigationState(state => state.routes[1].params);
  console.log({properties});
  
  return (
    <View>
      <Text>StreamPlayer</Text>
    </View>
  );
};

export default StreamPlayer;
