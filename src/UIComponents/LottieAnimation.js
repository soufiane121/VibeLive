import React from 'react';
import LottieView from 'lottie-react-native';

const LottieAnimation = ({source, style}) => {
  return <LottieView source={source} style={style} autoPlay loop />;
};

export default LottieAnimation;
