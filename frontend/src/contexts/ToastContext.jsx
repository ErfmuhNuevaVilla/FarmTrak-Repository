import { createContext, useContext, useState, useCallback } from "react"

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = "success", duration = 3000) => {
    const id = ++toastId
    const newToast = {
      id,
      message,
      type,
      duration,
    }

    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((message, duration) => {
    return showToast(message, "success", duration)
  }, [showToast])

  const error = useCallback((message, duration) => {
    return showToast(message, "error", duration)
  }, [showToast])

  const warning = useCallback((message, duration) => {
    return showToast(message, "warning", duration)
  }, [showToast])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        success,
        error,
        warning,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
