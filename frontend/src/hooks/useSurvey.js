import { useState } from 'react';
import { submitSurvey } from '../api/apiService';

/** Generates a sample log in case the user has no real log file */
function generarLogEjemplo(sessionId) {
  const ahora = new Date();
  return [
    { event: 'task_start', user_id: 'usr_participante', session_id: sessionId, timestamp: new Date(ahora - 120000).toISOString(), properties: { errors: 0, time_to_complete: 0, description: 'Usuario inicia la tarea' } },
    { event: 'interaction', user_id: 'usr_participante', session_id: sessionId, timestamp: new Date(ahora - 90000).toISOString(), properties: { errors: 0, time_to_complete: 30000, description: 'Usuario interactúa con el sistema IA' } },
    { event: 'ai_suggestion_accepted', user_id: 'usr_participante', session_id: sessionId, timestamp: new Date(ahora - 60000).toISOString(), properties: { errors: 0, time_to_complete: 30000, description: 'Usuario acepta sugerencia de la IA' } },
    { event: 'manual_override', user_id: 'usr_participante', session_id: sessionId, timestamp: new Date(ahora - 30000).toISOString(), properties: { errors: 1, time_to_complete: 30000, description: 'Usuario corrige manualmente un resultado de la IA' } },
    { event: 'task_end', user_id: 'usr_participante', session_id: sessionId, timestamp: ahora.toISOString(), properties: { errors: 0, time_to_complete: 30000, description: 'Usuario finaliza la tarea' } },
  ];
}

/**
 * useSurvey
 * Centralises all survey state and actions so the view components stay thin.
 *
 * Returns:
 *   State:  pasoActual, respuestas, enviado, logFileContent, sessionId,
 *           encuestaEmpezada, pruebaSeleccionada, startTime
 *   Actions: handleChange, irSiguiente, irAnterior, irAPaso,
 *            comenzarEvaluacion, handleFileUpload, descargarLogEjemplo,
 *            handleSubmit, resetSurvey
 *
 * Note: comenzarEvaluacion now also sets encuestaEmpezada, so no separate
 *       entrarEncuesta step is needed.
 */
export function useSurvey() {
  const [pasoActual, setPasoActual] = useState(1);
  const [respuestas, setRespuestas] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [logFileContent, setLogFileContent] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [encuestaEmpezada, setEncuestaEmpezada] = useState(false);
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState('');
  const [startTime, setStartTime] = useState(null);

  // ── Answers ────────────────────────────────────────────────────────────────
  const handleChange = (id, valor) =>
    setRespuestas(prev => ({ ...prev, [id]: valor }));

  // ── Step navigation ───────────────────────────────────────────────────────
  const scroll = () => window.scrollTo(0, 0);
  const irSiguiente = (e) => { e?.preventDefault(); scroll(); setPasoActual(p => p + 1); };
  const irAnterior = (e) => { e?.preventDefault(); scroll(); setPasoActual(p => p - 1); };
  const irAPaso = (paso, e) => { e?.preventDefault(); scroll(); setPasoActual(paso); };

  // ── Start experiment ──────────────────────────────────────────────────────
  const comenzarEvaluacion = () => {
    if (!sessionId) {
      const sid = `sesion_${Date.now()}`;
      setSessionId(sid);
      setStartTime(Date.now());
    }
    setEncuestaEmpezada(true);
  };

  // ── Log file upload ───────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        setLogFileContent(Array.isArray(json) ? json : [json]);
      } catch {
        alert('El archivo de log no es un JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const descargarLogEjemplo = () => {
    const log = generarLogEjemplo(sessionId);
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_ejemplo_${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!logFileContent) {
      alert('Por favor, sube el archivo de log antes de finalizar.');
      return;
    }
    try {
      await submitSurvey({
        session_id: sessionId,
        prueba_id: Number(pruebaSeleccionada),
        respuestas,
        log_file: logFileContent,
      });
      setEnviado(true);
      scroll();
    } catch (err) {
      alert('Error al enviar: ' + err.message);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetSurvey = () => {
    setPasoActual(1);
    setRespuestas({});
    setEnviado(false);
    setLogFileContent(null);
    setSessionId('');
    setEncuestaEmpezada(false);
    setPruebaSeleccionada('');
    setStartTime(null);
  };

  return {
    // state
    pasoActual, respuestas, enviado, logFileContent,
    sessionId, encuestaEmpezada, pruebaSeleccionada, startTime,
    // actions
    handleChange, irSiguiente, irAnterior, irAPaso,
    comenzarEvaluacion, setPruebaSeleccionada,
    handleFileUpload, descargarLogEjemplo,
    handleSubmit, resetSurvey,
  };
}
