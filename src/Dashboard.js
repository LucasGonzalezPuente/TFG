import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';

// ─── Tooltip oscuro reutilizable ───────────────────────────────────────────
const darkTooltip = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '0.85rem'
};

const EVENT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16'
];

// ─── Genera el informe TFG como HTML descargable ───────────────────────────
function generarInformeTFG(data, logData) {
  const ahora = new Date().toLocaleString('es-ES');
  const n = data.total_usuarios;

  const filas = data.detalles_individuales.map(s => `
    <tr>
      <td>${s.session_id.slice(-8)}</td>
      <td>${s.fecha}</td>
      <td>${s.confianza}%</td>
      <td>${s.explicabilidad}%</td>
      <td>${s.carga_cognitiva}</td>
      <td>${s.accuracy}%</td>
      <td>${s.errores_detectados}</td>
      <td><b>${s.hcai_score}</b></td>
    </tr>`).join('');

  const metEval = logData?.metricas_evaluador || {};
  const filasEval = Object.entries(metEval).map(([k, v]) =>
    `<tr><td>${k.toUpperCase()}</td><td>${v}${['rmse','mae','mape'].includes(k) ? '' : '%'}</td></tr>`
  ).join('') || '<tr><td colspan="2" style="color:#94a3b8">Sin métricas introducidas</td></tr>';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Informe TFG – HCAI Evaluation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; background: #f8fafc; padding: 40px; line-height: 1.6; }
    .cover { text-align: center; padding: 60px 0 40px; border-bottom: 3px solid #6366f1; margin-bottom: 40px; }
    .cover h1 { font-size: 2.2rem; color: #6366f1; margin-bottom: 8px; }
    .cover p { color: #64748b; }
    .cover .badge { display: inline-block; background: #6366f1; color: white; padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; margin-top: 12px; }
    h2 { font-size: 1.2rem; color: #6366f1; margin: 35px 0 15px; border-left: 4px solid #6366f1; padding-left: 12px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 30px; }
    .kpi { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .kpi .val { font-size: 1.8rem; font-weight: 800; color: #6366f1; }
    .kpi .lbl { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 30px; }
    th { background: #6366f1; color: white; padding: 12px 14px; text-align: left; font-size: 0.78rem; text-transform: uppercase; }
    td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f8fafc; }
    .section-box { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .metric-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed #e2e8f0; font-size: 0.9rem; }
    .metric-row:last-child { border: none; }
    .metric-row .val { font-weight: 700; color: #6366f1; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>Informe de Evaluación HCAI</h1>
    <p>Sistema evaluado: <strong>${data.sistema_evaluado}</strong></p>
    <p>Generado el: ${ahora}</p>
    <span class="badge">Trabajo de Fin de Grado</span>
  </div>

  <h2>1. Resumen Ejecutivo</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="val">${n}</div><div class="lbl">Sesiones</div></div>
    <div class="kpi"><div class="val">${data.subjetivo.confianza}%</div><div class="lbl">Confianza media</div></div>
    <div class="kpi"><div class="val">${data.objetivo.accuracy_real_promedio}%</div><div class="lbl">Accuracy IA (log)</div></div>
    <div class="kpi"><div class="val">${(data.subjetivo.confianza - data.objetivo.accuracy_real_promedio).toFixed(1)}%</div><div class="lbl">Gap calibración</div></div>
  </div>

  <h2>2. Métricas Subjetivas (Encuesta)</h2>
  <div class="section-box">
    <div class="metric-row"><span>Confianza media</span><span class="val">${data.subjetivo.confianza}%</span></div>
    <div class="metric-row"><span>Explicabilidad media</span><span class="val">${data.subjetivo.explicabilidad}%</span></div>
    <div class="metric-row"><span>Carga cognitiva media (NASA-TLX)</span><span class="val">${data.subjetivo.carga_cognitiva}</span></div>
  </div>

  <h2>3. Métricas Objetivas (Logs)</h2>
  <div class="section-box">
    <div class="metric-row"><span>Tiempo medio por sesión</span><span class="val">${data.objetivo.tiempo_medio}s</span></div>
    <div class="metric-row"><span>Total de interacciones registradas</span><span class="val">${logData?.resumen_objetivo?.total_interacciones ?? '—'}</span></div>
    <div class="metric-row"><span>Total de errores en logs</span><span class="val">${logData?.resumen_objetivo?.total_errores ?? '—'}</span></div>
    <div class="metric-row"><span>Tasa de error media</span><span class="val">${logData?.resumen_objetivo?.tasa_error_media ?? '—'}</span></div>
    <div class="metric-row"><span>Accuracy media desde logs</span><span class="val">${data.objetivo.accuracy_real_promedio}%</span></div>
  </div>

  <h2>4. Métricas Técnicas de la IA (Ground Truth del Evaluador)</h2>
  <div class="section-box">
    <table>
      <thead><tr><th>Métrica</th><th>Valor</th></tr></thead>
      <tbody>${filasEval}</tbody>
    </table>
  </div>

  <h2>5. Histórico de Sesiones</h2>
  <table>
    <thead>
      <tr>
        <th>ID Sesión</th><th>Fecha</th><th>Confianza</th><th>Explicabilidad</th>
        <th>Carga Cog.</th><th>Accuracy IA</th><th>Errores</th><th>HCAI Score</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>

  <div class="footer">
    Informe generado automáticamente · HCAI Research Lab · TFG ${new Date().getFullYear()}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `informe_tfg_${data.sistema_evaluado.replace(/\s+/g, '_')}_${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
function NewDashboard() {
  const [data, setData] = useState(null);
  const [logData, setLogData] = useState(null);

  useEffect(() => {
    const fetchMetrics = fetch('http://127.0.0.1:8000/api/dashboard-metrics').then(r => r.json());
    // /api/log-metrics may not exist yet — fall back to null gracefully
    const fetchLogs = fetch('http://127.0.0.1:8000/api/log-metrics')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

    Promise.all([fetchMetrics, fetchLogs])
      .then(([metrics, logs]) => {
        // Guard: detalles_individuales may be absent when total_usuarios === 0
        const detalles = Array.isArray(metrics?.detalles_individuales)
          ? metrics.detalles_individuales
          : [];
        const detallesConScore = detalles.map(s => ({
          ...s,
          hcai_score: Number(((s.confianza + s.explicabilidad + (100 - s.carga_cognitiva)) / 3).toFixed(1))
        }));
        const ranking = [...detallesConScore].sort((a, b) => b.hcai_score - a.hcai_score);
        setData({ ...metrics, detalles_individuales: detallesConScore, ranking });
        setLogData(logs);
      })
      .catch(err => {
        console.error("Error cargando dashboard:", err);
        // Ensure we exit the loading spinner even on total failure
        setData({ total_usuarios: 0, detalles_individuales: [], ranking: [] });
      });
  }, []);

  if (!data) return (
    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '80px', fontSize: '1.1rem' }}>
      ⏳ Cargando Sistema de Evaluación...
    </div>
  );
  if (data.total_usuarios === 0) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
      <h2 style={{ color: 'var(--text-main)' }}>Sin datos todavía</h2>
      <p>Cuando los usuarios completen encuestas, aparecerán aquí.</p>
    </div>
  );

  const metEvalChart = logData?.metricas_evaluador
    ? Object.entries(logData.metricas_evaluador)
        .filter(([k]) => !['rmse', 'mae', 'mape'].includes(k))
        .map(([k, v]) => ({ name: k.toUpperCase(), val: v }))
    : [];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* CABECERA */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="version-tag" style={{ fontSize: '0.95rem' }}>📊 {data.sistema_evaluado}</span>
        </div>
        <button className="primary-btn" onClick={() => generarInformeTFG(data, logData)}>
          📄 Generar Informe TFG
        </button>
      </header>

      {/* KPIs SUBJETIVOS */}
      <div className="kpi-row" style={{ marginBottom: '20px' }}>
        <div className="kpi-card-dark">
          <span className="kpi-label">Confianza Media</span>
          <span className="kpi-main-value">{data.subjetivo.confianza}%</span>
        </div>
        <div className="kpi-card-dark">
          <span className="kpi-label">Sesiones Realizadas</span>
          <span className="kpi-main-value">{data.total_usuarios}</span>
        </div>
        <div className="kpi-card-dark">
          <span className="kpi-label">Gap Calibración</span>
          <span className="kpi-main-value" style={{ color: 'var(--warning)' }}>
            {(data.subjetivo.confianza - data.objetivo.accuracy_real_promedio).toFixed(1)}%
          </span>
        </div>
        <div className="kpi-card-dark">
          <span className="kpi-label">Accuracy IA (log)</span>
          <span className="kpi-main-value" style={{ color: 'var(--accent-secondary)' }}>
            {data.objetivo.accuracy_real_promedio}%
          </span>
        </div>
      </div>

      {/* KPIs OBJETIVOS DE LOGS */}
      {logData?.resumen_objetivo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
          {[
            { label: 'Total interacciones', val: logData.resumen_objetivo.total_interacciones, icon: '🖱️' },
            { label: 'Total errores (log)', val: logData.resumen_objetivo.total_errores, icon: '⚠️', red: true },
            { label: 'Tiempo medio sesión', val: `${logData.resumen_objetivo.tiempo_medio_s}s`, icon: '⏱️' },
            { label: 'Tasa de error media', val: logData.resumen_objetivo.tasa_error_media, icon: '📉', red: true },
          ].map((k, i) => (
            <div key={i} className="kpi-card-dark" style={{ borderTop: `3px solid ${k.red ? 'var(--error)' : 'var(--accent-secondary)'}` }}>
              <span style={{ fontSize: '1.3rem' }}>{k.icon}</span>
              <span className="kpi-label" style={{ marginTop: '6px' }}>{k.label}</span>
              <span className="kpi-main-value" style={{ fontSize: '1.6rem', color: k.red ? 'var(--error)' : 'var(--accent-secondary)' }}>
                {k.val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SECCIÓN 1: SUBJETIVO */}
      <SectionTitle icon="🧠" title="Métricas Subjetivas — Encuesta" />
      <div className="bottom-grid" style={{ marginBottom: '28px' }}>
        <div className="chart-card">
          <ChartHeader title="Confianza vs Accuracy por sesión" sub="Comparativa percepción–realidad del log" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.detalles_individuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="fecha" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={darkTooltip} />
              <Legend />
              <Line type="monotone" dataKey="confianza" stroke="#6366f1" strokeWidth={2} dot={false} name="Confianza" />
              <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={false} name="Accuracy (log)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <ChartHeader title="Triangulación de métricas" sub="Promedio global de todas las sesiones" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[
              { name: 'Confianza', val: data.subjetivo.confianza },
              { name: 'Explicab.', val: data.subjetivo.explicabilidad },
              { name: 'Carga Cog.', val: data.subjetivo.carga_cognitiva },
              { name: 'Accuracy', val: data.objetivo.accuracy_real_promedio },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={darkTooltip} cursor={{ fill: '#2d3748' }} />
              <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                {[0,1,2,3].map((_, i) => (
                  <Cell key={i} fill={i === 2 ? '#f59e0b' : i === 3 ? '#10b981' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECCIÓN 2: LOGS */}
      {logData && (
        <>
          <SectionTitle icon="📋" title="Métricas Objetivas — Análisis de Logs" />
          <div className="bottom-grid" style={{ marginBottom: '28px' }}>

            {/* Distribución de tipos de evento */}
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

            {/* Errores vs interacciones por sesión */}
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

            {/* Scatter: tiempo vs accuracy */}
            <div className="chart-card">
              <ChartHeader title="Tiempo de sesión vs Accuracy IA" sub="¿Las sesiones más largas obtienen mejor accuracy?" />
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="tiempo_s"
                    name="Tiempo (s)"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Tiempo (s)', position: 'insideBottom', fill: '#94a3b8', fontSize: 11, dy: 12 }}
                  />
                  <YAxis
                    dataKey="accuracy"
                    name="Accuracy (%)"
                    stroke="#94a3b8"
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                  />
                  <ZAxis range={[70, 70]} />
                  <Tooltip contentStyle={darkTooltip} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={logData.tiempo_por_sesion} fill="#10b981" fillOpacity={0.85} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Ground truth del evaluador */}
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
      )}

      {/* SECCIÓN 3: RANKING */}
      <SectionTitle icon="🏆" title="Ranking de Sesiones" />
      <div className="widget-card" style={{ marginBottom: '28px' }}>
        {data.ranking.slice(0, 5).map((s, i) => (
          <div key={i} className="ranking-item">
            <span className="rank-number">#{i + 1}</span>
            <div style={{ flex: 1, marginLeft: '12px' }}>
              <div style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Sesión: {s.session_id.slice(-8)}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.fecha}</div>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '16px' }}>
              <span>🧠 {s.confianza}%</span>
              <span style={{ color: s.errores_detectados > 0 ? 'var(--error)' : 'inherit' }}>⚠️ {s.errores_detectados} err.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '130px' }}>
              <div className="score-bar-bg" style={{ flex: 1 }}>
                <div className="score-bar-fill" style={{ width: `${s.hcai_score}%` }} />
              </div>
              <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '0.9rem', minWidth: '32px' }}>{s.hcai_score}</span>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN 4: TABLA HISTÓRICA */}
      <SectionTitle icon="📂" title="Histórico Completo de Sesiones" />
      <div className="widget-card" style={{ overflowX: 'auto' }}>
        <table className="dark-table">
          <thead>
            <tr>
              <th>ID Sesión</th><th>Fecha</th><th>Confianza</th><th>Explicabilidad</th>
              <th>Carga Cog.</th><th>Accuracy IA</th><th>Errores</th><th>Tiempo (s)</th><th>HCAI Score</th>
            </tr>
          </thead>
          <tbody>
            {data.detalles_individuales.map((s, i) => (
              <tr key={i}>
                <td><code style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{s.session_id.slice(-8)}</code></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.fecha}</td>
                <td style={{ color: 'var(--accent-primary)' }}>{s.confianza}%</td>
                <td style={{ color: 'var(--accent-primary)' }}>{s.explicabilidad}%</td>
                <td style={{ color: 'var(--warning)' }}>{s.carga_cognitiva}</td>
                <td style={{ color: 'var(--accent-secondary)' }}>{s.accuracy}%</td>
                <td style={{ color: s.errores_detectados > 0 ? 'var(--error)' : 'var(--text-muted)' }}>{s.errores_detectados}</td>
                <td style={{ color: 'var(--text-muted)' }}>{s.tiempo ?? '—'}</td>
                <td>
                  <span style={{
                    background: s.hcai_score > 70 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: s.hcai_score > 70 ? 'var(--accent-secondary)' : 'var(--error)',
                    padding: '3px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem'
                  }}>
                    {s.hcai_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      margin: '32px 0 16px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '10px'
    }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}>{title}</h2>
    </div>
  );
}

function ChartHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <h3 style={{ color: 'var(--text-main)', margin: '0 0 4px 0', fontSize: '0.95rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.78rem' }}>{sub}</p>
    </div>
  );
}

export default NewDashboard;