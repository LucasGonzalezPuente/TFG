import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './Dashboard'; 
import EvaluatorPanel from './evaluatorPanel'; 

function App() {
  // --- ESTADOS DE NAVEGACIÓN Y CONFIGURACIÓN DE PRUEBA ---
  const [vista, setVista] = useState('encuesta'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [loginError, setLoginError] = useState("");
  const [pruebasDisponibles, setPruebasDisponibles] = useState([]);
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState(""); 
  const [encuestaEmpezada, setEncuestaEmpezada] = useState(false);

  // --- ESTADO DEL CRONÓMETRO Y FORMULARIO ---
  const [startTime, setStartTime] = useState(null);
  const [pasoActual, setPasoActual] = useState(1);
  const [respuestas, setRespuestas] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [metricasObjetivas, setMetricasObjetivas] = useState(null); 

  // --- DATOS ESTÁTICOS ---
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

  // --- CARGAR PRUEBAS DISPONIBLES AL INICIAR ---
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/pruebas-realizadas')
      .then(res => res.json())
      .then(data => setPruebasDisponibles(data))
      .catch(err => console.error("Error al traer pruebas:", err));
  }, []);

  // --- INICIAR CRONÓMETRO CUANDO SE EMPIEZA LA PRUEBA SELECCIONADA ---
  useEffect(() => {
    if (encuestaEmpezada && !enviado) {
        setStartTime(Date.now());
        const baseAccuracy = Math.random() * (0.95 - 0.70) + 0.70; 
        setMetricasObjetivas({
            numero_clics: Math.floor(Math.random() * 20) + 5,
            errores_cometidos: Math.floor(Math.random() * 4),
            accuracy: parseFloat(baseAccuracy.toFixed(2)),
            precision: parseFloat((baseAccuracy + (Math.random() * 0.1 - 0.05)).toFixed(2)),
            recall: parseFloat((baseAccuracy + (Math.random() * 0.1 - 0.05)).toFixed(2)),
            f1_score: parseFloat((baseAccuracy - 0.02).toFixed(2)), 
            auc_roc: parseFloat((baseAccuracy + 0.03).toFixed(2)),
            rmse: parseFloat((Math.random() * 5).toFixed(2)), 
            mae: parseFloat((Math.random() * 4).toFixed(2)),
            mape: parseFloat((Math.random() * 15).toFixed(2)), 
            r2: parseFloat((Math.random() * (0.99 - 0.5) + 0.5).toFixed(2)) 
        });
    }
  }, [encuestaEmpezada, enviado]);

  // --- MANEJADORES DE NAVEGACIÓN ---
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
      } else { setLoginError("Credenciales incorrectas"); }
    } catch (err) { setLoginError("Error de conexión"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setVista('encuesta');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const segundosTranscurridos = Math.floor((Date.now() - startTime) / 1000);
    const sessionId = "sesion_" + Date.now();
    
    // Payload con el TOKEN REAL de la prueba seleccionada
    const payloadEncuesta = { 
      session_id: sessionId, 
      prueba_id: pruebaSeleccionada, // <-- VINCULACIÓN CRÍTICA
      respuestas: { ...respuestas, tiempo_real: segundosTranscurridos } 
    };

    const payloadMetricas = { 
      session_id: sessionId, 
      prueba_id: pruebaSeleccionada, // <-- VINCULACIÓN CRÍTICA
      usuario_id: "anonimo", 
      ...metricasObjetivas,
      tiempo_total: segundosTranscurridos 
    };

    try {
      const res1 = await fetch('http://127.0.0.1:8000/api/submit-survey', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadEncuesta),
      });
      const res2 = await fetch('http://127.0.0.1:8000/api/submit-metrics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadMetricas),
      });

      if (res1.ok && res2.ok) { setEnviado(true); window.scrollTo(0, 0); }
    } catch (err) { alert("Error al guardar datos"); }
  };

  const handleChange = (id, valor) => setRespuestas({ ...respuestas, [id]: valor });

  // --- RENDERIZADO DE COMPONENTES ---
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
          <span>{p.min}</span><span className="slider-value-preview">{respuestas[p.id] || 50}/100</span><span>{p.max}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-content">
          <span className="brand">HCAI Research Lab</span>
          <div className="nav-links">
            <button className={`nav-btn ${vista === 'encuesta' ? 'active' : ''}`} onClick={() => {setVista('encuesta'); setPasoActual(1); setEncuestaEmpezada(false);}}>Evaluación</button>
            {isAuthenticated ? (
              <>
                <button className={`nav-btn ${vista === 'dashboard' ? 'active' : ''}`} onClick={() => setVista('dashboard')}>Dashboard</button>
                <button className={`nav-btn ${vista === 'evaluador' ? 'active' : ''}`} onClick={() => setVista('evaluador')}>Configurar</button>
                <button className="nav-btn" onClick={handleLogout} style={{color: '#dc2626'}}>Salir</button>
              </>
            ) : <button className={`nav-btn ${vista === 'login' ? 'active' : ''}`} onClick={() => setVista('login')}>Admin</button>}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {/* VISTA DE LOGIN */}
        {vista === 'login' && (
          <div className="survey-container fade-in" style={{maxWidth: '400px', margin: '50px auto'}}>
            <h2>Acceso Investigador</h2>
            <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <input type="text" name="username" placeholder="Usuario" required className="metric-input" />
              <input type="password" name="password" placeholder="Contraseña" required className="metric-input" />
              {loginError && <p style={{color: 'red'}}>{loginError}</p>}
              <button type="submit" className="primary-btn">Entrar</button>
            </form>
          </div>
        )}

        {/* VISTAS DE ADMINISTRACIÓN (Protegidas) */}
        {isAuthenticated && vista === 'dashboard' && <Dashboard />}
        {isAuthenticated && vista === 'evaluador' && <EvaluatorPanel />}

        {/* VISTA DE ENCUESTA (Solo aquí debe actuar el estado 'enviado') */}
        {vista === 'encuesta' && (
          !enviado ? (
            !encuestaEmpezada ? (
              /* PANTALLA DE SELECCIÓN INICIAL */
              <div className="survey-container fade-in" style={{textAlign: 'center', maxWidth: '600px', margin: '50px auto'}}>
                <h1>Bienvenido al Experimento</h1>
                <p>Selecciona el sistema que vas a evaluar para comenzar:</p>
                <select 
                  value={pruebaSeleccionada} 
                  onChange={(e) => setPruebaSeleccionada(e.target.value)}
                  className="metric-input"
                  style={{width: '100%', padding: '15px', fontSize: '1.2rem', margin: '20px 0', borderRadius: '10px'}}
                >
                  <option value="">-- Elija una versión --</option>
                  {pruebasDisponibles.map(p => (
                    <option key={p.token_version} value={p.token_version}>{p.nombre_sistema}</option>
                  ))}
                </select>
                <button 
                  disabled={!pruebaSeleccionada} 
                  className="primary-btn" 
                  onClick={() => setEncuestaEmpezada(true)}
                  style={{width: '100%', padding: '15px'}}
                >
                  Comenzar Evaluación
                </button>
              </div>
            ) : (
              /* FORMULARIO DE PASOS */
              <form onSubmit={handleSubmit} className="survey-form">
                <header className="form-header">
                  <h1>Evaluando: {pruebasDisponibles.find(p => p.token_version === pruebaSeleccionada)?.nombre_sistema}</h1>
                  <div className="progress-container">
                    <div className={`step-item ${pasoActual >= 1 ? 'active' : ''}`} onClick={(e) => irAPaso(1, e)}>1</div>
                    <div className="step-line"></div>
                    <div className={`step-item ${pasoActual >= 2 ? 'active' : ''}`} onClick={(e) => irAPaso(2, e)}>2</div>
                    <div className="step-line"></div>
                    <div className={`step-item ${pasoActual === 3 ? 'active' : ''}`} onClick={(e) => irAPaso(3, e)}>3</div>
                  </div>
                </header>

                {pasoActual === 1 && <div className="section-container fade-in"><h3 className="section-title">Confianza</h3><div className="questions-grid">{preguntasParte1.map(renderPreguntaRadio)}</div></div>}
                {pasoActual === 2 && <div className="section-container fade-in"><h3 className="section-title">Explicabilidad</h3><div className="questions-grid">{preguntasParte2.map(renderPreguntaRadio)}</div></div>}
                {pasoActual === 3 && <div className="section-container fade-in"><h3 className="section-title">Carga Cognitiva</h3><div className="questions-grid">{preguntasNASA.map(renderPreguntaSlider)}</div></div>}

                <div className="actions step-actions">
                  {pasoActual > 1 && <button type="button" className="secondary-btn" onClick={irAnterior}>← Anterior</button>}
                  {pasoActual < 3 ? <button type="button" className="primary-btn" onClick={irSiguiente}>Siguiente →</button> : <button type="submit" className="primary-btn btn-finish" style={{backgroundColor: '#10B981'}}>Finalizar ✓</button>}
                </div>
              </form>
            )
          ) : (
            /* CARTEL DE ÉXITO (Solo visible tras terminar encuesta) */
            <div className="success-card fade-in">
              <div className="icon-check">✓</div>
              <h2>¡Muchas gracias!</h2>
              <p>Tus datos se han guardado en la versión seleccionada.</p>
              <button className="primary-btn" onClick={() => {setEnviado(false); setEncuestaEmpezada(false); setPruebaSeleccionada(""); setRespuestas({}); setPasoActual(1);}}>Nueva Evaluación</button>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;