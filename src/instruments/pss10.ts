// PSS-10 — con placeholders. Reemplaza text.* con ítems autorizados.
export const PSS10 = {
  id: 'pss10',
  version: 'v1',
  scale: { min:0, max:4, labels: ['Nunca','Casi nunca','A veces','A menudo','Muy a menudo'] },
  items: ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'] as const,
  reverse: ['p4','p5','p7','p8'] as const,
  text: {
    p1: '(Estrés percibido) En el último mes, ¿con qué frecuencia ha estado afectado por algo que ocurrió inesperadamente?',
    p2: '(Estrés percibido) En el último mes, ¿con qué frecuencia se ha sentido incapaz de controlar las cosas importantes en su vida?',
    p3: '(Estrés percibido) En el último mes, ¿con qué frecuencia se ha sentido nervioso o estresado?',
    p4: '(Invertido) En el último mes, ¿con qué frecuencia ha sentido que las cosas le iban bien?',
    p5: '(Invertido) En el último mes, ¿con qué frecuencia ha sentido que podía manejar los problemas molestos de su vida?',
    p6: '(Estrés percibido) En el último mes, ¿con qué frecuencia ha sentido que no podía afrontar todas las cosas que tenía que hacer?',
    p7: '(Invertido) En el último mes, ¿con qué frecuencia ha sentido que podía controlar las dificultades que se presentaban en su vida?',
    p8: '(Invertido) En el último mes, ¿con qué frecuencia ha sentido que tenía todo bajo control?',
    p9: '(Estrés percibido) En el último mes, ¿con qué frecuencia se ha enfadado porque las cosas estaban fuera de su control?',
    p10: '(Estrés percibido) En el último mes, ¿con qué frecuencia ha sentido que las dificultades se acumulaban tanto que no podía superarlas?',

  } as const
} as const;

export type Pss10ItemId = typeof PSS10.items[number];
type Pss10ReverseId = typeof PSS10.reverse[number];
export type Pss10Answers = Partial<Record<Pss10ItemId, number>>;

const isRev = (id: Pss10ItemId): id is Pss10ReverseId =>
  (PSS10.reverse as readonly string[]).includes(id);

export function scorePss10(ans: Pss10Answers){
  const map = (id:Pss10ItemId) => isRev(id) ? (4 - (ans[id] ?? 0)) : (ans[id] ?? 0);
  const raw = (PSS10.items as readonly Pss10ItemId[]).reduce((a,id)=> a + map(id), 0);
  return { raw };
}
