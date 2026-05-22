import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './Dashboard'; 
import EvaluatorPanel from './evaluatorPanel'; 

// Genera un log de ejemplo para que el usuario pueda descargarlo si no tiene uno real
function generarLogEjemplo(sessionId) {
  const ahora = new Date();
  return [
    {
      event: "task_start",
      user_id: "usr_participante",
      session_id: sessionId,
      timestamp: new Date(ahora.getTime() - 120000).toISOString(),
      properties: { errors: 0, time_to_complete: 0, description: "Usuario inicia la tarea" }
    },
    {
      event: "interaction",
      user_id: "usr_participante",
      session_id: sessionId,
      timestamp: new Date(ahora.getTime() - 90000).toISOString(),
      properties: { errors: 0, time_to_complete: 30000, description: "Usuario interactúa con el sistema IA" }
    },
    {
      event: "ai_suggestion_accepted",
      user_id: "usr_participante",
      session_id: sessionId,
      timestamp: new Date(ahora.getTime() - 60000).toISOString(),
      properties: { errors: 0, time_to_complete: 30000, description: "Usuario acepta sugerencia de la IA" }
    },
    {
      event: "manual_override",
      user_id: "usr_participante",
      session_id: sessionId,
      timestamp: new Date(ahora.getTime() - 30000).toISOString(),
      properties: { errors: 1, time_to_complete: 30000, description: "Usuario corrige manualmente un resultado de la IA" }
    },
    {
      event: "task_end",
      user_id: "usr_participante",
      session_id: sessionId,
      timestamp: ahora.toISOString(),
      properties: { errors: 0, time_to_complete: 30000, description: "Usuario finaliza la tarea" }
    }
  ];
}

