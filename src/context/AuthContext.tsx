// ✅ usa importación de tipo para User
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '../lib/firebase';

const AuthCtx = createContext<{ user: User | null | undefined }>({ user: undefined });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return <AuthCtx.Provider value={{ user }}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="container py-5">Cargando…</div>;
  if (!user) return <div className="container py-5">No autenticado. <a href="/login">Inicia sesión</a></div>;
  return <>{children}</>;
}
