import { useNavigate } from "react-router";

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <html>
      <main className="page-container text-center">
        <div className="page-content">
          <p className="text-base font-semibold text-indigo-500">404</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
            Stránka nenalezena
          </h1>
          <p className="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
            Omlouváme se, ale stránku, kterou hledáte, jsme nenašli.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button onClick={() => navigate(-1)} className="primary-button">
              Jít zpět
            </button>
            <a href="#" className="text-sm font-semibold text-gray-700">
              Contact support <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </main>
    </html>
  )
}

export default PageNotFound;