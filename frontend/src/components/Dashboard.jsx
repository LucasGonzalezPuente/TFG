import React, { useEffect, useState } from 'react';
import { fetchDashboardMetrics, fetchLogMetrics, fetchPruebas } from '../api/apiService';
import { generarInformeTFG } from '../utils/reportGenerator';
import { KPIRow, LogKPIRow } from './dashboard/KPIRow';
import { SubjectiveCharts, ObjectiveCharts } from './dashboard/ChartSection';
import { RankingList, SessionTable } from './dashboard/SessionTable';

/**
 * Dashboard
 * Fetches metrics on mount, computes HCAI scores, then renders:
 *   KPIs → Subjective charts → Objective charts → Ranking → History table
 */
function Dashboard() {
  const [pruebas, setPruebas] = useState([]);
  const [selectedPruebaId, setSelectedPruebaId] = useState('');
  const [data, setData] = useState(null);
  const [logData, setLogData] = useState(null);
  const [cargando, setCargando] = useState(false);

  // 1. Fetch all experiments on mount
  useEffect(() => {
    fetchPruebas()
      .then(list => {
        setPruebas(list);
        if (list.length > 0) {
          // Sort to get the latest one (highest ID first)
          const sorted = [...list].sort((a, b) => b.id - a.id);
          setSelectedPruebaId(sorted[0].id.toString());
        }
      })
      .catch(err => console.error('Error fetching experiments:', err));
  }, []);

  // 2. Fetch metrics when selectedPruebaId changes
  useEffect(() => {
    if (!selectedPruebaId) return;

    setCargando(true);
    const pId = Number(selectedPruebaId);

    Promise.all([
      fetchDashboardMetrics(pId),
      fetchLogMetrics(pId)
    ])
      .then(([metrics, logs]) => {
        const detalles = Array.isArray(metrics?.detalles_individuales)
          ? metrics.detalles_individuales
          : [];

        const detallesConScore = detalles.map(s => ({
          ...s,
          hcai_score: Number(
            ((s.confianza + s.explicabilidad + (100 - s.carga_cognitiva)) / 3).toFixed(1)
          ),
        }));

        const ranking = [...detallesConScore].sort((a, b) => b.hcai_score - a.hcai_score);
        setData({ ...metrics, detalles_individuales: detallesConScore, ranking });
        setLogData(logs);
      })
      .catch(err => {
        console.error('Error loading dashboard:', err);
        setData({ total_usuarios: 0, detalles_individuales: [], ranking: [] });
        setLogData(null);
      })
      .finally(() => {
        setCargando(false);
      });
  }, [selectedPruebaId]);

  // ── Loading / empty states ─────────────────────────────────────────────────
  if (pruebas.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
      <h2 style={{ color: 'var(--text-main)' }}>Sin experimentos configurados</h2>
      <p>Configura un nuevo experimento en la sección "Configurar" para empezar.</p>
    </div>
  );

  if (cargando && !data) return (
    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '80px', fontSize: '1.1rem' }}>
      ⏳ Cargando Sistema de Evaluación...
    </div>
  );

  if (data && data.total_usuarios === 0) return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '600' }}>Experimento:</span>
          <select
            value={selectedPruebaId}
            onChange={(e) => setSelectedPruebaId(e.target.value)}
            style={{
              padding: '8px 16px',
              fontSize: '0.95rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--card-dark)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: '600',
              outline: 'none',
            }}
          >
            {pruebas.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre_sistema} ({p.token_version})
              </option>
            ))}
          </select>
        </div>
      </header>

      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
        <h2 style={{ color: 'var(--text-main)' }}>Sin datos todavía para esta versión</h2>
        <p>Cuando los participantes completen la evaluación de esta versión, los datos aparecerán aquí.</p>
      </div>
    </div>
  );

  if (!data) return null;

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '600' }}>Experimento:</span>
          <select
            value={selectedPruebaId}
            onChange={(e) => setSelectedPruebaId(e.target.value)}
            style={{
              padding: '8px 16px',
              fontSize: '0.95rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--card-dark)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: '600',
              outline: 'none',
            }}
          >
            {pruebas.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre_sistema} ({p.token_version})
              </option>
            ))}
          </select>
        </div>
        <button className="primary-btn" onClick={() => generarInformeTFG(data, logData)}>
          📄 Generar Informe
        </button>
      </header>

      {/* KPIs */}
      <KPIRow data={data} />
      <LogKPIRow resumen={logData?.resumen_objetivo} />

      {/* Charts */}
      <SubjectiveCharts data={data} />
      <ObjectiveCharts logData={logData} />

      {/* Tables */}
      <RankingList ranking={data.ranking} />
      <SessionTable detalles={data.detalles_individuales} />
    </div>
  );
}

export default Dashboard;
