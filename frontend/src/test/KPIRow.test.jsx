/**
 * frontend/src/test/KPIRow.test.jsx
 * Component tests for KPICard, KPIRow, and LogKPIRow.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard, KPIRow, LogKPIRow } from '../components/dashboard/KPIRow';

// ── KPICard ───────────────────────────────────────────────────────────────────

describe('KPICard', () => {
  it('renders the label', () => {
    render(<KPICard label="Confianza Media" value="75%" />);
    expect(screen.getByText('Confianza Media')).toBeInTheDocument();
  });

  it('renders the value', () => {
    render(<KPICard label="Sesiones" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the icon when provided', () => {
    render(<KPICard label="Test" value="0" icon="🧠" />);
    expect(screen.getByText('🧠')).toBeInTheDocument();
  });

  it('does not render an icon span when icon prop is absent', () => {
    const { container } = render(<KPICard label="Test" value="0" />);
    // No span with emoji content expected
    expect(screen.queryByText('🧠')).not.toBeInTheDocument();
  });

  it('applies topBorder inline style when provided', () => {
    const { container } = render(<KPICard label="L" value="V" topBorder="red" />);
    const card = container.firstChild;
    expect(card.style.borderTop).toBe('3px solid red');
  });

  it('has no borderTop style when topBorder is absent', () => {
    const { container } = render(<KPICard label="L" value="V" />);
    const card = container.firstChild;
    expect(card.style.borderTop).toBe('');
  });
});

// ── KPIRow ────────────────────────────────────────────────────────────────────

describe('KPIRow', () => {
  const mockData = {
    subjetivo: { confianza: 80, explicabilidad: 70, carga_cognitiva: 30 },
    objetivo:  { tiempo_medio: 95.5, accuracy_real_promedio: 65 },
    total_usuarios: 10,
  };

  it('renders "Confianza Media" KPI', () => {
    render(<KPIRow data={mockData} />);
    expect(screen.getByText('Confianza Media')).toBeInTheDocument();
  });

  it('renders "Sesiones Realizadas" KPI', () => {
    render(<KPIRow data={mockData} />);
    expect(screen.getByText('Sesiones Realizadas')).toBeInTheDocument();
  });

  it('renders "Gap Calibración" KPI', () => {
    render(<KPIRow data={mockData} />);
    expect(screen.getByText('Gap Calibración')).toBeInTheDocument();
  });

  it('renders "Success Rate (log)" KPI', () => {
    render(<KPIRow data={mockData} />);
    expect(screen.getByText('Success Rate (log)')).toBeInTheDocument();
  });

  it('computes calibration gap correctly', () => {
    // confianza=80, accuracy=65 → gap = 15.0
    render(<KPIRow data={mockData} />);
    expect(screen.getByText('15.0%')).toBeInTheDocument();
  });

  it('displays confianza value with percent sign', () => {
    render(<KPIRow data={mockData} />);
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('displays total_usuarios count', () => {
    render(<KPIRow data={mockData} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('displays accuracy value with percent sign', () => {
    render(<KPIRow data={mockData} />);
    expect(screen.getByText('65%')).toBeInTheDocument();
  });
});

// ── LogKPIRow ─────────────────────────────────────────────────────────────────

describe('LogKPIRow', () => {
  it('renders nothing when resumen is undefined', () => {
    const { container } = render(<LogKPIRow resumen={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when resumen is null', () => {
    const { container } = render(<LogKPIRow resumen={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all 4 KPI cards when resumen is provided', () => {
    const resumen = {
      total_interacciones: 150,
      total_errores: 5,
      tiempo_medio_s: 95.3,
      tasa_error_media: '3.3%',
    };
    render(<LogKPIRow resumen={resumen} />);
    expect(screen.getByText('Total interacciones')).toBeInTheDocument();
    expect(screen.getByText('Total errores (log)')).toBeInTheDocument();
    expect(screen.getByText('Tiempo medio sesión')).toBeInTheDocument();
    expect(screen.getByText('Tasa de error media')).toBeInTheDocument();
  });

  it('displays correct interacciones value', () => {
    const resumen = { total_interacciones: 150, total_errores: 5, tiempo_medio_s: 90, tasa_error_media: '3%' };
    render(<LogKPIRow resumen={resumen} />);
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('displays tiempo with "s" suffix', () => {
    const resumen = { total_interacciones: 10, total_errores: 0, tiempo_medio_s: 95.3, tasa_error_media: '0%' };
    render(<LogKPIRow resumen={resumen} />);
    expect(screen.getByText('95.3s')).toBeInTheDocument();
  });

  it('renders icons for each card', () => {
    const resumen = { total_interacciones: 10, total_errores: 2, tiempo_medio_s: 60, tasa_error_media: '5%' };
    render(<LogKPIRow resumen={resumen} />);
    // Check icons are rendered
    expect(screen.getByText('⏱️')).toBeInTheDocument();
    expect(screen.getByText('📉')).toBeInTheDocument();
  });
});
