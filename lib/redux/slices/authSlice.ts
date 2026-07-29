// authSlice — client-side mirror of the Firebase Auth session
// Real security enforcement is in firestore.rules (Admin SDK bypasses rules for role changes)
// Role is set to "seeker" on first sign-in; becomes "provider" when first job is posted
// "super_admin" is set manually in Firestore Console, never self-assignable
// See SKILLS.md §Authentication & Roles
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UserRole = 'seeker' | 'provider' | 'super_admin';

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  onboarded: boolean;
  companyName?: string | null;
  providerType?: 'company' | 'individual' | null;
  hasJoinedTelegram?: boolean;
}

interface AuthState {
  // null = not signed in OR auth not yet initialised
  user: AuthUser | null;
  // true while Firebase onAuthStateChanged has not yet fired for the first time
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.loading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    clearUser(state) {
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setUser, setLoading, clearUser } = authSlice.actions;
export default authSlice.reducer;
