'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit, startAfter, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useUI } from '@/components/ui/UIContext';

function RoleDropdown({
  currentRole,
  disabled,
  onChange,
}: {
  currentRole: 'seeker' | 'provider' | 'super_admin';
  disabled: boolean;
  onChange: (newRole: 'seeker' | 'provider' | 'super_admin') => void;
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

  const roles = [
    { value: 'seeker', label: 'Seeker', desc: 'Job seeker searching for listings', color: 'text-indigo-700 bg-indigo-50/50 border-indigo-200' },
    { value: 'provider', label: 'Provider', desc: 'Employer posting job listings', color: 'text-emerald-700 bg-emerald-50/50 border-emerald-200' },
    { value: 'super_admin', label: 'Super Admin', desc: 'Console administrator access', color: 'text-amber-700 bg-amber-50/50 border-amber-200' },
  ] as const;

  const current = roles.find((r) => r.value === currentRole) || roles[0];

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold uppercase tracking-wider transition-all select-none focus:outline-none cursor-pointer ${
          current.color
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm hover:bg-neutral-50'}`}
      >
        <span className="truncate">{current.label}</span>
        <svg className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white border border-neutral-200 shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => {
                onChange(role.value);
                setIsOpen(false);
              }}
              className="w-full flex flex-col items-start px-3.5 py-2 text-left hover:bg-neutral-50 transition-colors duration-150 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${role.color}`}>
                  {role.label}
                </span>
                {currentRole === role.value && (
                  <svg className="w-4 h-4 text-neutral-800 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[10px] text-neutral-400 font-medium mt-1 leading-normal">{role.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'seeker' | 'provider' | 'super_admin';
  onboarded: boolean;
  status?: 'active' | 'suspended';
}

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const { confirm, showAlert, toast } = useUI();

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  async function loadUsers(firstPage = true) {
    if (firstPage) {
      setLoading(true);
      lastDocRef.current = null;
    } else {
      setLoadingMore(true);
    }

    try {
      const usersRef = collection(db, 'users');
      // Sort by email (or displayName) for standard paginated directory order
      let q = query(
        usersRef,
        orderBy('email'),
        limit(PAGE_SIZE + 1)
      );

      if (!firstPage && lastDocRef.current) {
        q = query(
          usersRef,
          orderBy('email'),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE + 1)
        );
      }

      const snap = await getDocs(q);
      const docs = snap.docs;

      const reachedEnd = docs.length <= PAGE_SIZE;
      const pageDocs = reachedEnd ? docs : docs.slice(0, PAGE_SIZE);

      const fetched: UserProfile[] = pageDocs.map((docSnap) => ({
        uid: docSnap.id,
        ...docSnap.data()
      }) as UserProfile);

      lastDocRef.current = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;
      setHasMore(!reachedEnd);

      if (firstPage) {
        setUsers(fetched);
      } else {
        setUsers((prev) => [...prev, ...fetched]);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadUsers(true);
  }, []);

  const handleRoleChange = async (uid: string, newRole: 'seeker' | 'provider' | 'super_admin') => {
    const ok = await confirm(
      'Change User Role',
      `Are you sure you want to change this user's role to ${newRole}?`,
      { confirmLabel: 'Change Role', type: 'warning' }
    );
    if (!ok) return;
    setUpdatingUid(uid);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      toast('User role updated successfully!', 'success');
      await loadUsers(true);
    } catch (err) {
      console.error('Failed to update user role:', err);
      showAlert('Operation Failed', 'Error updating role. Check permissions.');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleStatusToggle = async (uid: string, currentStatus?: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const ok = await confirm(
      nextStatus === 'suspended' ? 'Suspend User' : 'Activate User',
      `Are you sure you want to change this user's status to ${nextStatus}?`,
      { confirmLabel: nextStatus === 'suspended' ? 'Suspend' : 'Activate', type: nextStatus === 'suspended' ? 'danger' : 'info' }
    );
    if (!ok) return;
    setUpdatingUid(uid);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { status: nextStatus });
      toast(`User status changed to ${nextStatus}.`, 'info');
      await loadUsers(true);
    } catch (err) {
      console.error('Failed to update user status:', err);
      showAlert('Operation Failed', 'Error updating status.');
    } finally {
      setUpdatingUid(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.uid.toLowerCase().includes(search)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow">
        {/* Page header */}
        <div className="border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2">
                <Link href="/admin" className="hover:text-black transition-colors">Admin Console</Link>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-neutral-600">User Management</span>
              </div>
              <h1 className="text-xl font-bold text-black">User Directory</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Search users, modify roles, and suspend or activate accounts.</p>
            </div>
            <button onClick={() => loadUsers(true)} className="btn-secondary text-xs flex-shrink-0">
              Refresh Users
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Search bar */}
          <div className="relative mb-6">
            <svg className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search loaded users by name, email, or UID..."
              className="w-full rounded-lg border border-neutral-200 pl-9 pr-3 py-2 text-xs text-black focus:border-black focus:outline-none transition-colors"
            />
          </div>

          {/* Directory list */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b border-neutral-100 py-5 animate-pulse">
                  <div className="h-4 bg-neutral-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-neutral-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div>
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 py-2 border-b border-neutral-200 mb-1">
                <div className="col-span-5 text-label text-neutral-400">User Profile</div>
                <div className="col-span-3 text-label text-neutral-400">Role</div>
                <div className="col-span-2 text-label text-neutral-400">Status</div>
                <div className="col-span-2 text-label text-neutral-400 text-right">Actions</div>
              </div>

              {/* Rows */}
              {filteredUsers.map((u) => {
                const isBanned = u.status === 'suspended';
                return (
                  <div
                    key={u.uid}
                    className="grid grid-cols-12 gap-4 py-4 border-b border-neutral-100 items-center hover:bg-neutral-50 -mx-2 px-2 rounded transition-colors"
                  >
                    {/* User Profile */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full object-cover border border-neutral-200 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-neutral-200">
                          {u.displayName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-black truncate">{u.displayName || 'User'}</div>
                        <div className="text-xs text-neutral-500 truncate">{u.email}</div>
                      </div>
                    </div>

                    {/* Role selector */}
                    <div className="col-span-3">
                      <RoleDropdown
                          currentRole={u.role}
                          disabled={updatingUid === u.uid}
                          onChange={(newRole) => handleRoleChange(u.uid, newRole)}
                      />
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        isBanned
                          ? 'text-red-700 bg-red-50 border border-red-200'
                          : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      }`}>
                        {isBanned ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                            Suspended
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Active
                          </>
                        )}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => handleStatusToggle(u.uid, u.status)}
                        disabled={updatingUid === u.uid}
                        className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                          isBanned
                            ? 'text-emerald-600 hover:text-emerald-800'
                            : 'text-red-500 hover:text-red-700'
                        }`}
                      >
                        {isBanned ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Activate
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Suspend
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-6">
                  <button
                    onClick={() => loadUsers(false)}
                    disabled={loadingMore}
                    className="btn-secondary text-xs"
                  >
                    {loadingMore ? 'Loading next page...' : 'Load More Users'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-neutral-200 rounded-lg">
              <p className="text-sm text-neutral-400">No users found.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
