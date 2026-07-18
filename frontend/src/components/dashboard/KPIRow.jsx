import React from 'react';

/**
 * KPICard
 * Single metric tile used in the dashboard header row.
 *
 * Props:
 *   label      – string
 *   value      – string | number
 *   color      – optional CSS color string
 *   topBorder  – optional CSS color string (coloured top-border accent)
 *   icon       – optional emoji/string shown above label
 */
export function KPICard({ label, value, color, topBorder, icon }) {
  return (
    <div
      className="kpi-card-dark"
      style={topBorder ? { borderTop: `3px solid ${topBorder}` } : undefined}
    >
      {icon && <span style={{ fontSize: '1.3rem' }}>{icon}</span>}
      <span className="kpi-label" style={icon ? { marginTop: '6px' } : undefined}>{label}</span>
      <span
        className="kpi-main-value"
        style={color ? { color, ...(icon ? { fontSize: '1.6rem' } : {}) } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * KPIRow
 * Renders the primary subjective KPI strip (confianza, sesiones, gap, accuracy).
 *
 * Props:
 *   data – dashboard-metrics response object
 */
export function KPIRow({ data }) {
  const gap = (data.subjetivo.confianza - data.objetivo.accuracy_real_promedio).toFixed(1);

  return (
    <div className="kpi-row" style={{ marginBottom: '20px' }}>
      <KPICard label="Confianza Media"     value={`${data.subjetivo.confianza}%`} />
      <KPICard label="Sesiones Realizadas" value={data.total_usuarios} />
      <KPICard label="Gap Calibración"     value={`${gap}%`} color="var(--warning)" />
      <KPICard
        label="Success Rate (log)"
        value={`${data.objetivo.accuracy_real_promedio}%`}
        color="var(--accent-secondary)"
      />
    </div>
  );
}

/**
 * LogKPIRow
 * Secondary KPI strip rendered only when logData.resumen_objetivo is present.
 *
 * Props:
 *   resumen – logData.resumen_objetivo object
 */
export function LogKPIRow({ resumen }) {
  if (!resumen) return null;

  const cards = [
    { label: 'Total interacciones', value: resumen.total_interacciones,            icon: '🖱️', red: false },
    { label: 'Total errores (log)', value: resumen.total_errores,                  icon: '⚠️', red: true  },
    { label: 'Tiempo medio sesión', value: `${resumen.tiempo_medio_s}s`,           icon: '⏱️', red: false },
    { label: 'Tasa de error media', value: resumen.tasa_error_media,               icon: '📉', red: true  },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
      {cards.map((c, i) => (
        <KPICard
          key={i}
          label={c.label}
          value={c.value}
          icon={c.icon}
          color={c.red ? 'var(--error)' : 'var(--accent-secondary)'}
          topBorder={c.red ? 'var(--error)' : 'var(--accent-secondary)'}
        />
      ))}
    </div>
  );
}
