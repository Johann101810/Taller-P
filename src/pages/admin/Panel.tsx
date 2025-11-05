import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, limit, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import StudentCharts from '../../components/StudentCharts';
import { exportUserReportPDF } from '../../lib/userReport';
import BackBar from '../../components/BackBar';


type Role = 'student' | 'psych' | 'admin';
type UserDoc = {
  id: string;            // uid
  name?: string;
  email?: string;
  role?: Role;
  orgId?: string | null;
  cohortId?: string | null;
};

type Submission = {
  id: string;
  createdAt?: any;       // Firestore Timestamp
  instrumentId?: string; // "dass21" | "pss10" | ...
  scores?: any;          // { depression, anxiety, stress } o total, etc.
  model?: { risk?: number; category?: 'low' | 'med' | 'high' };
};

export default function AdminPanel(){
  const { user } = useAuth(); // admin logueado (por si quieres filtrar por org)
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<UserDoc | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  // === Cargar todos los usuarios (puedes filtrar por org si quieres) ===
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserDoc));
      setUsers(arr);
    });
    return unsub;
  }, []);

  // === Cuando seleccionas un usuario, suscríbete a sus submissions ===
  useEffect(() => {
    if (!selected?.id) { setSubs([]); return; }
    const q = query(
      collection(db, 'assessments', selected.id, 'submissions'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
    });
    return unsub;
  }, [selected?.id]);

  // === Filtro simple por nombre/email/org ===
  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return users;
    return users.filter(u =>
      (u.name ?? '').toLowerCase().includes(f) ||
      (u.email ?? '').toLowerCase().includes(f) ||
      (u.orgId ?? '').toLowerCase().includes(f)
    );
  }, [users, filter]);

  // === KPIs del usuario seleccionado ===
  const kpis = useMemo(() => {
    if (!subs.length) return { wellbeing: null as number | null, riskLabel: '—', evalCount90d: 0, lastAt: '—' };
    const now = new Date().getTime();
    const ms90 = 90 * 24 * 60 * 60 * 1000;

    const last = subs[0];
    const lastRisk = last?.model?.risk ?? null;
    const wellbeing = lastRisk != null ? Math.round(100 - lastRisk * 100) : null;

    const cat = last?.model?.category;
    const riskLabel = cat === 'low' ? 'Bajo' : cat === 'med' ? 'Medio' : cat === 'high' ? 'Alto' : '—';

    const evalCount90d = subs.filter(s => {
      const ts = s.createdAt?.toDate?.() as Date | undefined;
      return ts && (now - ts.getTime() <= ms90);
    }).length;

    const lastAt = last?.createdAt?.toDate?.()?.toLocaleString?.() ?? '—';

    return { wellbeing, riskLabel, evalCount90d, lastAt };
  }, [subs]);

  async function changeRole(uid: string, role: Role) {
    try {
      setBusyUid(uid);
      await updateDoc(doc(db, 'users', uid), { role });
    } finally {
      setBusyUid(null);
    }
  }

  return (

    
    <div className="container-xxl py-4">

<BackBar
    title=""
    subtitle=""
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
        <h2 className="mb-0">Administración</h2>
        <div className="small text-muted">Usuarios: {users.length}</div>
      </div>

      {/* Top tools */}
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <div className="card rounded-4">
            <div className="card-body">
              <label className="form-label">Buscar usuario</label>
              <input
                className="form-control"
                placeholder="Nombre, correo u organización…"
                value={filter}
                onChange={e=>setFilter(e.target.value)}
              />
              <div className="small text-muted mt-2">
                Consejo: escribe parte del email (ej. <code>@uni.edu</code>) o el <code>orgId</code>.
              </div>
            </div>
          </div>
        </div>

        {/* Resumen del seleccionado */}
        <div className="col-12 col-lg-8">
          <div className="card rounded-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="fw-semibold">Usuario seleccionado</div>
                {selected && (
                  <span className="badge text-bg-light">{selected.email}</span>
                )}
              </div>

              {!selected ? (
                <div className="text-muted py-3">Selecciona un usuario en la lista para ver sus métricas.</div>
              ) : (
                <>
                  <div className="row g-3 mt-1">
                    <div className="col-6 col-md-3"><Kpi title="Bienestar" value={kpis.wellbeing != null ? `${kpis.wellbeing}/100` : '—'} /></div>
                    <div className="col-6 col-md-3"><Kpi title="Riesgo" value={kpis.riskLabel} /></div>
                    <div className="col-6 col-md-3"><Kpi title="Evaluaciones (90d)" value={String(kpis.evalCount90d)} /></div>
                    <div className="col-6 col-md-3"><Kpi title="Última" value={kpis.lastAt} /></div>
                  </div>
<button
      className="btn btn-outline-secondary btn-sm"
      onClick={() => selected && exportUserReportPDF(selected, subs)}
      disabled={!selected || !subs.length}
      title={!subs.length ? 'No hay evaluaciones para exportar' : 'Descargar PDF'}
    >
      Descargar PDF
    </button>
                  <div className="mt-3">
                    <div className="fw-semibold mb-2">Progreso</div>
                    <div className="card card-elevated rounded-4">
                        
                      <div className="card-body">
                        <StudentCharts subs={subs} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="fw-semibold mb-2">Submissions recientes</div>
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Instrumento</th>
                            <th>Riesgo</th>
                            <th>Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subs.map(s => (
                            <tr key={s.id}>
                              <td>{s.createdAt?.toDate?.()?.toLocaleString?.() ?? '—'}</td>
                              <td className="text-uppercase">{s.instrumentId ?? '—'}</td>
                              <td>
                                {s.model?.category
                                  ? ({low:'Bajo',med:'Medio',high:'Alto'} as any)[s.model.category]
                                  : '—'}
                                {s.model?.risk != null && (
                                  <span className="text-muted"> ({Math.round((1 - (1 - s.model.risk)) * 100)}%)</span>
                                )}
                              </td>
                              <td>
                                {s.instrumentId === 'dass21' && s.scores
                                  ? (<span className="text-muted small">
                                      D:{s.scores.depression ?? '—'} A:{s.scores.anxiety ?? '—'} S:{s.scores.stress ?? '—'}
                                    </span>)
                                  : s.instrumentId === 'pss10' && s.scores
                                  ? (<span className="text-muted small">Total:{s.scores.total ?? '—'}</span>)
                                  : <span className="text-muted small">—</span>}
                              </td>
                            </tr>
                          ))}
                          {!subs.length && (
                            <tr>
                              <td colSpan={4} className="text-center text-muted py-3">Sin registros</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="card rounded-4 mt-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold">Usuarios</div>
            <span className="badge text-bg-light">{filtered.length}</span>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Org</th>
                  <th>Rol</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className={selected?.id === u.id ? 'table-active' : ''}>
                    <td>{u.name ?? '—'}</td>
                    <td className="text-muted">{u.email ?? '—'}</td>
                    <td className="text-muted">{u.orgId ?? '—'}</td>
                    <td style={{minWidth: 180}}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge text-bg-light text-uppercase">{u.role ?? 'student'}</span>
                        <select
                          className="form-select form-select-sm"
                          value={u.role ?? 'student'}
                          onChange={e => changeRole(u.id, e.target.value as Role)}
                          disabled={busyUid === u.id}
                        >
                          <option value="student">student</option>
                          <option value="psych">psych</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-outline-primary btn-sm" onClick={()=>setSelected(u)}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3">Sin usuarios</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="small text-muted">
            * El cambio de rol se guarda al instante (según reglas).  
            * Para que alguien sea **admin real** a nivel permisos, debe existir también <code>admins/&lt;uid&gt;</code>.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function Kpi({ title, value }:{ title:string; value:string }) {
  return (
    <div className="border rounded-4 p-3 h-100">
      <div className="text-secondary small">{title}</div>
      <div className="fs-5 fw-semibold">{value}</div>
    </div>
  );
}
