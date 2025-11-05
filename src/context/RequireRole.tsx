import type { ReactNode } from 'react';
import { useRole } from '../hooks/useRole';

export function RequireRole({
  allow,
  fallback,
  children,
}: {
  allow: Array<'student' | 'psych' | 'admin'>;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { role, loading } = useRole();
  if (loading) return <div className="container py-5">Cargando…</div>;
  if (!role || !allow.includes(role)) {
    return <>{fallback ?? <div className="container py-5">403 — Sin permiso</div>}</>;
  }
  return <>{children}</>;
}

export default RequireRole;
