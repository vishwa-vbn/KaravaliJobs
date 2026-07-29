/**
 * Color utility helpers for semantic tag/badge generation.
 * Maps job types, categories, and statuses to CSS class names.
 */

// ─── Job Type ──────────────────────────────────────────────────────────────

const JOB_TYPE_CLASS_MAP: Record<string, string> = {
  'Permanent': 'tag-type-permanent',
  'Part-time': 'tag-type-parttime',
  'Remote': 'tag-type-remote',
  'Contract': 'tag-type-contract',
};

export function getJobTypeTagClass(jobType: string): string {
  return JOB_TYPE_CLASS_MAP[jobType] ?? 'tag';
}

// ─── Category ──────────────────────────────────────────────────────────────

const CATEGORY_CLASS_MAP: Record<string, string> = {
  'IT & Software': 'tag-cat-it',
  'Sales & Marketing': 'tag-cat-sales',
  'Finance & Accounts': 'tag-cat-finance',
  'Healthcare': 'tag-cat-health',
  'Office Admin': 'tag-cat-admin',
  'Hospitality': 'tag-cat-hospitality',
  'Retail': 'tag-cat-retail',
  'Education': 'tag-cat-education',
  'Other': 'tag-cat-other',
};

export function getCategoryTagClass(category: string): string {
  return CATEGORY_CLASS_MAP[category] ?? 'tag';
}

// ─── Category active filter button class ──────────────────────────────────

const CATEGORY_BTN_ACTIVE_MAP: Record<string, string> = {
  '': 'cat-btn-active-all',
  'IT & Software': 'cat-btn-active-it',
  'Sales & Marketing': 'cat-btn-active-sales',
  'Finance & Accounts': 'cat-btn-active-finance',
  'Healthcare': 'cat-btn-active-health',
  'Office Admin': 'cat-btn-active-admin',
  'Hospitality': 'cat-btn-active-hospitality',
  'Retail': 'cat-btn-active-retail',
  'Education': 'cat-btn-active-education',
  'Other': 'cat-btn-active-other',
};

export function getCategoryBtnClass(cat: string, activeCategory: string): string {
  const isActive = cat === activeCategory || (cat === '' && !activeCategory);
  if (isActive) {
    return `cat-btn ${CATEGORY_BTN_ACTIVE_MAP[cat] ?? 'cat-btn-active-other'}`;
  }
  return 'cat-btn cat-btn-inactive';
}

// ─── Role Badge ────────────────────────────────────────────────────────────

export function getRoleBadgeClass(role: string): string {
  if (role === 'seeker') return 'badge-role-seeker';
  if (role === 'provider') return 'badge-role-provider';
  if (role === 'super_admin') return 'badge-role-admin';
  return 'tag';
}

// ─── Admin module icon container colors ───────────────────────────────────

export const ADMIN_MODULE_COLORS = [
  { iconBg: 'bg-amber-50', iconText: 'text-amber-600' },   // moderation
  { iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },  // users
  { iconBg: 'bg-teal-50', iconText: 'text-teal-600' },     // broadcast
  { iconBg: 'bg-violet-50', iconText: 'text-violet-600' },  // ads
];
