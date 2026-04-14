import { Link, useNavigate } from "react-router";
import { useEffect } from "react";

const PageNotFound = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = 'Sitzy - Stránka nenalezena';
  }, []);

  return (
    <main className="page-container text-center">
      <div className="page-content max-w-2xl">
        <section className="not-found-card">
          <p className="not-found-code">404</p>
          <h1 className="not-found-title">
            Stránka nenalezena
          </h1>
          <p className="not-found-text">
            Omlouváme se, ale stránku, kterou hledáte, se nepodařilo najít.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button onClick={() => navigate(-1)} className="button-primary">
              Jít zpět
            </button>
            <Link to="/rides" className="not-found-link">
              Přejít na jízdy <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default PageNotFound;