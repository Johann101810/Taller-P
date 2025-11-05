import type { ReactNode } from 'react';
import { useRole } from '../hooks/useRole';

export function RoleGate({
  allow,
  children,
}: {
  allow: Array<'student' | 'psych' | 'admin'>;
  children: ReactNode;
}) {
  const { role, loading } = useRole();
  if (loading) return null;
  if (!role || !allow.includes(role)) return null;
  return <>{children}</>;
}

export default RoleGate;
