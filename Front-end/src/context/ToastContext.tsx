import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Toast, { type ToastData } from '../components/Toast'

interface ToastContextValue {
  /** Show a transient status message. A second call replaces the current one. */
  showToast: (toast: Omit<ToastData, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null)
  // Monotonic id doubles as the React key: re-toasting while one is still on
  // screen remounts it, so the entrance animation replays instead of no-oping.
  const nextId = useRef(0)

  // Stable identity — AuthContext calls this from inside its own callbacks.
  const showToast = useCallback((t: Omit<ToastData, 'id'>) => {
    setToast({ ...t, id: nextId.current++ })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast key={toast.id} toast={toast} onDone={() => setToast(null)} />
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
