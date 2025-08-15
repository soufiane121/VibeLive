import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

const ChatbubbleIcon = (props)=> {
  return <Ionicons name="chatbubble" {...props} />;
}

// Ad Creation Icons
const PlusIcon = (props) => {
  return <Ionicons name="add" {...props} />;
}

const SparklesIcon = (props) => {
  return <Ionicons name="sparkles" {...props} />;
}

const TrendingUpIcon = (props) => {
  return <Ionicons name="trending-up" {...props} />;
}

const CreditCardIcon = (props) => {
  return <Ionicons name="card" {...props} />;
}

const CheckmarkCircleIcon = (props) => {
  return <Ionicons name="checkmark-circle" {...props} />;
}

const ShareIcon = (props) => {
  return <Ionicons name="share" {...props} />;
}

const CalendarIcon = (props) => {
  return <Ionicons name="calendar" {...props} />;
}

const MapIcon = (props) => {
  return <Ionicons name="map" {...props} />;
}

const PlayCircleIcon = (props) => {
  return <Ionicons name="play-circle" {...props} />;
}

const EditIcon = (props) => {
  return <Ionicons name="pencil" {...props} />;
}

const UploadIcon = (props) => {
  return <Ionicons name="cloud-upload" {...props} />;
}

const CameraIcon = (props) => {
  return <Ionicons name="camera" {...props} />;
}

const TargetIcon = (props) => {
  return <Ionicons name="target" {...props} />;
}

const UsersIcon = (props) => {
  return <Ionicons name="people" {...props} />;
}

const DollarSignIcon = (props) => {
  return <Ionicons name="cash" {...props} />;
}

const ClockIcon = (props) => {
  return <Ionicons name="time" {...props} />;
}

const EyeIcon = (props) => {
  return <Ionicons name="eye" {...props} />;
}

const MousePointerIcon = (props) => {
  return <Ionicons name="hand-left" {...props} />;
}

const PauseIcon = (props) => {
  return <Ionicons name="pause" {...props} />;
}

const PlayIcon = (props) => {
  return <Ionicons name="play" {...props} />;
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
  // Ad Creation Icons
  PlusIcon,
  SparklesIcon,
  TrendingUpIcon,
  CreditCardIcon,
  CheckmarkCircleIcon,
  ShareIcon,
  CalendarIcon,
  MapIcon,
  PlayCircleIcon,
  EditIcon,
  UploadIcon,
  CameraIcon,
  TargetIcon,
  UsersIcon,
  DollarSignIcon,
  ClockIcon,
  EyeIcon,
  MousePointerIcon,
  PauseIcon,
  PlayIcon,
};
