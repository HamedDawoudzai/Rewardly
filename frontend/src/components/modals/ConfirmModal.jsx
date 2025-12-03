import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reusable confirmation modal for destructive actions
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Called when modal is closed/cancelled
 * @param {function} onConfirm - Called when action is confirmed
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Delete")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} variant - "danger" | "warning" (default: "danger")
 * @param {boolean} loading - Show loading state on confirm button
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center gap-3 ${isDanger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
            {isDanger ? (
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${isDanger ? 'text-red-900 dark:text-red-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={isDanger 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-yellow-600 hover:bg-yellow-700 text-white"
            }
          >
            {loading ? "Please wait..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

