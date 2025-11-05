import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RowInput } from 'jspdf-autotable'; // 👈 importación de solo tipo

export type Role = 'student' | 'psych' | 'admin';
export type UserDoc = {
  id: string;
  name?: string;
  email?: string;
  role?: Role;
  orgId?: string | null;
  cohortId?: string | null;
};

export type Submission = {
  id: string;
  createdAt?: any;       // Firestore Timestamp
  instrumentId?: string; // "dass21" | "pss10" | ...
  scores?: any;          // { depression, anxiety, stress } o { total } etc.
  model?: { risk?: number; category?: 'low'|'med'|'high' };
};

function riskLabel(cat?: 'low'|'med'|'high') {
  if (cat === 'low') return 'Bajo';
  if (cat === 'med') return 'Medio';
  if (cat === 'high') return 'Alto';
  return '—';
}

function fmtDate(ts?: any) {
  const d: Date | undefined = ts?.toDate?.();
  if (!d) return '—';
  return dayjs(d).format('YYYY-MM-DD HH:mm');
}

function lastKpis(subs: Submission[]) {
  if (!subs.length) return { wellbeing: '—', risk: '—', lastAt: '—' };
  const last = subs[0];
  const r = last.model?.risk;
  const wellbeing = r != null ? `${Math.round(100 - r*100)}/100` : '—';
  return { wellbeing, risk: riskLabel(last.model?.category), lastAt: fmtDate(last.createdAt) };
}

/** Genera y descarga un PDF con resumen y tabla de respuestas */
export async function exportUserReportPDF(user: UserDoc, subs: Submission[]) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  let y = 64;

  // Encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MindTrack Campus — Reporte de Evaluaciones', marginX, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generado: ${dayjs().format('YYYY-MM-DD HH:mm')}`, marginX, y);
  y += 22;

  // Datos del usuario
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Datos del usuario', marginX, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const uLines = [
    `Nombre: ${user.name ?? '—'}`,
    `Email: ${user.email ?? '—'}`,
    `Rol: ${user.role ?? 'student'}    Org: ${user.orgId ?? '—'}   UID: ${user.id}`,
  ];
  uLines.forEach(line => { doc.text(line, marginX, y); y += 14; });

  // KPIs
  y += 6;
  const k = lastKpis(subs);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen (última evaluación)', marginX, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(`Bienestar: ${k.wellbeing}     Riesgo: ${k.risk}     Última: ${k.lastAt}`, marginX, y);
  y += 18;

  // Tabla de submissions
  doc.setFont('helvetica', 'bold');
  doc.text('Historial de evaluaciones', marginX, y);
  y += 8;

  const rows: RowInput[] = subs.map(s => {
    const instrument = (s.instrumentId ?? '—').toUpperCase();
    const detail =
      s.instrumentId === 'dass21' && s.scores
        ? `D:${s.scores.depression ?? '—'}  A:${s.scores.anxiety ?? '—'}  S:${s.scores.stress ?? '—'}`
        : s.instrumentId === 'pss10' && s.scores
        ? `Total:${s.scores.total ?? '—'}`
        : '—';
    const risk = riskLabel(s.model?.category);
    const riskPct = s.model?.risk != null ? `${Math.round(s.model.risk*100)}%` : '—';
    return [fmtDate(s.createdAt), instrument, detail, risk, riskPct] as RowInput;
  });

  autoTable(doc, {
    startY: y + 8,
    head: [['Fecha', 'Instrumento', 'Detalle', 'Riesgo', '% Riesgo']],
    body: rows,
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: marginX, right: marginX },
  });

  // Guardar
  const file = `Reporte_${(user.name || user.email || user.id).replace(/\s+/g,'_')}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
  doc.save(file);
}
