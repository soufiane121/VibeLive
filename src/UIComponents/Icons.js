import Icon from 'react-native-vector-icons/Feather';
import FontIcon from 'react-native-vector-icons/FontAwesome6';

const mapIcon = props => {
  return <Icon name="map" {...props} size={20} />;
};

const LocationIcon = props => {
  return (
    <FontIcon
      name="location-arrow"
      {...props}
    />
  );
};

export {mapIcon, LocationIcon};
