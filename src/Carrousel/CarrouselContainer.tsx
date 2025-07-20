import React, { useRef, useState } from 'react';
import { View, Dimensions, FlatList } from 'react-native';
import StreamPlayer from '../WatchStream/StreamPlayer';

const { width, height } = Dimensions.get('window');

// Dummy data for live streams (replace with your real data)
const liveStreams = [
  {
    id: '1',
    streamId: 'mux-stream-id-1',
    userId: 'user1',
    liveDetails: { liveViewrsCount: 1200, isLive: true },
    coordinates: [-80.856917, 35.225859],
  },
  {
    id: '2',
    streamId: 'mux-stream-id-2',
    userId: 'user2',
    liveDetails: { liveViewrsCount: 800, isLive: true },
    coordinates: [-80.714461, 35.203287],
  },
  // Add more live streams here
];

const CarrouselContainer = () => {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <FlatList
        ref={flatListRef}
        data={liveStreams}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <StreamPlayer
              streamId={item.streamId}
              userId={item.userId}
              liveDetails={item.liveDetails}
              coordinates={item.coordinates}
            />
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      />
    </View>
  );
};

export default CarrouselContainer;