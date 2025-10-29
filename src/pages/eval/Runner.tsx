import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { LikertQuestion } from '../../components/Likert';
import { DASS21, scoreDass21, type Dass21ItemId } from '../../instruments/dass21';
import { PSS10, scorePss10, type Pss10ItemId } from '../../instruments/pss10';
import { predictRisk, categorize } from '../../ml/model';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type Answers = Record<string, number>;

export default function Runner(){
  const { instrumentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const schema = instrumentId === 'dass21' ? DASS21 : PSS10;

  // Paginación: DASS-21 = 7 por página; PSS-10 = 5 por página
  const pageSize = schema.id === 'dass21' ? 7 : 5;
  const pages = useMemo(() => {
    const chunks: string[][] = [];
    for (let i=0; i<schema.items.length; i+=pageSize) {
      chunks.push(schema.items.slice(i, i+pageSize) as string[]);
    }
    return chunks;
  }, [schema, pageSize]);

  const totalItems = schema.items.length;

  // Autosave key
  const storageKey = useMemo(
    () => `mtc:${user?.uid || 'anon'}:${schema.id}:answers`,
    [user?.uid, schema.id]
  );

  const [answers, setAnswers] = useState<Answers>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [result, setResult] = useState<any>(null);

  // Autosave al cambiar respuestas
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey]);

  const answeredCount = schema.items.filter(id => answers[id] !== undefined).length;
  const progress = Math.round((answeredCount / totalItems) * 100);

  function setAns(id:string, v:number){
    setAnswers(a => ({ ...a, [id]: v }));
  }

  function canGoNext(currentPage: number){
    const ids = pages[currentPage];
    return ids.every(id => answers[id] !== undefined);
  }

  function goNext(){
    if (!canGoNext(page)) {
      setError('Responde todas las preguntas de esta página para continuar.');
      return;
    }
    setError(null);
    if (page < pages.length - 1) setPage(p => p + 1);
  }

  function goPrev(){
    setError(null);
    if (page > 0) setPage(p => p - 1);
  }

  async function onSubmit(e:React.FormEvent){
    e.preventDefault();
    setError(null);

    // Validar todo contestado
    const missing = schema.items.find(id => answers[id] === undefined);
    if (missing) {
      setError('Hay preguntas sin responder. Revisa las páginas anteriores.');
      return;
    }
    if (!user?.uid) {
      setError('Sesión no disponible. Vuelve a iniciar sesión.');
      return;
    }

    setSaving(true);
    try {
      let scores:any;
      let features:number[] = [0,0,0,0, 0.5,0.1,0.5]; // placeholders extra (check-ins)

      if (schema.id === 'dass21') {
        const typedAns = answers as Record<Dass21ItemId, number>;
        scores = scoreDass21(typedAns);
        const s = scores.sub;
        features = [ s.stress/42, s.anxiety/42, s.depression/42, 0, 0.5, 0.1, 0.5 ];
      } else {
        const typedAns = answers as Record<Pss10ItemId, number>;
        scores = scorePss10(typedAns);
        features = [ 0,0,0, (scores.raw/40), 0.5, 0.1, 0.5 ];
      }

      const risk = await predictRisk(features);
      const category = categorize(risk);
      setResult({ scores, risk, category });

      await addDoc(collection(db, 'assessments', user.uid, 'submissions'),{
        instrumentId: schema.id,
        version: schema.version,
        createdAt: serverTimestamp(),
        answers,
        scores,
        model: { risk, category },
        flags: { needsFollowUp: category === 'high' }
      });

      // Limpia autosave al terminar
      localStorage.removeItem(storageKey);
    } catch (err:any) {
      console.error('Save error:', err?.code, err?.message);
      setError(err?.message ?? 'No se pudo guardar la evaluación.');
    } finally {
      setSaving(false);
    }
  }

  const options = useMemo(
    () => schema.scale.labels.map((label, i) => ({ value: i, label })),
    [schema.scale.labels]
  );

  return (
    <div className="container py-4">
      {/* Header + Back */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-link text-decoration-none" onClick={()=>navigate('/')}>
            ← Volver al dashboard
          </button>
          <h2 className="mb-0 text-capitalize">{schema.id}</h2>
          <span className="badge text-bg-light">v{schema.version}</span>
        </div>
        <div className="text-secondary">{answeredCount}/{totalItems} — {progress}%</div>
      </div>

      {/* Progreso */}
      <div className="progress mb-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{width: `${progress}%`}} />
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      {/* Página actual */}
      <form onSubmit={onSubmit}>
        <div className="card mb-3">
          <div className="card-body">
            {pages[page].map((id) => (
              <LikertQuestion
                key={id}
                name={id}
                text={(schema as any).text[id]}
                value={answers[id]}
                onChange={(v)=>setAns(id, v)}
                options={options}
                required
              />
            ))}
          </div>
        </div>

        {/* Controles de paginación */}
        <div className="d-flex justify-content-between">
          <button type="button" className="btn btn-outline-secondary" onClick={goPrev} disabled={page===0}>
            ← Anterior
          </button>

          {page < pages.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={goNext}>
              Siguiente →
            </button>
          ) : (
            <button className="btn btn-success" disabled={saving}>
              {saving ? 'Guardando…' : 'Finalizar y guardar'}
            </button>
          )}
        </div>
      </form>

      {/* Resultado */}
      {result && (
        <div className="alert alert-info mt-4">
          <div><strong>Riesgo estimado:</strong> {(result.risk*100).toFixed(0)}% — <em>{result.category}</em></div>
          {schema.id === 'dass21' ? (
            <div className="small text-secondary mt-1">
              DASS-21 — Estrés: {result.scores.sub.stress}, Ansiedad: {result.scores.sub.anxiety}, Depresión: {result.scores.sub.depression}
            </div>
          ) : (
            <div className="small text-secondary mt-1">
              PSS-10 — Total: {result.scores.raw}
            </div>
          )}
          <div className="small mt-2">
            * Herramienta orientativa (no diagnóstica). Si necesitas ayuda urgente, busca apoyo profesional.
          </div>
        </div>
      )}
    </div>
  );
}
