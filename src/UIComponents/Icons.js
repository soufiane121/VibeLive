import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';

const mapIcon = props => {
  return <Icon name="map" {...props} size={20} />;
};

const LocationIcon = props => {
  return <FontAwesome name="location-arrow" {...props} />;
};

const LiveStreamIcon = props => {
  return <AntDesign name="videocamera" {...props} />;
};

const EyeViewsIcon = props => {
  return <AntDesign  name="eyeo" {...props} />
}

const CloseIcon = (props)=> {
  return <AntDesign name="close" {...props} />;
}

const SendIcon = (props)=> {
  return <Feather name="send" {...props} />;
}

export {
  mapIcon,
  LocationIcon,
  LiveStreamIcon,
  EyeViewsIcon,
  CloseIcon,
  SendIcon,
};
