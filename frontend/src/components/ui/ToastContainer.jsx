import { AnimatePresence } from "framer-motion"
import Toast from "./Toast"

export default function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 pointer-events-none max-w-sm sm:max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={() => onClose(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
