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
    <div className="survey-container fade-in" style={{
      maxWidth: '500px',
      margin: '60px auto',
      textAlign: 'center',
      padding: '50px 30px',
      background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.1)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)',
        marginBottom: '10px',
        animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      
      <h2 style={{ 
        color: 'white', 
        fontSize: '2.2rem', 
        margin: '0',
        fontWeight: '800',
        background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        ¡Muchas gracias!
      </h2>
      
      <p style={{ 
        color: 'var(--text-muted)', 
        fontSize: '1.1rem', 
        margin: '0 0 10px 0',
        lineHeight: '1.5'
      }}>
        Tus datos se han guardado correctamente y ya forman parte del análisis.
      </p>
      
      <button 
        className="primary-btn" 
        onClick={onReset}
        style={{
          marginTop: '10px',
          padding: '14px 32px',
          fontSize: '1.1rem',
          borderRadius: '12px',
          letterSpacing: '0.5px',
          fontWeight: '600',
          boxShadow: '0 8px 15px rgba(99, 102, 241, 0.3)',
          transform: 'translateY(0)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(99, 102, 241, 0.4)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 15px rgba(99, 102, 241, 0.3)'; }}
      >
        Realizar Nueva Evaluación
      </button>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default SuccessCard;
