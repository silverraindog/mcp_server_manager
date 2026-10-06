import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'loading';
  title: string;
  message?: string;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  updateToast: (id: string, toast: Partial<ToastMessage>) => void;
  removeToast: (id: string) => void;
  notifyDeployment: (serverName: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      if (toast.type !== 'loading') {
        setTimeout(() => {
          removeToast(id);
        }, 4500);
      }
      return id;
    },
    [removeToast]
  );

  const updateToast = useCallback(
    (id: string, updated: Partial<ToastMessage>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
      );

      if (updated.type && updated.type !== 'loading') {
        setTimeout(() => {
          removeToast(id);
        }, 4500);
      }
    },
    [removeToast]
  );

  const notifyDeployment = useCallback(
    async (serverName: string): Promise<boolean> => {
      const id = addToast({
        type: 'loading',
        title: 'Deployment Started',
        message: `Building Docker image and launching ${serverName}...`,
      });

      await new Promise((res) => setTimeout(res, 2000));

      // 85% success rate for simulation
      const isSuccess = Math.random() > 0.15;

      if (isSuccess) {
        updateToast(id, {
          type: 'success',
          title: 'Deployment Succeeded',
          message: `${serverName} container is active and responding on port ${Math.floor(
            8080 + Math.random() * 50
          )}.`,
        });
        return true;
      } else {
        updateToast(id, {
          type: 'error',
          title: 'Deployment Failed',
          message: `Failed to deploy ${serverName}: Container build process exited with code 1.`,
        });
        return false;
      }
    },
    [addToast, updateToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, updateToast, removeToast, notifyDeployment }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border transition-all duration-200 text-sm ${
              toast.type === 'success'
                ? 'bg-slate-900 text-emerald-300 border-emerald-500/40 shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'bg-slate-900 text-red-300 border-red-500/40 shadow-red-950/20'
                : toast.type === 'loading'
                ? 'bg-slate-900 text-amber-300 border-amber-500/40 shadow-slate-950/30'
                : 'bg-slate-900 text-slate-200 border-slate-700 shadow-slate-950/30'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            {toast.type === 'loading' && (
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-xs tracking-wider uppercase opacity-90">
                {toast.title}
              </h4>
              {toast.message && <p className="text-xs opacity-80 mt-1 leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
