import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function ConfirmModal({
    open,
    title,
    message,
    confirmText = "Confirm",
    confirmColor = "red",
    onConfirm,
    onCancel
  }) {
    // Disable background scroll when modal is open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden"
      } else {
        document.body.style.overflow = "unset"
      }
      
      // Cleanup on unmount
      return () => {
        document.body.style.overflow = "unset"
      }
    }, [open])
  
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onCancel}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-4 sm:p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {title}
              </h3>
    
              <p className="text-xs sm:text-sm text-gray-600">
                {message}
              </p>
    
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
    
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 rounded-lg text-white transition text-sm sm:text-base order-1 sm:order-2 ${
                    confirmColor === "yellow"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : confirmColor === "green"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
  