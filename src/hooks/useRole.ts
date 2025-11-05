// src/hooks/useRole.ts
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

export type Role = 'student' | 'psych' | 'admin' | null;

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // si no hay usuario, limpiamos y salimos
    if (!user?.uid) {
      console.log('[useRole] no user, role=null');
      setRole(null);
      setOrgId(null);
      setLoading(false);
      return;
    }

    const path = `users/${user.uid}`;
    console.log('[useRole] suscribing to', path);

    // onSnapshot con callback de éxito y de error
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const exists = snap.exists();
        const data = snap.data() as any;
        const r = (data?.role ?? 'student') as Role;
        const org = data?.orgId ?? null;

        console.log('[useRole] snap exists=', exists, 'role=', r, 'orgId=', org, 'data=', data);

        setRole(r);
        setOrgId(org);
        setLoading(false);
      },
      (err) => {
        console.error('[useRole] onSnapshot ERROR:', err?.code, err?.message);
        // si hay error (p. ej. permission-denied), detén loading para que la UI no quede bloqueada
        setLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  return { role, orgId, loading };
}
