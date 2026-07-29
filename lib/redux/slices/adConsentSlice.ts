// adConsentSlice — tracks whether the user has accepted the cookie/ad consent banner
// Ad network scripts must NOT load until hasConsented === true
// See ARCHITECTURE.md §6 and SKILLS.md §Ad Monetization
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AdConsentState {
  // null = not yet shown (initial render), false = rejected, true = accepted
  hasConsented: boolean | null;
}

const initialState: AdConsentState = {
  hasConsented: null,
};

const adConsentSlice = createSlice({
  name: 'adConsent',
  initialState,
  reducers: {
    setConsented(state, action: PayloadAction<boolean>) {
      state.hasConsented = action.payload;
    },
  },
});

export const { setConsented } = adConsentSlice.actions;
export default adConsentSlice.reducer;
