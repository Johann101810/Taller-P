import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../lib/firebase';
import { ensureUserProfile } from '../lib/ensureUserProfile'; // 👈 importa el helper
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';

function humanError(code?: string) {
  const map: Record<string,string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/invalid-email': 'Correo inválido.',
    'auth/operation-not-allowed': 'Habilita Email/Password en Firebase.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/network-request-failed': 'Fallo de red. Verifica tu conexión.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana emergente.',
    'auth/popup-closed-by-user': 'Cerraste el popup antes de terminar.',
    'auth/user-not-found': 'Usuario no encontrado.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  };
  return map[code ?? ''] ?? `Error: ${code ?? 'desconocido'}`;
}

export default function Login(){
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  // Rellena email si el usuario marcó "Recordarme" antes
  useEffect(() => {
    const saved = localStorage.getItem('mtc:lastEmail');
    if (saved) setEmail(saved);
  }, []);

  useEffect(() => {
    if (remember) localStorage.setItem('mtc:lastEmail', email);
  }, [remember, email]);

  async function handleEmailLogin(e:React.FormEvent){
     e.preventDefault();
  setError(null); setInfo(null); setLoading(true);
  try {
    await signInWithEmailAndPassword(auth, email.trim(), pwd);
    // opcional: si quieres asegurar el perfil también tras login
    await ensureUserProfile('student');
    navigate(from, { replace:true });
  } catch (err:any) {
    setError(humanError(err?.code));
  } finally { setLoading(false); }
  }

  async function handleCreate(){
  setError(null); setInfo(null); setLoading(true);
  try {
    await createUserWithEmailAndPassword(auth, email.trim(), pwd);
    await ensureUserProfile('student'); // 👈 crea users/{uid} la primera vez
    navigate('/', { replace:true });
  } catch (err:any) {
    setError(humanError(err?.code));
  } finally { setLoading(false); }
  }

  async function handleGoogle(){
  setError(null); setInfo(null); setLoading(true);
  try {
    await signInWithPopup(auth, googleProvider);
    await ensureUserProfile('student'); // 👈 para usuarios nuevos con Google
    navigate(from, { replace:true });
  } catch (err:any) {
    setError(humanError(err?.code));
  } finally { setLoading(false); }
  }

  async function handleReset(){
    setError(null); setInfo(null);
    if (!email) { setError('Escribe tu correo para enviarte el enlace.'); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Te enviamos un enlace para restablecer tu contraseña.');
    } catch (err:any) {
      console.error('Reset error:', err?.code, err?.message);
      setError(humanError(err?.code));
    }
  }

  return (
    <div className="auth-bg d-flex align-items-center justify-content-center min-vh-100">
      <div className="container" style={{maxWidth: 460}}>
        <div className="card auth-card shadow-lg border-0 rounded-4">
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-3">
              <div className="brand-circle mb-2">MT</div>
              <h1 className="h4 mb-1">Bienvenido(a) a <span className="text-primary">MindTrack Campus</span></h1>
              <div className="text-muted small">Inicia sesión para continuar</div>
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}
            {info &&  <div className="alert alert-info py-2">{info}</div>}

            <form className="vstack gap-3" onSubmit={handleEmailLogin}>
              <div>
                <label className="form-label">Correo</label>
                <input
                  className="form-control form-control-lg"
                  type="email"
                  placeholder="tucorreo@universidad.edu"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="form-label d-flex justify-content-between">
                  <span>Contraseña</span>
                  <button type="button" className="btn btn-link p-0 small" onClick={()=>setShowPwd(s=>!s)}>
                    {showPwd ? 'Ocultar' : 'Mostrar'}
                  </button>
                </label>
                <div className="input-group input-group-lg">
                  <input
                    className="form-control"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pwd}
                    onChange={e=>setPwd(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <div className="form-check">
                    <input id="remember" className="form-check-input" type="checkbox"
                           checked={remember} onChange={e=>setRemember(e.target.checked)} />
                    <label className="form-check-label" htmlFor="remember">Recordarme</label>
                  </div>
                  <button type="button" className="btn btn-link p-0 small" onClick={handleReset}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button className="btn btn-primary btn-lg w-100 btn-pill" disabled={loading} type="submit">
                {loading ? 'Entrando…' : 'Entrar'}
              </button>

              <div className="text-center text-muted my-1">o</div>

              <button className="btn btn-outline-dark w-100 btn-pill" type="button"
                      onClick={handleGoogle} disabled={loading}>
                <i className="bi bi-google me-2"></i> Entrar con Google
              </button>

              <div className="text-center text-muted small mt-3">
                ¿Aún no tienes cuenta?
                {' '}
                <button className="btn btn-link p-0 align-baseline" type="button" onClick={handleCreate}>
                  Crear cuenta
                </button>
              </div>
            </form>

            <div className="text-center small text-muted mt-4">
              Al continuar aceptas nuestros términos y política de privacidad.
            </div>
          </div>
        </div>

        <div className="text-center mt-3">
          <Link to=".." className="text-decoration-none small">
            ← Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
