import { useEffect, useMemo, useState } from 'react';
import AppNav from '../../components/AppNav';
import StudentCharts from '../../components/StudentCharts';
import { useAuth } from '../../context/AuthContext';
import {
  collection, onSnapshot, orderBy, query, where, limit, Timestamp, doc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// ----- tipos mínimos -----
type Submission = {
  id: string;
  createdAt?: any;
  model?: { risk?: number; category?: 'low'|'med'|'high' };
  scores?: any;
  instrumentId?: string;
};

type SessionDoc = {
  id: string;
  scheduledAt?: any;
  status?: 'scheduled'|'done'|'cancelled';
  withPsych?: { uid?: string; name?: string };
};

type UserProfile = {
  name?: string;
  program?: string;
  cohort?: string;
};

export default function StudentDashboard(){
  const { user } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [upcoming, setUpcoming] = useState<SessionDoc|null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // ➜ Suscribirse al perfil del usuario (users/{uid})
  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, snap => {
      setProfile((snap.exists() ? (snap.data() as UserProfile) : null));
    });
    return unsub;
  }, [user?.uid]);

  // Cargar submissions del usuario (ordenados desc)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'assessments', user.uid, 'submissions'),
      orderBy('createdAt','desc')
    );
    const unsub = onSnapshot(q, snap => {
      setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
    });
    return unsub;
  }, [user?.uid]);

  // Cargar próxima sesión (subcolección: users/{uid}/sessions)
  useEffect(() => {
    if (!user?.uid) return;
    const now = Timestamp.now();
    const q = query(
      collection(db, 'users', user.uid, 'sessions'),
      where('scheduledAt', '>=', now),
      orderBy('scheduledAt', 'asc'),
      limit(1)
    );
    const unsub = onSnapshot(q, snap => {
      const first = snap.docs[0];
      setUpcoming(first ? ({ id:first.id, ...first.data() } as SessionDoc) : null);
    });
    return unsub;
  }, [user?.uid]);

  // ---- KPIs derivados ----
  const { wellbeing, riskLabel, evalCount90d, nextSessionLabel, deltaVsWeek } = useMemo(() => {
    const now = Timestamp.now();
    const ms90 = 90*24*60*60*1000;

    const last = subs[0];
    const lastRisk = last?.model?.risk ?? null;
    const wellbeing = lastRisk != null ? Math.round(100 - (lastRisk*100)) : null;

    const riskLabel = ((): string => {
      const cat = last?.model?.category;
      if (cat === 'low') return 'Bajo';
      if (cat === 'med') return 'Medio';
      if (cat === 'high') return 'Alto';
      return '—';
    })();

    const evalCount90d = subs.filter(s => {
      const ts = s.createdAt?.toDate?.() as Date | undefined;
      return ts && (now.toDate().getTime() - ts.getTime() <= ms90);
    }).length;

    // Delta vs semana pasada: busca ~7 días antes (±3)
    let deltaVsWeek: string | null = null;
    if (lastRisk != null && last?.createdAt?.toDate) {
      const lastDate = last.createdAt.toDate() as Date;
      const targetMin = new Date(lastDate.getTime() - 10*24*60*60*1000);
      const targetMax = new Date(lastDate.getTime() - 4*24*60*60*1000);
      const prev = subs.find((s, i) => i>0 && s.createdAt?.toDate && (
        (s.createdAt.toDate() as Date) >= targetMin && (s.createdAt.toDate() as Date) <= targetMax
      ));
      if (prev?.model?.risk != null) {
        const prevWellbeing = Math.round(100 - (prev.model.risk*100));
        const diff = wellbeing! - prevWellbeing;
        deltaVsWeek = `${diff >= 0 ? '+' : ''}${diff} vs semana pasada`;
      }
    }

    const nextSessionLabel = upcoming?.scheduledAt?.toDate
      ? formatSession(upcoming.scheduledAt.toDate())
      : '—';

    return { wellbeing, riskLabel, evalCount90d, nextSessionLabel, deltaVsWeek };
  }, [subs, upcoming]);

  // ➜ Nombre amigable para saludo
  const greetName = useMemo(() => {
    const fromProfile = firstWord(profile?.name);
    if (fromProfile) return fromProfile;

    const fromAuth = firstWord(user?.displayName ?? '');
    if (fromAuth) return fromAuth;

    const fromEmail = firstWord(titleCase((user?.email ?? '').split('@')[0]?.replace(/[._-]/g, ' ')));
    return fromEmail || 'estudiante';
  }, [profile?.name, user?.displayName, user?.email]);

  // Puntos trazables (badge de “Tu progreso”)
  const pointsCount = useMemo(
    () => subs.filter(s => s.createdAt?.toDate).length,
    [subs]
  );

  return (
    <>
      <AppNav/>
      <div className="container-xxl py-4">

        {/* Hero */}
        <div className="hero p-4 p-md-5 rounded-4 mb-4">
          <div className="d-flex align-items-center gap-2">
            <span className="badge badge-soft">ML activo</span>
            <span className="badge text-bg-info">Recomendación disponible</span>
          </div>
          <h2 className="mt-3 mb-2">Bienvenido/a, {greetName}.</h2>
          <p className="text-muted-2 mb-4">
            Monitorea tu progreso, completa evaluaciones y recibe recomendaciones personalizadas.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <a href="/evaluate/dass21" className="btn btn-success btn-pill">
              <i className="bi bi-play-fill me-1"></i> Iniciar DASS-21
            </a>
            <a href="/evaluate/pss10" className="btn btn-outline-primary btn-pill">PSS-10</a>
            <a href="/results" className="btn btn-outline-secondary btn-pill">Ver resultados</a>
          </div>
        </div>

        {/* KPIs */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="kpi-card rounded-4 p-3 h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div className="kpi-title">Índice de bienestar</div>
                <i className="bi bi-activity text-success"></i>
              </div>
              <div className="kpi-value mt-1">{wellbeing != null ? `${wellbeing}/100` : '—'}</div>
              <div className="kpi-hint mt-1">{deltaVsWeek ?? '—'}</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="kpi-card rounded-4 p-3 h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div className="kpi-title">Riesgo actual</div>
                <i className="bi bi-thermometer-half text-warning"></i>
              </div>
              <div className="kpi-value mt-1">{riskLabel}</div>
              <div className="kpi-hint mt-1">Basado en últimas respuestas</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="kpi-card rounded-4 p-3 h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div className="kpi-title">Evaluaciones</div>
                <i className="bi bi-check2-square text-primary"></i>
              </div>
              <div className="kpi-value mt-1">{String(evalCount90d)}</div>
              <div className="kpi-hint mt-1">Últimos 90 días</div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="kpi-card rounded-4 p-3 h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div className="kpi-title">Sesiones</div>
                <i className="bi bi-calendar-event text-info"></i>
              </div>
              <div className="kpi-value mt-1">{upcoming ? '1' : '0'}</div>
              <div className="kpi-hint mt-1">Próx. {nextSessionLabel}</div>
            </div>
          </div>
        </div>

        {/* Gráficos con datos reales */}
        <div className="card card-elevated rounded-4">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="fw-semibold">Tu progreso</div>
              <span className="badge text-bg-light">{pointsCount}</span>
            </div>
            <StudentCharts subs={subs} />
          </div>
        </div>

      </div>
    </>
  );
}

/* ------- helpers ------- */
function formatSession(d: Date){
  return d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
function firstWord(s?: string){
  if (!s) return '';
  const trimmed = s.trim();
  const first = trimmed.split(/\s+/)[0];
  return titleCase(first);
}
function titleCase(s?: string){
  if (!s) return '';
  return s.replace(/\b\w/g, c => c.toUpperCase());
}
