'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ModalConfig {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  type: 'danger' | 'info' | 'warning';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface UIContextType {
  toast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  confirm: (
    title: string,
    message: string,
    options?: { confirmLabel?: string; cancelLabel?: string; type?: 'danger' | 'info' | 'warning' }
  ) => Promise<boolean>;
  showAlert: (
    title: string,
    message: string,
    options?: { confirmLabel?: string }
  ) => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<ModalConfig | null>(null);

  const toast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const confirm = (
    title: string,
    message: string,
    options?: { confirmLabel?: string; cancelLabel?: string; type?: 'danger' | 'info' | 'warning' }
  ) => {
    return new Promise<boolean>((resolve) => {
      setModal({
        title,
        message,
        confirmLabel: options?.confirmLabel || 'Confirm',
        cancelLabel: options?.cancelLabel || 'Cancel',
        type: options?.type || 'info',
        onConfirm: () => {
          setModal(null);
          resolve(true);
        },
        onCancel: () => {
          setModal(null);
          resolve(false);
        },
      });
    });
  };

  const showAlert = (
    title: string,
    message: string,
    options?: { confirmLabel?: string }
  ) => {
    return new Promise<void>((resolve) => {
      setModal({
        title,
        message,
        confirmLabel: options?.confirmLabel || 'OK',
        type: 'info',
        onConfirm: () => {
          setModal(null);
          resolve();
        },
      });
    });
  };

  return (
    <UIContext.Provider value={{ toast, confirm, showAlert }}>
      {children}

      {/* Toast Notifications Layer */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 p-4 bg-white/95 backdrop-blur border border-slate-100 rounded-xl shadow-xl pointer-events-auto animate-slide-in"
          >
            {t.type === 'success' && (
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            )}
            {t.type === 'error' && (
              <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            {t.type === 'warning' && (
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
            {t.type === 'info' && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.083.985l-.5 1.5a.75.75 0 01-1.28.32H12a.75.75 0 00-.75.75v.006c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-2.25a.75.75 0 00-.75.75v.006c0 .414.336.75.75.75h.008zM12 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                </svg>
              </div>
            )}
            <p className="text-xs font-semibold text-slate-800 flex-grow">{t.message}</p>
          </div>
        ))}
      </div>

      {/* Modal Dialog Layer */}
      {modal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex gap-4">
              {modal.type === 'danger' && (
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              {modal.type === 'warning' && (
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              {modal.type === 'info' && (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.083.985l-.5 1.5a.75.75 0 01-1.28.32H12a.75.75 0 00-.75.75v.006c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-2.25a.75.75 0 00-.75.75v.006c0 .414.336.75.75.75h.008zM12 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                </div>
              )}
              <div className="flex-grow">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{modal.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{modal.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {modal.cancelLabel && (
                <button
                  type="button"
                  onClick={modal.onCancel}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-black rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {modal.cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={modal.onConfirm}
                className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer ${
                  modal.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : modal.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {modal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
