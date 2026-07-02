import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';

// ── Shared primitives ─────────────────────────────────────────────────────────

export const darkTooltip = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '0.85rem',
};

const EVENT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '32px 0 16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}>{title}</h2>
    </div>
  );
}

export function ChartHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <h3 style={{ color: 'var(--text-main)', margin: '0 0 4px 0', fontSize: '0.95rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.78rem' }}>{sub}</p>
    </div>
  );
}

// ── Available parameters for the session line chart ───────────────────────────

const PARAM_OPTIONS = [
  { key: 'confianza', label: 'Confianza', color: '#6366f1', unit: '%' },
  { key: 'explicabilidad', label: 'Explicabilidad', color: '#10b981', unit: '%' },
  { key: 'carga_cognitiva', label: 'Carga Cognitiva', color: '#f59e0b', unit: '%' },
  { key: 'accuracy', label: 'Success Rate', color: '#06b6d4', unit: '%' },
  { key: 'errores_detectados', label: 'Errores', color: '#ef4444', unit: '' },
  { key: 'tiempo', label: 'Tiempo (s)', color: '#f97316', unit: 's' },
  { key: 'hcai_score', label: 'HCAI Score', color: '#8b5cf6', unit: '' },
];

// ── Subjective section ────────────────────────────────────────────────────────

/**
 * SubjectiveCharts
 * Line chart with configurable parameters per session + triangulation bar.
 */
export function SubjectiveCharts({ data }) {
  const [selectedParams, setSelectedParams] = useState(['confianza', 'accuracy']);

  function toggleParam(key) {
    setSelectedParams(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  }

  const activeParams = PARAM_OPTIONS.filter(p => selectedParams.includes(p.key));

  return (
    <>
      <SectionTitle icon="🧠" title="Métricas Subjetivas — Encuesta" />
      <div className="bottom-grid" style={{ marginBottom: '28px' }}>

        {/* ── Multi-parameter line chart ── */}
        <div className="chart-card">
          <ChartHeader
            title="Métricas por sesión"
            sub="Selecciona los parámetros que quieres visualizar en la gráfica"
          />

          {/* Parameter selector chips */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '14px',
          }}>
            {PARAM_OPTIONS.map(p => {
              const active = selectedParams.includes(p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => toggleParam(p.key)}
                  title={active ? `Ocultar ${p.label}` : `Mostrar ${p.label}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: `1.5px solid ${p.color}`,
                    background: active ? `${p.color}22` : 'transparent',
                    color: active ? p.color : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    outline: 'none',
                  }}
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: active ? p.color : 'var(--border-color)',
                    flexShrink: 0,
                    transition: 'background 0.18s ease',
                  }} />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Line chart */}
          {activeParams.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '200px', color: 'var(--text-muted)', flexDirection: 'column', gap: '8px',
            }}>
              <span style={{ fontSize: '2rem' }}>📊</span>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Selecciona al menos un parámetro</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.detalles_individuales} margin={{ right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="fecha" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={darkTooltip}
                  formatter={(value, name) => {
                    const param = PARAM_OPTIONS.find(p => p.label === name);
                    return [`${value}${param?.unit ?? ''}`, name];
                  }}
                />
                <Legend />
                {activeParams.map(p => (
                  <Line
                    key={p.key}
                    type="monotone"
                    dataKey={p.key}
                    stroke={p.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: p.color }}
                    activeDot={{ r: 5 }}
                    name={p.label}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Triangulation bar chart ── */}
        <div className="chart-card">
          <ChartHeader title="Triangulación de métricas" sub="Promedio global de todas las sesiones" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[
              { name: 'Confianza', val: data.subjetivo.confianza },
              { name: 'Explicab.', val: data.subjetivo.explicabilidad },
              { name: 'Carga Cog.', val: data.subjetivo.carga_cognitiva },
              { name: 'Success Rate', val: data.objetivo.accuracy_real_promedio },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={darkTooltip} cursor={{ fill: '#2d3748' }} />
              <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                {[0, 1, 2, 3].map((_, i) => (
                  <Cell key={i} fill={i === 2 ? '#f59e0b' : i === 3 ? '#10b981' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

// ── Objective (log) section ───────────────────────────────────────────────────

/**
 * ObjectiveCharts
 * Bar: event distribution | Bar: errors vs interactions | Scatter: time vs accuracy | Bar: ground truth.
 * Rendered only when logData is available.
 */
export function ObjectiveCharts({ logData }) {
  if (!logData) return null;

  const metEvalChart = logData.metricas_evaluador
    ? Object.entries(logData.metricas_evaluador)
      .filter(([k]) => !['rmse', 'mae', 'mape'].includes(k))
      .map(([k, v]) => ({ name: k.toUpperCase(), val: v }))
    : [];

  return (
    <>
      <SectionTitle icon="📋" title="Métricas Objetivas — Análisis de Logs" />
      <div className="bottom-grid" style={{ marginBottom: '28px' }}>

        {/* Event-type distribution */}
        <div className="chart-card">
          <ChartHeader title="Distribución de tipos de evento" sub="Cantidad de cada tipo de interacción registrada en los logs" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={logData.distribucion_eventos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="evento" stroke="#94a3b8" tick={{ fontSize: 10 }} width={120} />
              <Tooltip contentStyle={darkTooltip} />
              <Bar dataKey="count" name="Nº eventos" radius={[0, 4, 4, 0]}>
                {logData.distribucion_eventos.map((_, i) => (
                  <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Errors vs interactions per session */}
        <div className="chart-card">
          <ChartHeader title="Errores e interacciones por sesión" sub="Comparativa de errores cometidos vs clics totales registrados" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={logData.errores_por_sesion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="session" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={darkTooltip} />
              <Legend />
              <Bar dataKey="clics" name="Interacciones" fill="#6366f1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="errores" name="Errores" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bottom-grid" style={{ marginBottom: '28px' }}>

        {/* Scatter: time vs accuracy */}
        <div className="chart-card">
          <ChartHeader title="Tiempo de sesión vs Success Rate" sub="¿Las sesiones más largas obtienen mejor success rate?" />
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                dataKey="tiempo_s" name="Tiempo (s)" stroke="#94a3b8" tick={{ fontSize: 10 }}
                label={{ value: 'Tiempo (s)', position: 'insideBottom', fill: '#94a3b8', fontSize: 11, dy: 12 }}
              />
              <YAxis
                type="number"
                dataKey="accuracy" name="Success Rate (%)" stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 10 }}
                label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
              />
              <ZAxis range={[70, 70]} />
              <Tooltip contentStyle={darkTooltip} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={logData.tiempo_por_sesion} fill="#10b981" fillOpacity={0.85} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Ground truth bar */}
        <div className="chart-card">
          <ChartHeader title="Ground Truth del Evaluador" sub="Métricas técnicas de la IA introducidas manualmente al crear la prueba" />
          {metEvalChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={metEvalChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip contentStyle={darkTooltip} cursor={{ fill: '#2d3748' }} formatter={(v) => [`${v}%`]} />
                <Bar dataKey="val" name="Valor (%)" radius={[4, 4, 0, 0]}>
                  {metEvalChart.map((_, i) => (
                    <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '2rem' }}>📭</span>
              <p style={{ fontSize: '0.9rem' }}>No hay métricas del evaluador registradas</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
