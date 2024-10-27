import {ActivityIndicator} from 'react-native';
import React from 'react';

interface Props {
    size: "small" | "large"
    color?: 'blue'
}
const LoadingAnimation = () => {
  return <ActivityIndicator size="large" className={'text-emerald-700'} />;
};

export default LoadingAnimation;
