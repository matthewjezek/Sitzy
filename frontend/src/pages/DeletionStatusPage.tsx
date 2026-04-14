import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';

export default function DeletionStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const confirmationCode = searchParams.get('code');
  const statusParam = searchParams.get('status');
  const [status] = useState<'confirmed' | 'pending'>((statusParam as 'confirmed' | 'pending') || 'pending');

  useEffect(() => {
    // Pokud není zadán status nebo code, přesměruj na login
    if (!statusParam && !confirmationCode) {
      navigate('/login');
    }
  }, [statusParam, confirmationCode, navigate]);

  useEffect(() => {
    document.title = 'Stav smazání účtu - Sitzy';
  }, []);

  return (
    <div className="page-container flex-col py-12">
      <div className="page-content max-w-lg mx-auto p-6">
        <div className="card p-8 text-center">
          {status === 'confirmed' ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-3">Účet byl smazán</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Vaše data byla trvale odstraněna ze Sitzy podle vašeho požadavku.
              </p>
              {confirmationCode && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Potvrzovací kód:</p>
                  <code className="text-sm font-mono">{confirmationCode}</code>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Pokud si to rozmyslíte, můžete se znovu přihlásit a vytvořit nový účet.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-3">Zpracovává se...</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Váš požadavek na smazání dat je v procesu.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
