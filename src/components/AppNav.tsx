import { Link, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import RoleGate from './RoleGate';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function AppNav() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const ok = window.confirm('¿Cerrar sesión?');
    if (!ok) return;
    try {
      await signOut(auth);
      nav('/login', { replace: true });
    } catch (e) {
      console.error('signOut error', e);
      alert('No se pudo cerrar sesión. Intenta de nuevo.');
    }
  }

  const initials =
    (user?.displayName?.trim()?.split(/\s+/).map(p => p[0]).slice(0,2).join('') ||
     user?.email?.[0] ||
     'U').toUpperCase();

  return (
    <nav className="navbar navbar-expand bg-white border-bottom sticky-top">
      <div className="container-xxl">
        <Link className="navbar-brand fw-semibold text-decoration-none" to="/">
          MindTrack <span className="text-primary">Campus</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen(v => !v)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/" className="nav-link">Inicio</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/evaluate/dass21" className="nav-link">DASS-21</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/evaluate/pss10" className="nav-link">PSS-10</NavLink>
            </li>

            {/* Panel psicólogo */}
            <RoleGate allow={['psych','admin']}>
              <li className="nav-item">
                <NavLink to="/psych" className="nav-link">Psicólogo</NavLink>
              </li>
            </RoleGate>

            {/* Panel admin */}
            <RoleGate allow={['admin']}>
              <li className="nav-item">
                <NavLink to="/admin" className="nav-link">Admin</NavLink>
              </li>
            </RoleGate>
          </ul>

          {/* Lado derecho: usuario + cerrar sesión */}
          {user ? (
            <div className="d-flex align-items-center gap-2">
              <div className="d-none d-md-flex flex-column text-end me-2">
                <div className="small fw-semibold text-truncate" style={{maxWidth: 220}}>
                  {user.displayName || user.email || 'Usuario'}
                </div>
                <div className="small text-muted text-truncate" style={{maxWidth: 220}}>
                  {user.email}
                </div>
              </div>

              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, fontWeight: 700 }}
                title={user.email ?? 'Cuenta'}
              >
                {initials}
              </div>

              <button type="button" className="btn btn-outline-secondary btn-sm btn-pill ms-2" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <Link className="btn btn-outline-primary btn-sm btn-pill" to="/login">Iniciar sesión</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
