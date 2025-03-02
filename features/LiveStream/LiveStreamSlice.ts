import { liveStream } from './LiveStream';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
interface LiveStreamState {
    liveStreamData: {
        id: string;
        emoji: string;  
    };
}

const initialState: LiveStreamState = {
    liveStreamData: {
        id: '',
        emoji: ''
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
  },
});

export const { addReaction, clearReactions } = LiveStreamSlice.actions;

export default LiveStreamSlice.reducer;