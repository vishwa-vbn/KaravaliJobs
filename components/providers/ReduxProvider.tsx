'use client';

import { store } from '@/lib/redux/store';
import { Provider } from 'react-redux';

// Redux Provider wrapper — must be a Client Component
// Wraps the entire tree so Server Components can still exist as children
export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
