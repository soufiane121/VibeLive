import { liveStream } from './LiveStream';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
interface LiveStreamState {
    liveStreamData: {
        id: string;
        emoji: string;  
        followerId?: string;
    };
}

const initialState: LiveStreamState = {
    liveStreamData: {
        id: '',
        emoji: '',
        followerId: ''
    }
};

export const LiveStreamSlice = createSlice({
  name: 'liveStreamSlice',
  initialState,
  reducers: {
    addReaction: (state, action: PayloadAction<{id: string, emoji: string}>) => {
      state.liveStreamData = action.payload;
    },
    clearReactions: state => {
      state.liveStreamData = {emoji: '', id: ''};
    },
    addFollow: (state, action: PayloadAction<{id: string, emoji: string}>) => {
      state.liveStreamData = action.payload;
    }
  },
});

export const { addReaction, clearReactions } = LiveStreamSlice.actions;

export default LiveStreamSlice.reducer;