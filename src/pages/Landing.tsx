import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing min-vh-100 d-flex flex-column">
      {/* NAV */}
      <header className="landing-nav">
        <div className="container-xxl py-3 d-flex align-items-center justify-content-between">
          <Link to="/" className="navbar-brand fw-semibold text-decoration-none">
            MindTrack <span className="text-primary">Campus</span>
          </Link>
          <div className="d-flex align-items-center gap-2">
            <Link to="login" className="btn btn-outline-primary btn-pill">Iniciar sesión</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="landing-hero position-relative">
        <div className="blob-1"></div>
        <div className="blob-2"></div>

        <div className="container-xxl py-5 position-relative">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-6">
              <span className="badge badge-soft mb-3">Evaluaciones con IA</span>
              <h1 className="display-6 fw-bold mb-3">
                Bienestar mental para estudiantes en prácticas,
                <span className="text-primary"> con ciencia y empatía</span>.
              </h1>
              <p className="lead text-muted-2 mb-4">
                Monitorea tu estrés, ansiedad y estado de ánimo con instrumentos validados (DASS-21, PSS-10),
                modelos de <strong>machine learning</strong> y orientación profesional.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="login" className="btn btn-primary btn-lg btn-pill">Comenzar ahora</Link>
                <a href="#features" className="btn btn-outline-secondary btn-pill">Ver cómo funciona</a>
              </div>
              <div className="d-flex gap-3 mt-4 small text-muted-2">
                <div><i className="bi bi-shield-check me-1"></i>Datos protegidos</div>
                <div><i className="bi bi-graph-up-arrow me-1"></i>Seguimiento de progreso</div>
                <div><i className="bi bi-people me-1"></i>Psicólogos acreditados</div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="hero-visual card card-elevated rounded-4 p-3">
                {/* Ilustración simple SVG (puedes reemplazar por una imagen) */}
                <svg viewBox="0 0 600 360" width="100%" height="100%" role="img" aria-label="Ilustración">
                  <defs>
                    <linearGradient id="g1" x1="0" x2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="600" height="360" fill="url(#g1)" opacity="0.12"/>
                  <g transform="translate(60,50)">
                    <rect x="0" y="0" width="480" height="260" rx="14" fill="#fff" />
                    <rect x="24" y="30" width="200" height="16" rx="8" fill="#c7d2fe"/>
                    <rect x="24" y="60" width="350" height="10" rx="5" fill="#e5e7eb"/>
                    <rect x="24" y="80" width="320" height="10" rx="5" fill="#e5e7eb"/>
                    <polyline points="24,190 90,170 150,180 210,145 270,155 330,130 390,140 450,110" fill="none" stroke="#3b82f6" strokeWidth="3"/>
                    <polyline points="24,210 90,200 150,205 210,185 270,195 330,172 390,178 450,160" fill="none" stroke="#22c55e" strokeWidth="3"/>
                    <circle cx="24" cy="230" r="5" fill="#3b82f6" />
                    <text x="36" y="234" fontSize="12" fill="#64748b">Bienestar</text>
                    <circle cx="114" cy="230" r="5" fill="#22c55e" />
                    <text x="126" y="234" fontSize="12" fill="#64748b">Riesgo</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-5">
        <div className="container-xxl">
          <div className="text-center mb-4">
            <h2 className="fw-semibold mb-2">¿Qué ofrece MindTrack Campus?</h2>
            <p className="text-muted-2 mb-0">Todo lo que necesitas para cuidar tu salud mental durante tus prácticas.</p>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="feature-card p-4 rounded-4 h-100">
                <div className="icon-wrap mb-3"><i className="bi bi-clipboard2-check"></i></div>
                <h3 className="h5">Evaluaciones validadas</h3>
                <p className="text-muted-2 mb-0">DASS-21 y PSS-10 con UX clara, progreso y resultados interpretables.</p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="feature-card p-4 rounded-4 h-100">
                <div className="icon-wrap mb-3"><i className="bi bi-cpu"></i></div>
                <h3 className="h5">Machine Learning</h3>
                <p className="text-muted-2 mb-0">Modelos de riesgo y bienestar para observar tendencias y priorizar acompañamiento.</p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="feature-card p-4 rounded-4 h-100">
                <div className="icon-wrap mb-3"><i className="bi bi-chat-dots"></i></div>
                <h3 className="h5">Acompañamiento</h3>
                <p className="text-muted-2 mb-0">Sesiones con psicólogos acreditados y recomendaciones prácticas.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <Link to="login" className="btn btn-primary btn-pill">Crear cuenta / Iniciar sesión</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-4">
        <div className="container-xxl d-flex justify-content-between small text-muted-2">
          <div>© {new Date().getFullYear()} MindTrack Campus</div>
          <div className="d-flex gap-3">
            <a className="text-muted-2 text-decoration-none" href="#">Privacidad</a>
            <a className="text-muted-2 text-decoration-none" href="#">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
