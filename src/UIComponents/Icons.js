import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

const HappyFaceEmojiIcon = (props)=> {
  return <MaterialIcons name="emoji-emotions" {...props} />;
}

const SettingsIcon = (props)=> {
  return <Feather name="settings" {...props} />;
}
const ProfileIcon = (props)=> {
  return <MaterialDesignIcons name="account-outline" {...props} />;
}

export {
  mapIcon,
  LocationIcon,
  LiveStreamIcon,
  EyeViewsIcon,
  CloseIcon,
  SendIcon,
  HappyFaceEmojiIcon,
  SettingsIcon,
  ProfileIcon,
};
