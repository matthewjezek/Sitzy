import { useNavigate } from 'react-router'
import { FiAlertTriangle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi'

interface ErrorViewProps {
  message?: string | null
  title?: string
  onRetry?: () => void
  onBack?: () => void
}

export default function ErrorView({
  message,
  title = 'Chyba při načítání dat',
  onRetry,
  onBack,
}: ErrorViewProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="page-container flex-col pt-6 pb-10">
      <div className="page-content max-w-md mx-auto p-4 flex flex-col gap-6">
        <div className="card p-6 flex flex-col items-center text-center gap-4 error-card">
          <div className="error-card-icon-wrapper">
            <FiAlertTriangle size={32} />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="error-card-title">{title}</h2>
            <p className="error-card-message">
              {message || 'Nastala neočekávaná chyba.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 button-primary flex items-center justify-center gap-2 h-11"
              >
                <FiRefreshCw size={16} />
                <span>Zkusit znovu</span>
              </button>
            )}
            <button
              onClick={handleBack}
              className="flex-1 button-secondary flex items-center justify-center gap-2 h-11"
            >
              <FiArrowLeft size={16} />
              <span>Odejít</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
