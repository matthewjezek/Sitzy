import { Link, useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { FiArrowLeft, FiCompass } from "react-icons/fi";

const PageNotFound = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    document.title = 'Sitzy - Stránka nenalezena';
    
    // GSAP entry animation
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".animate-item", {
          opacity: 0,
          y: 24,
          duration: 0.7,
          stagger: 0.12,
          ease: "power2.out",
        });
      }, containerRef.current);
      
      return () => ctx.revert();
    }
  }, []);

  return (
    <main className="page-container page-container-auth text-center not-found-bg relative">
      {/* Background subtle glowing orb */}
      <div className="not-found-bg-glow" />

      <div className="page-content max-w-lg mx-auto z-10" ref={containerRef}>
        <section className="not-found-card flex flex-col items-center">
          
          {/* Custom Animated SVG Illustration */}
          <div className="w-full max-w-[280px] mb-8 animate-item">
            <svg 
              viewBox="0 0 400 240" 
              className="w-full h-auto overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Decorative Stars / Dots */}
              <circle cx="40" cy="50" r="2" fill="var(--primary-light)" opacity="0.4" />
              <circle cx="350" cy="180" r="3" fill="var(--primary)" opacity="0.3" />
              <circle cx="280" cy="30" r="2" fill="var(--primary-border)" opacity="0.5" />
              <circle cx="100" cy="90" r="1.5" fill="var(--primary-light)" opacity="0.4" />

              {/* Winding Road Background Border */}
              <path
                d="M 30 180 Q 120 180 160 120 T 300 80 T 370 130"
                fill="none"
                stroke="var(--primary-light)"
                strokeWidth="18"
                strokeLinecap="round"
                opacity="0.3"
              />
              
              {/* Winding Road Base */}
              <path
                d="M 30 180 Q 120 180 160 120 T 300 80 T 370 130"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              
              {/* Road Centerline (dashed & animated) */}
              <path
                className="animate-dash"
                d="M 30 180 Q 120 180 160 120 T 300 80 T 370 130"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
              
              {/* Pulsing ring at target location */}
              <circle
                className="animate-pulse-ring"
                cx="300"
                cy="80"
                r="18"
                fill="none"
                stroke="var(--primary-border)"
                strokeWidth="2"
              />
              
              {/* Lost Car (Rotated to match the road's slope) */}
              <g transform="translate(145, 125) rotate(-50)">
                <g transform="translate(-13, -11)">
                  {/* Car Body */}
                  <rect x="2" y="8" width="22" height="7" rx="1.5" fill="var(--primary-dark)" stroke="white" strokeWidth="1" />
                  <path d="M5 8 L7 4 H17 L19 8 Z" fill="var(--primary-light)" stroke="white" strokeWidth="1" />
                  {/* Wheels */}
                  <circle cx="7" cy="15" r="2.5" fill="#1f2937" stroke="white" strokeWidth="0.5" />
                  <circle cx="19" cy="15" r="2.5" fill="#1f2937" stroke="white" strokeWidth="0.5" />
                </g>
              </g>

              {/* Floating Map Pin (Target Point) */}
              <g className="animate-float" style={{ transformOrigin: '300px 80px' }}>
                <g transform="translate(300, 80) translate(-12, -28)">
                  <path
                    d="M12 0 C5.37 0 0 5.37 0 12 C0 21 12 28 12 28 C12 28 24 21 24 12 C24 5.37 18.63 0 12 0 Z"
                    fill="var(--primary)"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <circle cx="12" cy="12" r="4" fill="#ffffff" />
                </g>
              </g>
            </svg>
          </div>

          {/* 404 Code */}
          <div className="not-found-code animate-item">404</div>

          {/* Title */}
          <h1 className="not-found-title animate-item">
            Ztratili jste se?
          </h1>

          {/* Subtitle / Text */}
          <p className="not-found-text animate-item">
            Tato cesta nikam nevede. Stránka, kterou se snažíte najít, neexistuje nebo byla přesunuta.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full animate-item">
            <button 
              onClick={() => navigate(-1)} 
              className="w-full sm:w-auto button-primary flex items-center justify-center gap-2 h-11 px-6 shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-200 no-underline cursor-pointer"
            >
              <FiArrowLeft size={18} />
              <span>Jít zpět</span>
            </button>
            <Link 
              to="/rides" 
              className="w-full sm:w-auto button-secondary flex items-center justify-center gap-2 h-11 px-6 shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-200 no-underline cursor-pointer"
            >
              <FiCompass size={18} />
              <span>Zpět na jízdy</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PageNotFound;