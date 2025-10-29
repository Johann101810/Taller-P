import { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

export default function Login(){
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mapea códigos de error de Firebase a mensajes entendibles
  function humanError(code?: string) {
    const map: Record<string,string> = {
      'auth/email-already-in-use': 'Este correo ya está registrado.',
      'auth/invalid-email': 'Correo inválido.',
      'auth/operation-not-allowed': 'Habilita Email/Password en Firebase.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/network-request-failed': 'Fallo de red. Verifica tu conexión.',
      'auth/popup-blocked': 'El navegador bloqueó la ventana emergente.',
      'auth/popup-closed-by-user': 'Cerraste el popup antes de terminar.',
    };
    return map[code ?? ''] ?? `Error: ${code ?? 'desconocido'}`;
  }

  async function handleEmailLogin(e:React.FormEvent){
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pwd);
      window.location.href = '/';
    } catch (err:any) {
      console.error('Auth login error:', err?.code, err?.message);
      setError(humanError(err?.code));
    } finally { setLoading(false); }
  }

  async function handleCreate(){
    setError(null); setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pwd);
      window.location.href = '/';
    } catch (err:any) {
      // 👇 Aquí verás el motivo real del 400 (p.ej. auth/weak-password, auth/email-already-in-use, etc.)
      console.error('Auth signup error:', err?.code, err?.message);
      setError(humanError(err?.code));
    } finally { setLoading(false); }
  }

  async function handleGoogle(){
    setError(null); setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.href = '/';
    } catch (err:any) {
      console.error('Google popup error:', err?.code, err?.message);
      setError(humanError(err?.code));
    } finally { setLoading(false); }
  }

  return (
    <div className="container py-5">
      <div className="mx-auto" style={{maxWidth:420}}>
        <h1 className="mb-3">Iniciar sesión</h1>
        {error && <div className="alert alert-danger">{error}</div>}

        <form className="vstack gap-3" onSubmit={handleEmailLogin}>
          <input className="form-control" placeholder="Email"
            value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="form-control" type="password" placeholder="Contraseña"
            value={pwd} onChange={e=>setPwd(e.target.value)} />

          <button className="btn btn-primary w-100" disabled={loading} type="submit">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <button className="btn btn-outline-secondary w-100" type="button"
            onClick={handleCreate} disabled={loading}>
            Crear cuenta
          </button>

          <button className="btn btn-outline-dark w-100" type="button"
            onClick={handleGoogle} disabled={loading}>
            <i className="bi bi-google me-2"></i> Entrar con Google
          </button>
        </form>
      </div>
    </div>
  );
}
