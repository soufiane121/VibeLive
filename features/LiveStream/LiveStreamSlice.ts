import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Reaction {
    id: string;
    type: string;
    userId: string;
    // emoji: string;
}

interface LiveStreamState {
    reactions: Reaction[];
    emoji: string;
}

const initialState: LiveStreamState = {
    reactions: [],
    emoji: '',
};

export const LiveStreamSlice = createSlice({
    name: 'liveStreamSlice',
    initialState,
    reducers: {
        addReaction: (state, action: PayloadAction<string>) => {
            state.emoji = action.payload;
        },
        removeReaction: (state, action: PayloadAction<string>) => {
            state.reactions = state.reactions.filter(reaction => reaction.id !== action.payload);
        },
        clearReactions: (state) => {
            state.emoji = '';
        },
    },
});

export const { addReaction, removeReaction, clearReactions } = LiveStreamSlice.actions;

export default LiveStreamSlice.reducer;