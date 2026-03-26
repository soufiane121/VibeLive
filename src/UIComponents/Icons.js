import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from "react-native-vector-icons/SimpleLineIcons"
import Octicons from "react-native-vector-icons/Octicons"
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
const MusicIcon = (props)=> {
return <Ionicons name="musical-notes-outline" {...props} />;
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
  return <Octicons name="person" {...props} />;
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

// Squad Mode Icons
const SquadIcon = (props) => {
  return <SimpleLineIcons name="people" {...props} />;
}

const ShareIcon = (props) => {
  return <Ionicons name="share-social" {...props} />;
}

const VetoIcon = (props) => {
  return <Ionicons name="close-circle" {...props} />;
}

const NavigateIcon = (props) => {
  return <Ionicons name="navigate" {...props} />;
}

const ClockIcon = (props)=>{
  return <Feather name="clock" {...props} />;
}
const NightLifeIcon = (props)=> {
  return <MaterialIcons  name="nightlife" {...props} />
}

const BarIcon = (props) => {
   return <MaterialIcons name="local-bar" {...props} />
}

const SportIcon = (props)=> {
  return <MaterialIcons name="sports-soccer" {...props} />
}

const FoodIcon = (props)=>{
  return <MaterialDesignIcons name="silverware-fork-knife" {...props} />;
}

const StarIcon = (props)=> {
  return <Feather name="star" {...props}/>
}
const SmileFaceIcon=(props) => {
  return <Octicons name="smiley" {...props} />;
}
const TVPlayIcon = (props)=> {
  return <MaterialDesignIcons name="television-play" {...props} />;
}
const LoungeIcon = (props)=> {
  return <MaterialDesignIcons name="sofa-outline" {...props} />
}

const StreamIcon = (props)=> {
  return <MaterialIcons name="stream" {...props} />
}



export {
  StreamIcon,
  LoungeIcon,
  TVPlayIcon,
  SmileFaceIcon,
  StarIcon,
  SportIcon,
  FoodIcon,
  BarIcon,
  MusicIcon,
  NightLifeIcon,
  ClockIcon,
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
  // Squad Mode Icons
  SquadIcon,
  ShareIcon,
  VetoIcon,
  NavigateIcon,
  // Live Stream Icons
  CameraIcon,
  CameraReverseIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PlayIcon,
  StopIcon,
};
