import { liveStream } from './LiveStream';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
interface LiveStreamState {
    liveStreamData: {
        id: string;
        emoji: string;  
        followerId?: string;
        _ts?: number;    // timestamp to ensure every dispatch is unique
    };
}

const initialState: LiveStreamState = {
    liveStreamData: {
        id: '',
        emoji: '',
        followerId: '',
        _ts: 0
    }
};

export const LiveStreamSlice = createSlice({
  name: 'liveStreamSlice',
  initialState,
  reducers: {
    addReaction: (state, action: PayloadAction<{id: string, emoji: string}>) => {
      // Attach a unique timestamp so consecutive identical emojis still trigger useEffect
      state.liveStreamData = { ...action.payload, _ts: Date.now() };
    },
    clearReactions: state => {
      state.liveStreamData = {emoji: '', id: '', _ts: 0};
    },
    addFollow: (state, action: PayloadAction<{id: string, emoji: string}>) => {
      state.liveStreamData = action.payload;
    }
  },
});

export const { addReaction, clearReactions } = LiveStreamSlice.actions;

export default LiveStreamSlice.reducer;