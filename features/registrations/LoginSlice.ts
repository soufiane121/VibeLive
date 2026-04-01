import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

export interface LoginState {
  email: string;
  password: string;
}

const initialState: LoginState = {
  email: '',
  password: '',
};

export const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    test: (state, action: PayloadAction<LoginState>) => {
      //   state.value += action.payload;
      state.email = action.payload.email;
      state.password = action.payload.password;
    },
  },
});

// Action creators are generated for each case reducer function
export const {test} = loginSlice.actions;

export default loginSlice.reducer;
