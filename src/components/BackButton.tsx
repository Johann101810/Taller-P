import { useNavigate } from 'react-router-dom';

export default function BackButton({
  label = 'Volver',
  fallback = '/',
  confirmOnDirty = false,
  isDirty = false,
}: {
  label?: string;
  fallback?: string;        // a dónde ir si no hay historial
  confirmOnDirty?: boolean; // pregunta antes de salir si hay cambios sin guardar
  isDirty?: boolean;        // pásalo desde el form (Runner)
}) {
  const nav = useNavigate();

  function handleClick() {
    if (confirmOnDirty && isDirty) {
      const ok = window.confirm('Tienes cambios sin guardar. ¿Deseas salir de todos modos?');
      if (!ok) return;
    }
    // intenta volver; si no hay historial, navega al fallback
    if (window.history.length > 1) nav(-1);
    else nav(fallback, { replace: true });
  }

  return (
    <button type="button" className="btn btn-link text-decoration-none" onClick={handleClick}>
      <i className="bi bi-arrow-left me-1" aria-hidden="true" /> {label}
    </button>
  );
}
