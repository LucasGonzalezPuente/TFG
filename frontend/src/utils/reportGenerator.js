/**
 * reportGenerator.js
 * Generates and auto-downloads a self-contained HTML report for the TFG.
 * Called from Dashboard with the current data / logData snapshots.
 */
export function generarInformeTFG(data, logData) {
  const ahora = new Date().toLocaleString('es-ES');
  const n     = data.total_usuarios;

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

  const metEval     = logData?.metricas_evaluador || {};
  const filasEval   = Object.entries(metEval).map(([k, v]) =>
    `<tr><td>${k.toUpperCase()}</td><td>${v}${['rmse','mae','mape'].includes(k) ? '' : '%'}</td></tr>`
  ).join('') || '<tr><td colspan="2" style="color:#94a3b8">Sin métricas introducidas</td></tr>';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Informe TFG – HCAI Evaluation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;color:#1e293b;background:#f8fafc;padding:40px;line-height:1.6}
    .cover{text-align:center;padding:60px 0 40px;border-bottom:3px solid #6366f1;margin-bottom:40px}
    .cover h1{font-size:2.2rem;color:#6366f1;margin-bottom:8px}
    .cover p{color:#64748b}
    .cover .badge{display:inline-block;background:#6366f1;color:white;padding:4px 14px;border-radius:20px;font-size:.85rem;margin-top:12px}
    h2{font-size:1.2rem;color:#6366f1;margin:35px 0 15px;border-left:4px solid #6366f1;padding-left:12px}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:30px}
    .kpi{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.05)}
    .kpi .val{font-size:1.8rem;font-weight:800;color:#6366f1}
    .kpi .lbl{font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
    table{width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:30px}
    th{background:#6366f1;color:white;padding:12px 14px;text-align:left;font-size:.78rem;text-transform:uppercase}
    td{padding:11px 14px;border-bottom:1px solid #f1f5f9;font-size:.85rem}
    tr:last-child td{border-bottom:none}
    tr:nth-child(even) td{background:#f8fafc}
    .section-box{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px}
    .metric-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #e2e8f0;font-size:.9rem}
    .metric-row:last-child{border:none}
    .metric-row .val{font-weight:700;color:#6366f1}
    .footer{text-align:center;margin-top:50px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:.8rem}
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
    <div class="kpi"><div class="val">${data.objetivo.accuracy_real_promedio}%</div><div class="lbl">Success Rate (log)</div></div>
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
    <table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>${filasEval}</tbody></table>
  </div>

  <h2>5. Histórico de Sesiones</h2>
  <table>
    <thead>
      <tr>
        <th>ID Sesión</th><th>Fecha</th><th>Confianza</th><th>Explicabilidad</th>
        <th>Carga Cog.</th><th>Success Rate</th><th>Errores</th><th>HCAI Score</th>
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
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `informe_tfg_${data.sistema_evaluado.replace(/\s+/g, '_')}_${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
