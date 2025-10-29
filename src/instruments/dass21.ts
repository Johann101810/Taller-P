// DASS-21 — con placeholders. Reemplaza text.* con los ítems autorizados.
export const DASS21 = {
  id: 'dass21',
  version: 'v1',
  scale: { min: 0, max: 3, labels: ['Nunca', 'A veces', 'Frecuente', 'Casi siempre'] },
  subscales: {
    depression: ['d1','d2','d3','d4','d5','d6','d7'] as const,
    anxiety:    ['a1','a2','a3','a4','a5','a6','a7'] as const,
    stress:     ['s1','s2','s3','s4','s5','s6','s7'] as const,
  },
  items: [
    'd1','d2','d3','d4','d5','d6','d7',
    'a1','a2','a3','a4','a5','a6','a7',
    's1','s2','s3','s4','s5','s6','s7'
  ] as const,
  text: {
    d1: '(Depresión) Me ha resultado difícil sentirme entusiasmado/a por algo.',
    d2: '(Depresión) No he podido sentir ningún sentimiento positivo.',
    d3: '(Depresión) He sentido que no tenía nada que esperar del futuro.',
    d4: '(Depresión) He sentido que la vida no tenía sentido.',
    d5: '(Depresión) He tenido dificultad para tomar la iniciativa para hacer cosas.',
    d6: '(Depresión) He sentido que no valía para nada.',
    d7: '(Depresión) Me he sentido triste y deprimido/a.',

    a1: '(Ansiedad) He sentido miedo sin motivo aparente.',
    a2: '(Ansiedad) He sentido que mi corazón latía sin razón aparente (por ejemplo, aumento del ritmo cardíaco o palpitaciones).',
    a3: '(Ansiedad) He sentido dificultad para respirar (por ejemplo, respiración entrecortada sin haber hecho ejercicio).',
    a4: '(Ansiedad) He sentido temblores (por ejemplo, en las manos).',
    a5: '(Ansiedad) He sentido que estaba al borde de una crisis de nervios.',
    a6: '(Ansiedad) He sentido miedo de que me ocurriera algo terrible.',
    a7: '(Ansiedad) He sentido que estaba muy nervioso/a.',

    s1: '(Estrés) Me ha costado mucho relajarme.',
    s2: '(Estrés) He tenido dificultad para tranquilizarme después de haberme molestado.',
    s3: '(Estrés) He sentido que estaba usando mucha energía nerviosa.',
    s4: '(Estrés) He sentido que me preocupaba en exceso por situaciones que podrían salirse de control.',
    s5: '(Estrés) He sentido que me irritaba fácilmente.',
    s6: '(Estrés) He sentido que estaba muy alterado/a.',
    s7: '(Estrés) He sentido que me resultaba difícil soportar cualquier interrupción o demora.'

  } as const
} as const;

export type Dass21ItemId = typeof DASS21.items[number];
export type Dass21Answers = Partial<Record<Dass21ItemId, number>>;

function sumIds(ids: readonly Dass21ItemId[], ans: Dass21Answers) {
  return ids.reduce((acc, id) => acc + (ans[id] ?? 0), 0);
}

export function scoreDass21(ans: Dass21Answers) {
  const depression = sumIds(DASS21.subscales.depression, ans) * 2;
  const anxiety    = sumIds(DASS21.subscales.anxiety, ans) * 2;
  const stress     = sumIds(DASS21.subscales.stress, ans) * 2;
  const total = depression + anxiety + stress;
  return { raw: total, sub: { depression, anxiety, stress } };
}
