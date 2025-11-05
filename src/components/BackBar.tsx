import type { ReactNode } from 'react';
import BackButton from './BackButton';

export default function BackBar({
  title,
  subtitle,
  right,
  confirmOnDirty = false,
  isDirty = false,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;        // botones extra (Descargar PDF, etc.)
  confirmOnDirty?: boolean;
  isDirty?: boolean;
}) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      <div>
        <BackButton confirmOnDirty={confirmOnDirty} isDirty={isDirty} />
        <h2 className="h4 mb-0">{title}</h2>
        {subtitle && <div className="text-muted small">{subtitle}</div>}
      </div>
      {right && <div className="d-flex align-items-center gap-2">{right}</div>}
    </div>
  );
}
