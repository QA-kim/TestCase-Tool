import { AlertCircle, X } from 'lucide-react'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
}

export default function ErrorModal({ isOpen, onClose, title = '오류', message }: ErrorModalProps) {
  if (!isOpen) return null

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent closing when clicking the background
    e.stopPropagation()
  }

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent event from bubbling to background
    e.stopPropagation()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackgroundClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6 ml-13">
          <p className="text-gray-700 whitespace-pre-line">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
