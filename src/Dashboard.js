import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, LineChart, Line
} from 'recharts';
import './App.css'; 

// --- COMPONENTE MODAL DE DETALLE ---
const SessionDetailModal = ({ sesion, onClose }) => {
  if (!sesion) return null;
  const diff = (sesion.accuracy - (sesion.avgAccuracy || 0)).toFixed(1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-effect" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-title-group">
            <h2>Detalle de Sesión</h2>
            <code className="session-tag">ID: {sesion.session_id.substring(0, 12)}...</code>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </header>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-card-modern">
              <span className="card-icon">🤖</span>
              <div className="card-info">
                <span className="card-label">Precisión IA</span>
                <p className="card-value" style={{color: sesion.accuracy > 80 ? '#10B981' : '#EF4444'}}>{sesion.accuracy}%</p>
              </div>
            </div>
            <div className="detail-card-modern">
              <span className="card-icon">⏱️</span>
              <div className="card-info">
                <span className="card-label">Tiempo Total</span>
                <p className="card-value">{sesion.tiempo}s</p>
              </div>
            </div>
            <div className="detail-card-modern">
              <span className="card-icon">🧠</span>
              <div className="card-info">
                <span className="card-label">Confianza</span>
                <p className="card-value" style={{color: '#2563EB'}}>{sesion.confianza}%</p>
              </div>
            </div>
            <div className="detail-card-modern">
              <span className="card-icon">📊</span>
              <div className="card-info">
                <span className="card-label">Carga NASA</span>
                <p className="card-value">{sesion.carga_cognitiva}</p>
              </div>
            </div>
          </div>
          <div className="comparison-banner">
            <div className="comparison-icon">📈</div>
            <div className="comparison-text">
              <strong>Análisis Comparativo:</strong> Esta sesión tuvo un rendimiento 
              <span className={`diff-badge ${diff >= 0 ? 'positive' : 'negative'}`}>
                {diff >= 0 ? `+${diff}` : diff}%
              </span> respecto a la media global.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL: DASHBOARD ---
function Dashboard() {
  const [data, setData] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [pruebas, setPruebas] = useState([]);
  const [seleccion, setSeleccion] = useState({ a: '', b: '' });
  const [datosComp, setDatosComp] = useState([]);

  // 1. Carga de datos inicial
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard-metrics')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Error cargando métricas:", err));

    fetch('http://127.0.0.1:8000/api/pruebas-realizadas')
      .then(res => res.json())
      .then(setPruebas)
      .catch(err => console.error("Error cargando pruebas:", err));
  }, []);

  // 2. Carga de comparativa A/B
  useEffect(() => {
    if (seleccion.a && seleccion.b) {
      fetch(`http://127.0.0.1:8000/api/compare-tests/${seleccion.a}/${seleccion.b}`)
        .then(res => res.json())
        .then(setDatosComp)
        .catch(err => console.error("Error en comparativa:", err));
    }
  }, [seleccion]);

  if (!data || !data.subjetivo) return <div className="loading">Cargando análisis HCAI...</div>;

  // Lógica de Calibración
  const accuracyReal = data.objetivo.accuracy_real_promedio || 0;
  const confianzaPercibida = data.subjetivo.confianza;
  const gapConfianza = confianzaPercibida - accuracyReal;
  const absGapConfianza = Math.abs(gapConfianza).toFixed(1);

  let configEstado = {
    label: "Calibrada", color: "#10B981", bgColor: "#ECFDF5", icon: "✅",
    desc: "La confianza del usuario se alinea con el éxito real del sistema.",
    riesgo: "✅ Mínimo. El usuario usa la herramienta de forma adecuada.",
    recomendacion: "Mantener el nivel actual de transparencia."
  };

  if (gapConfianza > 15) {
    configEstado = {
      label: "Sobre-confianza (Overtrust)", color: "#EF4444", bgColor: "#FEF2F2", icon: "🛡️",
      desc: "El usuario confía en el sistema más de lo que este realmente acierta.",
      riesgo: "⚠️ Alto. El usuario podría aceptar decisiones erróneas.",
      recomendacion: "Aumentar explicabilidad para mostrar limitaciones."
    };
  } else if (gapConfianza < -15) {
    configEstado = {
      label: "Sub-confianza (Undertrust)", color: "#F59E0B", bgColor: "#FFFBEB", icon: "🔍",
      desc: "El usuario infravalora la capacidad real de la IA.",
      riesgo: "⚠️ Medio. El usuario podría ignorar recomendaciones válidas.",
      recomendacion: "Mejorar la presentación de fiabilidad técnica."
    };
  }

  // Preparación de datos para gráficos
  const dataEvolucion = data.detalles_individuales?.map((s, index) => ({
    name: `S${index + 1}`,
    confianza: s.confianza,
    accuracy: s.accuracy,
  })).reverse() || [];

  const dataRadar = [
    { subject: 'Exactitud', A: data.evaluador?.accuracy_esperado || 100, B: accuracyReal, C: confianzaPercibida },
    { subject: 'Explicabilidad', A: 100, B: 85, C: data.subjetivo.explicabilidad },
    { subject: 'Carga Mental', A: 100, B: 90, C: data.subjetivo.carga_cognitiva },
  ];

  const dataNASA = [
    { name: 'Mental', valor: 65 }, { name: 'Física', valor: 20 },  
    { name: 'Temporal', valor: 45 }, { name: 'Rendimiento', valor: 80 }, 
    { name: 'Esfuerzo', valor: 70 }, { name: 'Frustración', valor: 30 } 
  ];

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '20px' }}>
      
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h1>Análisis Human-Centered AI</h1>
          <p className="subtitle">Panel de Control de Métricas Centradas en el Humano</p>
        </div>
        <div className="header-actions">
          <span className="system-badge">{data.sistema_evaluado}</span>
          <button className="secondary-btn" onClick={() => {
            window.scrollTo(0,0); // Asegura que empiece desde arriba
            setTimeout(() => window.print(), 500); // Da tiempo a que los gráficos se estabilicen
          }}>
            💾 Exportar Informe PDF
          </button>
        </div>
      </header>

      {/* 1. SECCIÓN: EVOLUCIÓN TEMPORAL (Ancho completo) */}
      <div className="chart-card" style={{ border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3>Evolución de la Confianza vs Exactitud</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Seguimiento histórico de la calibración entre el usuario y el sistema.</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dataEvolucion}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" padding={{ left: 30, right: 30 }} />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
            <Legend verticalAlign="top" align="right" height={40} />
            <Line type="monotone" dataKey="confianza" name="Confianza Humana" stroke="#2563EB" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="accuracy" name="Exactitud IA" stroke="#10B981" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. SECCIÓN: CALIBRACIÓN Y KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
        <div className="calibration-alert-card new-design" style={{ borderLeft: `8px solid ${configEstado.color}`, backgroundColor: configEstado.bgColor, margin: 0 }}>
          <div className="calibration-column status-info">
            <div className="status-icon" style={{ backgroundColor: configEstado.color }}>{configEstado.icon}</div>
            <div className="status-text-block">
              <span className="status-label">Calibración</span>
              <h2 style={{ color: configEstado.color, margin: '4px 0' }}>{configEstado.label}</h2>
              <p className="status-desc" style={{ fontSize: '0.9rem' }}>{configEstado.desc}</p>
            </div>
          </div>
          <div className="calibration-column metric-info">
            <div className="gap-value-block">
              <span className="gap-value">{absGapConfianza}%</span>
              <span className="gap-desc">Brecha</span>
            </div>
          </div>
        </div>

        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="kpi-card highlight">
            <span className="kpi-label">IA Accuracy</span>
            <div className="kpi-value">{accuracyReal}%</div>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">NASA-TLX</span>
            <div className="kpi-value">{data.subjetivo.carga_cognitiva}</div>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN: COMPARATIVA Y TRIANGULACIÓN */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3>Comparativa A vs B</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              <select onChange={(e) => setSeleccion({...seleccion, a: e.target.value})} className="select-input" style={{ padding: '4px', fontSize: '0.8rem' }}>
                <option value="">Base</option>
                {pruebas.map(p => <option key={p.id} value={p.token_version}>{p.nombre_sistema}</option>)}
              </select>
              <select onChange={(e) => setSeleccion({...seleccion, b: e.target.value})} className="select-input" style={{ padding: '4px', fontSize: '0.8rem' }}>
                <option value="">Nueva</option>
                {pruebas.map(p => <option key={p.id} value={p.token_version}>{p.nombre_sistema}</option>)}
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {datosComp.length > 0 ? (
              <BarChart data={datosComp}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="sistemaA" fill="#94a3b8" name="A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sistemaB" fill="#6366f1" name="B" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : <div className="placeholder-text">Selecciona versiones para comparar</div>}
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Triangulación HCAI</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={dataRadar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar name="IA" dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
              <Radar name="Humano" dataKey="C" stroke="#2563EB" fill="#2563EB" fillOpacity={0.5} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. SECCIÓN: NASA Y TABLA */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div className="chart-card">
          <h3>Carga Mental (NASA-TLX)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dataNASA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="valor" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card table-container">
          <h3>Registro de Sesiones</h3>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #f1f5f9' }}>ID</th>
                <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid #f1f5f9' }}>IA Acc.</th>
                <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid #f1f5f9' }}>Confianza</th>
              </tr>
            </thead>
            <tbody>
              {data.detalles_individuales?.slice(0, 5).map((row, i) => (
                <tr key={i} onClick={() => setSelectedSession({...row, avgAccuracy: accuracyReal})} style={{ cursor: 'pointer' }} className="table-row-hover">
                  <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}><code>{row.session_id.substring(0, 5)}</code></td>
                  <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                    <span className={`status-pill ${row.accuracy > 80 ? 'green' : 'red'}`}>{row.accuracy}%</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{row.confianza}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSession && <SessionDetailModal sesion={selectedSession} onClose={() => setSelectedSession(null)} />}
    </div>
  );
}

export default Dashboard;