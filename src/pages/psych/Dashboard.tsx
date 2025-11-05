import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, where, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../hooks/useRole';
import StudentCharts from '../../components/StudentCharts';
import BackBar from '../../components/BackBar'; 

type Student = {
  id: string;
  name?: string;
  email?: string;
  role?: 'student'|'psych'|'admin';
  orgId?: string|null;
};

type Submission = {
  id: string;
  createdAt?: any;
  instrumentId?: string;
  scores?: any;
  model?: { risk?: number; category?: 'low'|'med'|'high' };
};

export default function PsychDashboard() {
  const { user } = useAuth();
  const { role, orgId } = useRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [note, setNote] = useState('');
  const [reco, setReco] = useState('');
  const [sessionAt, setSessionAt] = useState<string>(''); // ISO: "2025-11-01T14:30"
  const [errMsg, setErrMsg] = useState<string|null>(null);


  // === Lista de alumnos de mi organización ===
  useEffect(() => {
    if (!orgId) return;
    const q = query(
      collection(db, 'users'),
      where('orgId', '==', orgId),
      where('role', '==', 'student')
    );
    const unsub = onSnapshot(q, snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    },
    (err) => {
      console.error('[psych-users] error', err);
      setErrMsg(err?.message ?? 'Error cargando alumnos');
    });
    return unsub;
  }, [orgId]);

  // === Submissions del alumno seleccionado ===
  useEffect(() => {
    if (!selected?.id) { setSubs([]); return; }
    const q = query(
      collection(db, 'assessments', selected.id, 'submissions'),
      orderBy('createdAt','desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
    });
    return unsub;
  }, [selected?.id]);

  // === KPIs rápidos del seleccionado ===
  const kpis = useMemo(() => {
    if (!subs.length) return { wellbeing: '—', riskLabel: '—', lastAt: '—' };
    const last = subs[0];
    const risk = last?.model?.risk;
    const wellbeing = risk != null ? `${Math.round(100 - risk*100)}/100` : '—';
    const cat = last?.model?.category;
    const riskLabel = cat === 'low' ? 'Bajo' : cat === 'med' ? 'Medio' : cat === 'high' ? 'Alto' : '—';
    const lastAt = last?.createdAt?.toDate?.()?.toLocaleString?.() ?? '—';
    return { wellbeing, riskLabel, lastAt };
  }, [subs]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return students;
    return students.filter(s =>
      (s.name ?? '').toLowerCase().includes(f) ||
      (s.email ?? '').toLowerCase().includes(f)
    );
  }, [students, filter]);

  // === Acciones ===
  async function addPrivateNote() {
    if (!selected?.id || !note.trim()) return;
    await addDoc(collection(db, 'users', selected.id, 'private_notes'), {
      text: note.trim(),
      by: { uid: user?.uid ?? null, name: user?.displayName ?? null },
      at: serverTimestamp(),
    });
    setNote('');
  }

  async function addReco() {
    if (!selected?.id || !reco.trim()) return;
    await addDoc(collection(db, 'users', selected.id, 'recos'), {
      text: reco.trim(),
      by: { uid: user?.uid ?? null, name: user?.displayName ?? null },
      at: serverTimestamp(),
      read: false
    });
    setReco('');
  }

  async function scheduleSession() {
    if (!selected?.id || !sessionAt) return;
    await addDoc(collection(db, 'users', selected.id, 'sessions'), {
      scheduledAt: new Date(sessionAt),
      status: 'scheduled',
      withPsych: { uid: user?.uid ?? null, name: user?.displayName ?? null },
      createdAt: serverTimestamp()
    });
    setSessionAt('');
  }

  return (
    <div className="container-xxl py-4">
         <BackBar
    title="Administración"
    subtitle="Gestión de usuarios y reportes"
    right={
      selected ? (
        <button className="btn btn-outline-secondary btn-sm"
          onClick={() => selected && exportUserReportPDF(selected, subs)}
          disabled={!subs.length}
        >
          Descargar PDF
        </button>
      ) : null
    }
  />
      <div className="d-flex align-items-center justify-content-between mb-3">
        
        <h2 className="mb-0">Panel Psicólogo</h2>
        <div className="small text-muted">Rol: {role ?? '—'} | Org: {orgId ?? '—'}</div>
      </div>

      <div className="row g-3">
        {/* Columna izquierda: listado */}
        <div className="col-12 col-lg-5">
          <div className="card rounded-4">
            <div className="card-body">
              <label className="form-label">Buscar</label>
              {errMsg && <div className="alert alert-warning mt-2">{errMsg}</div>}
              <input
                className="form-control"
                placeholder="Nombre o correo…"
                value={filter}
                onChange={e=>setFilter(e.target.value)}
              />
              <div className="table-responsive mt-3" style={{maxHeight: '60vh', overflow: 'auto'}}>
                <table className="table align-middle">
                  <thead>
                    <tr><th>Alumno</th><th>Email</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id} className={selected?.id===s.id ? 'table-active' : ''}>
                        <td>{s.name ?? '—'}</td>
                        <td className="text-muted small">{s.email ?? '—'}</td>
                        <td className="text-end">
                          <button className="btn btn-outline-primary btn-sm" onClick={()=>setSelected(s)}>
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr><td colSpan={3} className="text-center text-muted py-3">Sin resultados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="small text-muted">Total: {filtered.length}</div>
            </div>
          </div>
        </div>

        {/* Columna derecha: detalle */}
        <div className="col-12 col-lg-7">
          <div className="card rounded-4">
            <div className="card-body">
              {!selected ? (
                <div className="text-muted">Selecciona un estudiante a la izquierda.</div>
              ) : (
                <>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="fw-semibold">{selected.name ?? '—'}</div>
                    <span className="badge text-bg-light">{selected.email}</span>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-4"><Kpi title="Bienestar" value={kpis.wellbeing} /></div>
                    <div className="col-4"><Kpi title="Riesgo" value={kpis.riskLabel} /></div>
                    <div className="col-4"><Kpi title="Última" value={kpis.lastAt} /></div>
                  </div>

                  <div className="mt-3">
                    <div className="fw-semibold mb-2">Progreso</div>
                    <div className="card card-elevated rounded-4">
                      <div className="card-body">
                        <StudentCharts subs={subs} />
                      </div>
                    </div>
                  </div>

                  {/* Acciones: agendar, nota privada, recomendación compartida */}
                  <div className="row g-3 mt-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Agendar sesión</label>
                      <div className="input-group">
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={sessionAt}
                          onChange={e=>setSessionAt(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={scheduleSession}>Guardar</button>
                      </div>
                      <div className="small text-muted mt-1">Crea en <code>users/{'{uid}'}/sessions</code></div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Recomendación (visible al estudiante)</label>
                      <div className="input-group">
                        <input
                          className="form-control"
                          placeholder="Ej: respiración 4-7-8, pausas activas…"
                          value={reco}
                          onChange={e=>setReco(e.target.value)}
                        />
                        <button className="btn btn-outline-primary" onClick={addReco}>Enviar</button>
                      </div>
                      <div className="small text-muted mt-1">Crea en <code>users/{'{uid}'}/recos</code></div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Nota privada</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Solo para el equipo psicológico (no visible al estudiante)…"
                        value={note}
                        onChange={e=>setNote(e.target.value)}
                      />
                      <div className="d-flex justify-content-end mt-2">
                        <button className="btn btn-outline-secondary" onClick={addPrivateNote}>Guardar nota</button>
                      </div>
                      <div className="small text-muted">Crea en <code>users/{'{uid}'}/private_notes</code></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Kpi({ title, value }:{ title:string; value:string }) {
  return (
    <div className="border rounded-4 p-3 h-100">
      <div className="text-secondary small">{title}</div>
      <div className="fs-5 fw-semibold">{value}</div>
    </div>
  );
}