function App() {
  const [vista, setVista] = useState('encuesta'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [loginError, setLoginError] = useState("");
  const [pruebasDisponibles, setPruebasDisponibles] = useState([]);
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState(null); // ahora es el id numérico
  const [encuestaEmpezada, setEncuestaEmpezada] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const [startTime, setStartTime] = useState(null);
  const [pasoActual, setPasoActual] = useState(1);
  const [respuestas, setRespuestas] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [logFileContent, setLogFileContent] = useState(null);

  const opciones = [
    { valor: 'a', texto: 'Completamente de acuerdo' },
    { valor: 'b', texto: 'Estoy algo de acuerdo' },
    { valor: 'c', texto: 'Soy neutral al respecto' },
    { valor: 'd', texto: 'Estoy algo en desacuerdo' },
    { valor: 'e', texto: 'Completamente en desacuerdo' }
  ];

  const preguntasParte1 = [
    { id: 'p1_confianza', texto: '1. Tengo confianza en la herramienta. Siento que funciona bien.' },
    { id: 'p2_predecible', texto: '2. Los resultados de la herramienta fueron muy predecibles.' },
    { id: 'p3_fiabilidad', texto: '3. La herramienta es muy confiable. Puedo confiar en los resultados.' },
    { id: 'p4_seguridad', texto: '4. Tengo la seguridad de que obtendré resultados adecuados.' },
    { id: 'p5_eficiencia', texto: '5. La herramienta es eficiente y funciona de forma rápida.' },
    { id: 'p6_desconfianza', texto: '6. Desconfío de la herramienta.' },
    { id: 'p7_experto', texto: '7. Realiza la tarea mejor que un usuario inexperto.' },
    { id: 'p8_decision', texto: '8. Me gusta utilizarla para la toma de decisiones.' },
  ];

  const preguntasParte2 = [
    { id: 'p9_conozco', texto: '1. A partir de la explicación, conozco cómo funciona.' },
    { id: 'p10_satisfactoria', texto: '2. La explicación de cómo funciona es satisfactoria.' },
    { id: 'p11_detalle', texto: '3. La explicación tiene suficiente detalle.' },
    { id: 'p12_completa', texto: '4. La explicación se presenta completa.' },
    { id: 'p13_uso', texto: '5. La explicación me indica cómo usarla.' },
    { id: 'p14_objetivos', texto: '6. La explicación me ayuda para mis objetivos.' },
    { id: 'p15_precision', texto: '7. La explicación me enseña cuán precisa es.' },
  ];

  const preguntasNASA = [
    { id: 'nasa_mental', titulo: 'Exigencia Mental', desc: '¿Cuánta actividad mental y perceptiva fue necesaria?', min: 'Muy Baja', max: 'Muy Alta' },
    { id: 'nasa_fisica', titulo: 'Exigencia Física', desc: '¿Cuánta actividad física fue necesaria?', min: 'Muy Baja', max: 'Muy Alta' },
    { id: 'nasa_temporal', titulo: 'Exigencia Temporal', desc: '¿Cuánta presión de tiempo sintió?', min: 'Muy Baja', max: 'Muy Alta' },
    { id: 'nasa_rendimiento', titulo: 'Rendimiento', desc: '¿Qué tan exitoso cree que fue?', min: 'Perfecto', max: 'Fallo' },
    { id: 'nasa_esfuerzo', titulo: 'Esfuerzo', desc: '¿Qué tan duro tuvo que trabajar?', min: 'Muy Bajo', max: 'Muy Alto' },
    { id: 'nasa_frustracion', titulo: 'Nivel de Frustración', desc: '¿Qué tan inseguro, desalentado o estresado se sintió?', min: 'Muy Bajo', max: 'Muy Alto' },
  ];

  // Cargar pruebas disponibles al iniciar
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/pruebas-realizadas')
      .then(res => res.json())
      .then(data => setPruebasDisponibles(data))
      .catch(err => console.error("Error al traer pruebas:", err));
  }, []);

  const irSiguiente = (e) => { e?.preventDefault(); window.scrollTo(0, 0); setPasoActual(p => p + 1); };
  const irAnterior = (e) => { e?.preventDefault(); window.scrollTo(0, 0); setPasoActual(p => p - 1); };
  const irAPaso = (paso, e) => { e?.preventDefault(); window.scrollTo(0, 0); setPasoActual(paso); };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: e.target.username.value, password: e.target.password.value })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("admin_token", data.token);
        setIsAuthenticated(true);
        setVista('dashboard');
      } else {
        setLoginError("Credenciales incorrectas");
      }
    } catch (err) {
      setLoginError("Error de conexión");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setVista('encuesta');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setLogFileContent(Array.isArray(json) ? json : [json]);
      } catch (err) {
        alert("El archivo de log no es un JSON válido. Asegúrate de que el sistema bajo prueba haya generado el log correctamente.");
      }
    };
    reader.readAsText(file);
  };

  // Descarga un log de ejemplo para pruebas
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!logFileContent) {
      alert("Por favor, sube el archivo de log antes de finalizar.");
      return;
    }

    const payload = {
      session_id: sessionId,
      prueba_id: Number(pruebaSeleccionada),  // FK entera → pruebas.id
      respuestas: respuestas,
      log_file: logFileContent
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/submit-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEnviado(true);
        window.scrollTo(0, 0);
      } else {
        const errorData = await res.json();
        console.error("Error del servidor:", errorData);
        alert("Error al enviar: " + JSON.stringify(errorData.detail));
      }
    } catch (err) {
      alert("Error de conexión con el servidor");
    }
  };

  const handleChange = (id, valor) => setRespuestas({ ...respuestas, [id]: valor });

  const renderPreguntaRadio = (p, i) => (
    <div className={`question-card slide-up ${respuestas[p.id] ? 'answered' : ''}`} key={p.id} style={{ animationDelay: `${i * 0.1}s` }}>
      <h4 className="question-text">{p.texto}</h4>
      <div className="options-list">
        {opciones.map(op => (
          <label key={op.valor} className={`option-item ${respuestas[p.id] === op.valor ? 'selected' : ''}`}>
            <input type="radio" name={p.id} value={op.valor} onChange={(e) => handleChange(p.id, e.target.value)} />
            <span className="option-text">{op.texto}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderPreguntaSlider = (p, i) => (
    <div className={`question-card slide-up ${respuestas[p.id] ? 'answered' : ''}`} key={p.id} style={{ animationDelay: `${i * 0.1}s` }}>
      <h4 className="nasa-title">{p.titulo}</h4>
      <p className="nasa-desc">{p.desc}</p>
      <div className="slider-container">
        <input type="range" min="0" max="100" value={respuestas[p.id] || 50} className="slider" onChange={(e) => handleChange(p.id, e.target.value)} />
        <div className="slider-labels">
          <span>{p.min}</span>
          <span className="slider-value-preview">{respuestas[p.id] || 50}/100</span>
          <span>{p.max}</span>
        </div>
      </div>
    </div>
  );

  // Obtiene los datos de la prueba seleccionada (para mostrar descripción)
  const pruebActual = pruebasDisponibles.find(p => p.id === Number(pruebaSeleccionada));

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-content">
          <span className="brand">HCAI Research Lab</span>
          <div className="nav-links">
            <button
              className={`nav-btn ${vista === 'encuesta' ? 'active' : ''}`}
              onClick={() => { setVista('encuesta'); setPasoActual(1); setEncuestaEmpezada(false); }}
            >
              Evaluación
            </button>
            {isAuthenticated ? (
              <>
                <button className={`nav-btn ${vista === 'dashboard' ? 'active' : ''}`} onClick={() => setVista('dashboard')}>Dashboard</button>
                <button className={`nav-btn ${vista === 'evaluador' ? 'active' : ''}`} onClick={() => setVista('evaluador')}>Configurar</button>
                <button className="nav-btn" onClick={handleLogout} style={{ color: '#dc2626' }}>Salir</button>
              </>
            ) : (
              <button className={`nav-btn ${vista === 'login' ? 'active' : ''}`} onClick={() => setVista('login')}>Admin</button>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {/* LOGIN */}
        {vista === 'login' && (
          <div className="survey-container fade-in" style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h2>Acceso Investigador</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" name="username" placeholder="Usuario" required className="metric-input" />
              <input type="password" name="password" placeholder="Contraseña" required className="metric-input" />
              {loginError && <p style={{ color: 'var(--error)' }}>{loginError}</p>}
              <button type="submit" className="primary-btn">Entrar</button>
            </form>
          </div>
        )}

        {isAuthenticated && vista === 'dashboard' && <Dashboard />}
        {isAuthenticated && vista === 'evaluador' && <EvaluatorPanel />}

        {/* ENCUESTA */}
        {vista === 'encuesta' && (
          !enviado ? (
            !encuestaEmpezada ? (
              /* SELECCIÓN INICIAL + DESCRIPCIÓN DE TAREA */
              <div className="survey-container fade-in" style={{ textAlign: 'center', maxWidth: '640px', margin: '50px auto' }}>
                <h1 style={{ color: 'var(--text-main)' }}>Bienvenido al Experimento</h1>
                <p style={{ color: 'var(--text-muted)' }}>Selecciona el sistema que vas a evaluar para ver tu tarea asignada:</p>

                <select
                  value={pruebaSeleccionada}
                  onChange={(e) => setPruebaSeleccionada(e.target.value)}
                  className="metric-input"
                  style={{ width: '100%', padding: '15px', fontSize: '1.1rem', margin: '20px 0', borderRadius: '10px' }}
                >
                  <option value="">-- Elige una versión --</option>
                  {pruebasDisponibles.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre_sistema}</option>
                  ))}
                </select>

                {/* FIX: mostrar descripción de la tarea al usuario */}
                {pruebActual && pruebActual.descripcion_tarea && (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: '12px',
                    padding: '20px',
                    margin: '0 0 25px 0',
                    textAlign: 'left'
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
                  onClick={() => {
                    const sid = "sesion_" + Date.now();
                    setEncuestaEmpezada(true);
                    setSessionId(sid);
                    setStartTime(Date.now());
                  }}
                >
                  Comenzar Evaluación
                </button>
              </div>
            ) : (
              /* FORMULARIO DE PASOS */
              <form onSubmit={handleSubmit} className="survey-form">
                <header className="form-header">
                  <h1>Evaluando: {pruebActual?.nombre_sistema}</h1>
                  <div className="progress-container">
                    <div className={`step-item ${pasoActual >= 1 ? 'active' : ''}`} onClick={(e) => irAPaso(1, e)}>1</div>
                    <div className="step-line"></div>
                    <div className={`step-item ${pasoActual >= 2 ? 'active' : ''}`} onClick={(e) => irAPaso(2, e)}>2</div>
                    <div className="step-line"></div>
                    <div className={`step-item ${pasoActual === 3 ? 'active' : ''}`} onClick={(e) => irAPaso(3, e)}>3</div>
                  </div>
                </header>

                {pasoActual === 1 && (
                  <div className="section-container fade-in">
                    <h3 className="section-title">Confianza</h3>
                    <div className="questions-grid">{preguntasParte1.map(renderPreguntaRadio)}</div>
                  </div>
                )}
                {pasoActual === 2 && (
                  <div className="section-container fade-in">
                    <h3 className="section-title">Explicabilidad</h3>
                    <div className="questions-grid">{preguntasParte2.map(renderPreguntaRadio)}</div>
                  </div>
                )}
                {pasoActual === 3 && (
                  <div className="section-container fade-in">
                    <h3 className="section-title">Carga Cognitiva</h3>
                    <div className="questions-grid">
                      {preguntasNASA.map(renderPreguntaSlider)}
                    </div>

                    {/* FIX: sección log con estilos dark */}
                    <div style={{
                      marginTop: '40px',
                      padding: '25px',
                      border: '2px dashed var(--accent-primary)',
                      borderRadius: '12px',
                      textAlign: 'center',
                      background: 'rgba(99, 102, 241, 0.05)'
                    }}>
                      <h4 style={{ color: 'var(--text-main)', marginTop: 0 }}>📂 Subir Log de la Tarea</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Selecciona el archivo JSON generado por el sistema bajo prueba.
                      </p>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        style={{ marginTop: '10px', color: 'var(--text-muted)' }}
                      />
                      {logFileContent ? (
                        <p style={{ color: 'var(--accent-secondary)', marginTop: '10px' }}>
                          ✅ Log cargado ({logFileContent.length} eventos)
                        </p>
                      ) : (
                        <div style={{ marginTop: '15px' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            ¿No tienes un log? Descarga un log de ejemplo para pruebas:
                          </p>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={descargarLogEjemplo}
                            style={{ marginTop: '8px', cursor: 'pointer' }}
                          >
                            ⬇️ Descargar Log de Ejemplo
                          </button>
                        </div>
                      )}
                    </div>
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
            )
          ) : (
            /* ÉXITO */
            <div className="success-card fade-in">
              <div className="icon-check">✓</div>
              <h2>¡Muchas gracias!</h2>
              <p>Tus datos se han guardado correctamente.</p>
              <button
                className="primary-btn"
                onClick={() => {
                  setEnviado(false);
                  setEncuestaEmpezada(false);
                  setPruebaSeleccionada(null);
                  setRespuestas({});
                  setPasoActual(1);
                  setLogFileContent(null);
                }}
              >
                Nueva Evaluación
              </button>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;