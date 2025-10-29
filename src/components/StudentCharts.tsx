import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar,
} from 'recharts';

type Submission = {
  id: string;
  createdAt?: { toDate?: () => Date } | any;
  model?: { risk?: number; category?: 'low'|'med'|'high' };
  scores?: { sub?: { stress?: number; anxiety?: number; depression?: number } } | any;
  instrumentId?: string;
};

export default function StudentCharts({ subs }: { subs: Submission[] }) {
  // Orden cronológico ascendente para trazar en el tiempo
  const ordered = useMemo(() => {
    const arr = [...subs].filter(s => s.createdAt?.toDate).sort(
      (a,b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime()
    );
    return arr;
  }, [subs]);

  // Serie 1: Bienestar (100 - riesgo%).
  const wellbeingSeries = useMemo(() => {
    return ordered.map(s => ({
      date: formatShort(s.createdAt?.toDate?.() as Date),
      wellbeing: s?.model?.risk != null ? Math.round(100 - (s.model.risk * 100)) : null,
      category: s?.model?.category ?? '—',
    })).filter(p => p.wellbeing != null);
  }, [ordered]);

  // Serie 2: Últimas subescalas DASS-21 (normalizadas 0..100).
  // Tomamos la última respuesta por si hay varias.
  const lastDass = useMemo(() => {
    const found = [...ordered].reverse().find(s => s.instrumentId === 'dass21' && s.scores?.sub);
    return found?.scores?.sub
      ? {
          stress: Math.round(((found.scores.sub.stress ?? 0) / 42) * 100),
          anxiety: Math.round(((found.scores.sub.anxiety ?? 0) / 42) * 100),
          depression: Math.round(((found.scores.sub.depression ?? 0) / 42) * 100),
        }
      : null;
  }, [ordered]);

  const barsData = useMemo(() => {
    if (!lastDass) return [];
    return [
      { name: 'Estrés', value: lastDass.stress },
      { name: 'Ansiedad', value: lastDass.anxiety },
      { name: 'Depresión', value: lastDass.depression },
    ];
  }, [lastDass]);

  const hasLine = wellbeingSeries.length > 0;
  const hasBars = barsData.length > 0;

  return (
    <div className="row g-3">
      <div className="col-12 col-lg-6">
        <div className="border rounded-3 p-3 h-100">
          <div className="fw-semibold mb-2">Progreso de bienestar</div>
          {hasLine ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={wellbeingSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="wellbeing" name="Bienestar" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="Aún no hay datos suficientes para el gráfico de bienestar." />
          )}
          <div className="small text-secondary mt-2">
            * Bienestar = 100 − (riesgo × 100). Cada punto es una evaluación guardada.
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <div className="border rounded-3 p-3 h-100">
          <div className="fw-semibold mb-2">Subescalas DASS-21 (última evaluación)</div>
          {hasBars ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={barsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Índice (0–100)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="Aún no hay una evaluación DASS-21 para mostrar subescalas." />
          )}
          <div className="small text-secondary mt-2">
            * Normalizado respecto a 42 pts por subescala (DASS-21 ×2).
          </div>
        </div>
      </div>
    </div>
  );
}

function formatShort(d?: Date) {
  if (!d) return '';
  // ej: 29/10 14:30
  return d.toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-secondary py-4">
      <i className="bi bi-graph-up me-2" /> {text}
    </div>
  );
}
