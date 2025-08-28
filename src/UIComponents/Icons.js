import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

// Settings Screen Icons
const ChevronBackIcon = (props) => {
  return <Ionicons name="chevron-back" {...props} />;
}

const ChevronForwardIcon = (props) => {
  return <Ionicons name="chevron-forward" {...props} />;
}

const MailIcon = (props) => {
  return <Ionicons name="mail" {...props} />;
}

const MailOutlineIcon = (props) => {
  return <Ionicons name="mail-outline" {...props} />;
}

const NotificationsIcon = (props) => {
  return <Ionicons name="notifications" {...props} />;
}

const ShieldCheckmarkIcon = (props) => {
  return <Ionicons name="shield-checkmark" {...props} />;
}

const PersonIcon = (props) => {
  return <Ionicons name="person" {...props} />;
}

const CheckmarkIcon = (props) => {
  return <Ionicons name="checkmark" {...props} />;
}

const BanIcon = (props) => {
  return <Ionicons name="ban" {...props} />;
}

const InformationCircleIcon = (props) => {
  return <Ionicons name="information-circle" {...props} />;
}

const BulbIcon = (props) => {
  return <Ionicons name="bulb" {...props} />;
}

const VideocamIcon = (props) => {
  return <Ionicons name="videocam" {...props} />;
}

const RecordingIcon = (props) => {
  return <Ionicons name="recording" {...props} />;
}

const PasswordIcons = ({name, ...rest}) => {
  return <Ionicons name={name} {...rest} />
}

const RadioIcon = (props) => {
  return <Ionicons name="radio" {...props} />;
}

const PersonAddIcon = (props) => {
  return <Ionicons name="person-add" {...props} />;
}

function ChatbubbleIcon(props) {
  return <Ionicons name="chatbubble" {...props} />;
}

const EventsIcon = (props) => {
  return <MaterialCommunityIcons name="calendar-star" {...props} />;
}

const CommonMaterialCommunityIcons = (props) => {
  return <MaterialCommunityIcons name={props.name} {...props} />;
}

const CommonMaterialIcons = (props)=> {
return <MaterialIcons name={props.name} {...props} />
}

// Live Stream Icons
const CameraIcon = (props) => {
  return <Ionicons name="camera" {...props} />;
}

const CameraReverseIcon = (props) => {
  return <Ionicons name="camera-reverse" {...props} />;
}

const MicrophoneIcon = (props) => {
  return <Ionicons name="mic" {...props} />;
}

const MicrophoneSlashIcon = (props) => {
  return <Ionicons name="mic-off" {...props} />;
}

const PlayIcon = (props) => {
  return <Ionicons name="play" {...props} />;
}

const StopIcon = (props) => {
  return <Ionicons name="stop" {...props} />;
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
  // Settings Screen Icons
  ChevronBackIcon,
  ChevronForwardIcon,
  MailIcon,
  MailOutlineIcon,
  NotificationsIcon,
  ShieldCheckmarkIcon,
  PersonIcon,
  CheckmarkIcon,
  BanIcon,
  InformationCircleIcon,
  BulbIcon,
  VideocamIcon,
  RecordingIcon,
  PasswordIcons,
  RadioIcon,
  PersonAddIcon,
  ChatbubbleIcon,
  EventsIcon,
  CommonMaterialCommunityIcons,
  CommonMaterialIcons,
  // Live Stream Icons
  CameraIcon,
  CameraReverseIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PlayIcon,
  StopIcon,
};
