import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react"

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.duration, onClose])

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="text-green-600" size={20} />
      case "error":
        return <XCircle className="text-red-600" size={20} />
      case "warning":
        return <AlertCircle className="text-yellow-600" size={20} />
      default:
        return <CheckCircle2 className="text-green-600" size={20} />
    }
  }

  const getBgColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      default:
        return "bg-green-50 border-green-200"
    }
  }

  const getTextColor = () => {
    switch (toast.type) {
      case "success":
        return "text-green-800"
      case "error":
        return "text-red-800"
      case "warning":
        return "text-yellow-800"
      default:
        return "text-green-800"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        ${getBgColor()}
        border rounded-lg shadow-lg
        px-3 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-10
        flex items-start gap-2 sm:gap-3
        w-full
        relative
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${getTextColor()}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`
          absolute top-2 right-2
          p-1 rounded
          hover:bg-black/10
          transition-colors
          ${getTextColor()}
        `}
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

export default Toast
