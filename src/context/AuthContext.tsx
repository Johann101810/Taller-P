// ✅ usa importación de tipo para User
import Landing from '../pages/Landing';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { auth } from '../lib/firebase';


type AuthValue = { user: User | null | undefined; loading: boolean };

const AuthCtx = createContext<AuthValue>({ user: undefined, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suscribe a cambios de sesión
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return <AuthCtx.Provider value={{ user, loading }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

/** UI bonita cuando no hay sesión */


/** Loader elegante mientras se resuelve la sesión */
function AuthLoading() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" aria-label="Cargando" />
        <div className="text-muted">Cargando…</div>
      </div>
    </div>
  );
}



export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!user) return <Landing />;   // <<< mostrar landing
  return <>{children}</>;
}

