'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLocation, setJobType, setCategory, setSearch, resetFilters } from '@/lib/redux/slices/filtersSlice';
import type { RootState } from '@/lib/redux/store';
import { getCategoryBtnClass } from '@/lib/utils/colorUtils';

function FilterDropdown({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: React.ReactNode;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left h-full flex items-center border-r border-slate-200" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer select-none h-full outline-none focus:outline-none"
      >
        {label}
        <span className="truncate max-w-28 text-slate-900 font-bold">{value || placeholder}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-12 w-48 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {placeholder}
            {value === '' && (
              <svg className="w-3.5 h-3.5 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="h-px bg-slate-100 my-1" />
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {opt}
              {value === opt && (
                <svg className="w-3.5 h-3.5 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function JobFilterBar() {
  const dispatch = useDispatch();
  const reduxFilters = useSelector((state: RootState) => state.filters);

  const [localSearch, setLocalSearch] = useState(reduxFilters.search);
  const [localLocation, setLocalLocation] = useState(reduxFilters.location);
  const [localJobType, setLocalJobType] = useState(reduxFilters.jobType);
  const [localCategory, setLocalCategory] = useState(reduxFilters.category);

  useEffect(() => {
    setLocalSearch(reduxFilters.search);
    setLocalLocation(reduxFilters.location);
    setLocalJobType(reduxFilters.jobType);
    setLocalCategory(reduxFilters.category);
  }, [reduxFilters]);

  const locations = ['Mangalore', 'Udupi', 'Remote'];
  const jobTypes = ['Part-time', 'Permanent', 'Remote', 'Contract'];
  const categories = [
    'IT & Software',
    'Sales & Marketing',
    'Finance & Accounts',
    'Healthcare',
    'Office Admin',
    'Hospitality',
    'Retail',
    'Education',
    'Other',
  ];

  const handleSearchSubmit = () => {
    dispatch(setSearch(localSearch));
    dispatch(setLocation(localLocation));
    dispatch(setJobType(localJobType));
    dispatch(setCategory(localCategory));
  };

  const handleReset = () => {
    setLocalSearch('');
    setLocalLocation('' as any);
    setLocalJobType('' as any);
    setLocalCategory('' as any);
    dispatch(resetFilters());
  };

  const handleCategorySelect = (cat: string) => {
    const next = cat as any;
    setLocalCategory(next);
    dispatch(setCategory(next));
  };

  const hasActiveFilters =
    reduxFilters.search ||
    reduxFilters.location ||
    reduxFilters.jobType ||
    reduxFilters.category;

  return (
    <div className="filter-bar">
      {/* Search row */}
      <div className="flex items-center gap-0" style={{ minHeight: '48px' }}>
        {/* Keyword */}
        <div className="flex-1 flex items-center gap-2.5 px-4 border-r border-slate-200">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            placeholder="Job title, keyword, or company..."
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 bg-transparent border-none outline-none"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Location */}
        <FilterDropdown
          label={
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          value={localLocation}
          options={locations}
          placeholder="All Locations"
          onChange={(val) => {
            setLocalLocation(val as any);
            dispatch(setLocation(val as any));
          }}
        />

        {/* Job Type */}
        <FilterDropdown
          label={
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          value={localJobType}
          options={jobTypes}
          placeholder="All Types"
          onChange={(val) => {
            setLocalJobType(val as any);
            dispatch(setJobType(val as any));
          }}
        />

        {/* Search button */}
        <button
          onClick={handleSearchSubmit}
          className="filter-search-btn"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>

      {/* Category row — fixed label + horizontally scrollable chips */}
      <div className="border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center">
          {/* Fixed "Category" label — never scrolls */}
          <span className="text-label text-slate-400 flex-shrink-0 pl-4 pr-3 py-2.5 border-r border-slate-100">
            Category
          </span>

          {/* Scrollable chips area */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto flex-1 min-w-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={() => handleCategorySelect('')}
              className={`${getCategoryBtnClass('', localCategory)} flex-shrink-0`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`${getCategoryBtnClass(cat, localCategory)} flex-shrink-0`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Clear all — pinned to the right, outside scroll area */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-[11px] text-slate-400 hover:text-red-500 transition-colors cursor-pointer px-4 py-2.5 flex-shrink-0 font-medium border-l border-slate-100"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
