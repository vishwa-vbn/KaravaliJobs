// filtersSlice — manages homepage job feed filter state
// Drives the Firestore compound query: (status, location, jobType, createdAt DESC)
// See ARCHITECTURE.md §4 for the composite index definition
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type Location = 'Mangalore' | 'Udupi' | 'Remote' | '';
type JobType = 'Part-time' | 'Permanent' | 'Remote' | 'Contract' | '';
type Category = 'IT & Software' | 'Sales & Marketing' | 'Finance & Accounts' | 'Healthcare' | 'Office Admin' | 'Hospitality' | 'Retail' | 'Education' | 'Other' | '';

interface FiltersState {
  location: Location;
  jobType: JobType;
  category: Category;
  search: string; // client-side text filter on loaded results (not a Firestore query param)
}

const initialState: FiltersState = {
  location: '',
  jobType: '',
  category: '',
  search: '',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setLocation(state, action: PayloadAction<Location>) {
      state.location = action.payload;
    },
    setJobType(state, action: PayloadAction<JobType>) {
      state.jobType = action.payload;
    },
    setCategory(state, action: PayloadAction<Category>) {
      state.category = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    resetFilters(state) {
      state.location = '';
      state.jobType = '';
      state.category = '';
      state.search = '';
    },
  },
});

export const { setLocation, setJobType, setCategory, setSearch, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
