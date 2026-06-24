import React from 'react';

/**
 * SurveySelector
 * First screen shown to participants: pick an experiment and read its task.
 *
 * Props:
 *   pruebas            – array of { id, nombre_sistema, descripcion_tarea }
 *   pruebaSeleccionada – string (current value of the select)
 *   onSelect           – (value: string) => void
 *   onComenzar         – () => void  (also sets encuestaEmpezada)
 */
function SurveySelector({ pruebas, pruebaSeleccionada, onSelect, onComenzar }) {
  const pruebActual = pruebas.find(p => p.id === Number(pruebaSeleccionada));

  return (
    <div
      className="survey-container fade-in"
      style={{ textAlign: 'center', maxWidth: '640px', margin: '50px auto' }}
    >
      <h1 style={{ color: 'var(--text-main)' }}>Bienvenido al Experimento</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Selecciona el sistema que vas a evaluar para ver tu tarea asignada:
      </p>

      <select
        value={pruebaSeleccionada}
        onChange={(e) => onSelect(e.target.value)}
        className="metric-input"
        style={{ width: '100%', padding: '15px', fontSize: '1.1rem', margin: '20px 0', borderRadius: '10px' }}
      >
        <option value="">-- Elige una versión --</option>
        {pruebas.map(p => (
          <option key={p.id} value={p.id}>{p.nombre_sistema}</option>
        ))}
      </select>

      {pruebActual?.descripcion_tarea && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid var(--accent-primary)',
          borderRadius: '12px',
          padding: '20px',
          margin: '0 0 25px 0',
          textAlign: 'left',
        }}>
          <p style={{ color: 'var(--accent-primary)', fontWeight: '700', margin: '0 0 8px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            📋 Tu tarea
          </p>
          <p style={{ color: 'var(--text-main)', margin: 0, lineHeight: '1.6' }}>
            {pruebActual.descripcion_tarea}
          </p>
        </div>
      )}

      <button
        disabled={!pruebaSeleccionada}
        className="primary-btn"
        onClick={onComenzar}
      >
        Comenzar Evaluación
      </button>
    </div>
  );
}

export default SurveySelector;
