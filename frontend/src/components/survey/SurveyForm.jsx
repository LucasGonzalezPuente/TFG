import React from 'react';
import {
  OPCIONES_LIKERT,
  PREGUNTAS_CONFIANZA,
  PREGUNTAS_EXPLICABILIDAD,
  PREGUNTAS_NASA,
} from '../../constants/surveyData';

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function PreguntaRadio({ pregunta, index, respuestas, onAnswer }) {
  return (
    <div
      className={`question-card slide-up ${respuestas[pregunta.id] ? 'answered' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <h4 className="question-text">{pregunta.texto}</h4>
      <div className="options-list">
        {OPCIONES_LIKERT.map(op => (
          <label
            key={op.valor}
            className={`option-item ${respuestas[pregunta.id] === op.valor ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name={pregunta.id}
              value={op.valor}
              onChange={() => onAnswer(pregunta.id, op.valor)}
            />
            <span className="option-text">{op.texto}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function PreguntaSlider({ pregunta, index, respuestas, onAnswer }) {
  return (
    <div
      className={`question-card slide-up ${respuestas[pregunta.id] ? 'answered' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <h4 className="nasa-title">{pregunta.titulo}</h4>
      <p className="nasa-desc">{pregunta.desc}</p>
      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="100"
          value={respuestas[pregunta.id] || 50}
          className="slider"
          onChange={(e) => onAnswer(pregunta.id, e.target.value)}
        />
        <div className="slider-labels">
          <span>{pregunta.min}</span>
          <span className="slider-value-preview">{respuestas[pregunta.id] || 50}/100</span>
          <span>{pregunta.max}</span>
        </div>
      </div>
    </div>
  );
}

function LogUpload({ logFileContent, sessionId, onUpload, onDescargar }) {
  return (
    <div style={{
      marginTop: '40px',
      padding: '25px',
      border: '2px dashed var(--accent-primary)',
      borderRadius: '12px',
      textAlign: 'center',
      background: 'rgba(99, 102, 241, 0.05)',
    }}>
      <h4 style={{ color: 'var(--text-main)', marginTop: 0 }}>📂 Subir Log de la Tarea</h4>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Selecciona el archivo JSON generado por el sistema bajo prueba.
      </p>
      <input
        type="file"
        accept=".json"
        onChange={onUpload}
        style={{ marginTop: '10px', color: 'var(--text-muted)' }}
      />
      {logFileContent ? (
        <p style={{ color: 'var(--accent-secondary)', marginTop: '10px' }}>
          ✅ Log cargado ({logFileContent.length} eventos)
        </p>
      ) : (
        <div style={{ marginTop: '15px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ¿No tienes un log? Descarga un log de ejemplo para pruebas:
          </p>
          <button type="button" className="secondary-btn" onClick={onDescargar} style={{ marginTop: '8px' }}>
            ⬇️ Descargar Log de Ejemplo
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * SurveyForm
 * 3-step survey: Confianza → Explicabilidad → NASA-TLX + log upload.
 *
 * Props from useSurvey hook:
 *   pasoActual, respuestas, logFileContent, sessionId,
 *   handleChange, irSiguiente, irAnterior, irAPaso,
 *   handleFileUpload, descargarLogEjemplo, handleSubmit,
 *   pruebaNombre (string display name of selected experiment)
 */
function SurveyForm({
  pasoActual, respuestas, logFileContent, sessionId,
  handleChange, irSiguiente, irAnterior, irAPaso,
  handleFileUpload, descargarLogEjemplo, handleSubmit,
  pruebaNombre,
}) {
  return (
    <form onSubmit={handleSubmit} className="survey-form">
      <header className="form-header">
        <h1>Evaluando: {pruebaNombre}</h1>
        <div className="progress-container">
          {[1, 2, 3].map((n, i) => (
            <React.Fragment key={n}>
              <div
                className={`step-item ${pasoActual >= n ? 'active' : ''}`}
                onClick={(e) => irAPaso(n, e)}
              >
                {n}
              </div>
              {i < 2 && <div className="step-line" />}
            </React.Fragment>
          ))}
        </div>
      </header>

      {pasoActual === 1 && (
        <div className="section-container fade-in">
          <h3 className="section-title">Confianza</h3>
          <div className="questions-grid">
            {PREGUNTAS_CONFIANZA.map((p, i) => (
              <PreguntaRadio key={p.id} pregunta={p} index={i} respuestas={respuestas} onAnswer={handleChange} />
            ))}
          </div>
        </div>
      )}

      {pasoActual === 2 && (
        <div className="section-container fade-in">
          <h3 className="section-title">Explicabilidad</h3>
          <div className="questions-grid">
            {PREGUNTAS_EXPLICABILIDAD.map((p, i) => (
              <PreguntaRadio key={p.id} pregunta={p} index={i} respuestas={respuestas} onAnswer={handleChange} />
            ))}
          </div>
        </div>
      )}

      {pasoActual === 3 && (
        <div className="section-container fade-in">
          <h3 className="section-title">Carga Cognitiva</h3>
          <div className="questions-grid">
            {PREGUNTAS_NASA.map((p, i) => (
              <PreguntaSlider key={p.id} pregunta={p} index={i} respuestas={respuestas} onAnswer={handleChange} />
            ))}
          </div>
          <LogUpload
            logFileContent={logFileContent}
            sessionId={sessionId}
            onUpload={handleFileUpload}
            onDescargar={descargarLogEjemplo}
          />
        </div>
      )}

      <div className="actions step-actions">
        {pasoActual > 1 && (
          <button type="button" className="secondary-btn" onClick={irAnterior}>← Anterior</button>
        )}
        {pasoActual < 3 ? (
          <button type="button" className="primary-btn" onClick={irSiguiente}>Siguiente →</button>
        ) : (
          <button type="submit" className="primary-btn btn-finish" style={{ backgroundColor: '#10B981' }}>
            Finalizar ✓
          </button>
        )}
      </div>
    </form>
  );
}

export default SurveyForm;
