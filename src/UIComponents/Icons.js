import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';

const mapIcon = props => {
  return <Icon name="map" {...props} size={20} />;
};

const LocationIcon = props => {
  return <FontAwesome name="location-arrow" {...props} />;
};

const LiveStreamIcon = props => {
  return <AntDesign name="videocamera" {...props} />;
};

export {mapIcon, LocationIcon, LiveStreamIcon};
