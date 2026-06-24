import React from 'react';

/**
 * SuccessCard
 * Shown after a survey is successfully submitted.
 *
 * Props:
 *   onReset – () => void  (resets survey state so a new one can begin)
 */
function SuccessCard({ onReset }) {
  return (
    <div className="success-card fade-in">
      <div className="icon-check">✓</div>
      <h2>¡Muchas gracias!</h2>
      <p>Tus datos se han guardado correctamente.</p>
      <button className="primary-btn" onClick={onReset}>
        Nueva Evaluación
      </button>
    </div>
  );
}

export default SuccessCard;
