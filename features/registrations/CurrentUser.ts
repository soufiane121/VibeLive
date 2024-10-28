import {WritableDraft} from './../../node_modules/immer/src/types/types-external';
// import { CurrentUser } from './CurrentUser';
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

export type CurrentUserTypes = {
    location: {
      type: string;
      coordinates: number[];
    };
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    password: string;
    createdAt: string;
};

interface CurrentUserInterface {
  currentUser: CurrentUserTypes;
}

const initialState: CurrentUserInterface = {
  currentUser: {
    location: {
      type: 'Point',
      coordinates: [],
    },
    _id: '',
    firstName: '',
    lastName: '',
    email: '',
    userName: '',
    password: '',
    createdAt: '',
  },
};

export const CurrentUser = createSlice({
  name: 'currentUser',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<CurrentUserTypes>) => {
      state.currentUser = action.payload!;
    },
  },
});

// Action creators are generated for each case reducer function
export const {setCurrentUser} = CurrentUser.actions;

export default CurrentUser.reducer;
