import { configureStore } from '@reduxjs/toolkit';
import filtersReducer from './slices/filtersSlice';
import adConsentReducer from './slices/adConsentSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    adConsent: adConsentReducer,
    auth: authReducer,
  },
});

// Inferred types — use these instead of importing RootState/AppDispatch from individual slice files
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
