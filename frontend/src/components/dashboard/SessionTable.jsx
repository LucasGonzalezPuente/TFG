import React from 'react';
import { SectionTitle } from './ChartSection';

// ── Ranking list ──────────────────────────────────────────────────────────────

/**
 * RankingList
 * Shows the top-5 sessions ordered by HCAI score.
 */
export function RankingList({ ranking }) {
  return (
    <>
      <SectionTitle icon="🏆" title="Ranking de Sesiones" />
      <div className="widget-card" style={{ marginBottom: '28px' }}>
        {ranking.slice(0, 5).map((s, i) => (
          <div key={i} className="ranking-item">
            <span className="rank-number">#{i + 1}</span>
            <div style={{ flex: 1, marginLeft: '12px' }}>
              <div style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Sesión: {s.session_id.slice(-8)}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.fecha}</div>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '16px' }}>
              <span>🧠 {s.confianza}%</span>
              <span style={{ color: s.errores_detectados > 0 ? 'var(--error)' : 'inherit' }}>
                ⚠️ {s.errores_detectados} err.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '130px' }}>
              <div className="score-bar-bg" style={{ flex: 1 }}>
                <div className="score-bar-fill" style={{ width: `${s.hcai_score}%` }} />
              </div>
              <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '0.9rem', minWidth: '32px' }}>
                {s.hcai_score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Full history table ────────────────────────────────────────────────────────

/**
 * SessionTable
 * Complete historical table of all sessions.
 */
export function SessionTable({ detalles }) {
  return (
    <>
      <SectionTitle icon="📂" title="Histórico Completo de Sesiones" />
      <div className="widget-card" style={{ overflowX: 'auto' }}>
        <table className="dark-table">
          <thead>
            <tr>
              <th>ID Sesión</th><th>Fecha</th><th>Confianza</th><th>Explicabilidad</th>
              <th>Carga Cog.</th><th>Success Rate</th><th>Errores</th><th>Tiempo (s)</th><th>HCAI Score</th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((s, i) => (
              <tr key={i}>
                <td><code style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{s.session_id.slice(-8)}</code></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.fecha}</td>
                <td style={{ color: 'var(--accent-primary)' }}>{s.confianza}%</td>
                <td style={{ color: 'var(--accent-primary)' }}>{s.explicabilidad}%</td>
                <td style={{ color: 'var(--warning)' }}>{s.carga_cognitiva}</td>
                <td style={{ color: 'var(--accent-secondary)' }}>{s.accuracy}%</td>
                <td style={{ color: s.errores_detectados > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                  {s.errores_detectados}
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{s.tiempo ?? '—'}</td>
                <td>
                  <span style={{
                    background: s.hcai_score > 70 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: s.hcai_score > 70 ? 'var(--accent-secondary)' : 'var(--error)',
                    padding: '3px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem',
                  }}>
                    {s.hcai_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
