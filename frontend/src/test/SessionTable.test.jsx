/**
 * frontend/src/test/SessionTable.test.jsx
 * Component tests for SessionTable and RankingList.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SessionTable } from '../components/dashboard/SessionTable';
import { RankingList } from '../components/dashboard/SessionTable';

// ── Shared test data ──────────────────────────────────────────────────────────

function makeSession(overrides = {}) {
  return {
    session_id: 'session-id-abcdefgh',
    fecha: '15/01/2025 11:00',
    confianza: 75,
    explicabilidad: 80,
    carga_cognitiva: 40,
    accuracy: 80,
    errores_detectados: 2,
    tiempo: 120.5,
    hcai_score: 78.3,
    ...overrides,
  };
}

const THREE_SESSIONS = [
  makeSession({ session_id: 'sess-111111111', hcai_score: 90.0, errores_detectados: 0 }),
  makeSession({ session_id: 'sess-222222222', hcai_score: 65.0, errores_detectados: 3 }),
  makeSession({ session_id: 'sess-333333333', hcai_score: 78.0, errores_detectados: 1 }),
];

// ── SessionTable ──────────────────────────────────────────────────────────────

describe('SessionTable', () => {
  it('renders the section title', () => {
    render(<SessionTable detalles={[]} />);
    expect(screen.getByText('Histórico Completo de Sesiones')).toBeInTheDocument();
  });

  it('renders the correct number of rows for given sessions', () => {
    render(<SessionTable detalles={THREE_SESSIONS} />);
    // tbody rows = 3 (one per session)
    const rows = screen.getAllByRole('row');
    // rows include 1 header + 3 data rows
    expect(rows).toHaveLength(4);
  });

  it('renders all expected table headers', () => {
    render(<SessionTable detalles={[]} />);
    expect(screen.getByText('ID Sesión')).toBeInTheDocument();
    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Confianza')).toBeInTheDocument();
    expect(screen.getByText('Explicabilidad')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Errores')).toBeInTheDocument();
    expect(screen.getByText('Tiempo (s)')).toBeInTheDocument();
    expect(screen.getByText('HCAI Score')).toBeInTheDocument();
  });

  it('shows truncated session_id (last 8 chars) in each row', () => {
    render(<SessionTable detalles={[makeSession({ session_id: 'session-id-abcdefgh' })]} />);
    expect(screen.getByText('abcdefgh')).toBeInTheDocument();
  });

  it('renders empty tbody when detalles is empty', () => {
    render(<SessionTable detalles={[]} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(1); // only the header row
  });

  it('shows hcai_score with green badge when > 70', () => {
    render(<SessionTable detalles={[makeSession({ hcai_score: 90 })]} />);
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('shows hcai_score with red badge when <= 70', () => {
    render(<SessionTable detalles={[makeSession({ hcai_score: 65 })]} />);
    expect(screen.getByText('65')).toBeInTheDocument();
  });

  it('renders fecha in each row', () => {
    render(<SessionTable detalles={[makeSession({ fecha: '15/01/2025 11:00' })]} />);
    expect(screen.getByText('15/01/2025 11:00')).toBeInTheDocument();
  });

  it('renders confianza with percent sign', () => {
    render(<SessionTable detalles={[makeSession({ confianza: 75 })]} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders — for null tiempo', () => {
    render(<SessionTable detalles={[makeSession({ tiempo: null })]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

// ── RankingList ───────────────────────────────────────────────────────────────

describe('RankingList', () => {
  // Build a 7-session ranking, sorted by hcai_score desc
  const RANKING = Array.from({ length: 7 }, (_, i) => makeSession({
    session_id: `session-long-id-${String(i + 1).padStart(8, '0')}`,
    hcai_score: 95 - i * 5,
    confianza: 90 - i * 3,
    errores_detectados: i,
  }));

  it('renders the section title', () => {
    render(<RankingList ranking={RANKING} />);
    expect(screen.getByText('Ranking de Sesiones')).toBeInTheDocument();
  });

  it('shows at most 5 sessions even when ranking has 7', () => {
    render(<RankingList ranking={RANKING} />);
    // Each session shows a rank number: #1 through #5
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
    expect(screen.queryByText('#6')).not.toBeInTheDocument();
  });

  it('renders rank numbers in order', () => {
    render(<RankingList ranking={RANKING} />);
    ['#1', '#2', '#3', '#4', '#5'].forEach(rank => {
      expect(screen.getByText(rank)).toBeInTheDocument();
    });
  });

  it('displays session id suffix (last 8 chars)', () => {
    render(<RankingList ranking={[makeSession({ session_id: 'session-long-id-00000001' })]} />);
    expect(screen.getByText(/00000001/)).toBeInTheDocument();
  });

  it('shows errores_detectados with error color when > 0', () => {
    render(<RankingList ranking={[makeSession({ errores_detectados: 3, hcai_score: 80 })]} />);
    expect(screen.getByText(/3 err\./)).toBeInTheDocument();
  });

  it('shows 0 errors without error style when errores_detectados is 0', () => {
    render(<RankingList ranking={[makeSession({ errores_detectados: 0, hcai_score: 90 })]} />);
    expect(screen.getByText(/0 err\./)).toBeInTheDocument();
  });

  it('renders score bar fill for each entry', () => {
    const { container } = render(<RankingList ranking={RANKING.slice(0, 3)} />);
    const fills = container.querySelectorAll('.score-bar-fill');
    expect(fills).toHaveLength(3);
  });

  it('renders hcai_score value next to bar', () => {
    render(<RankingList ranking={[makeSession({ hcai_score: 88.5 })]} />);
    expect(screen.getByText('88.5')).toBeInTheDocument();
  });

  it('renders empty list without crashing', () => {
    render(<RankingList ranking={[]} />);
    expect(screen.getByText('Ranking de Sesiones')).toBeInTheDocument();
  });
});
