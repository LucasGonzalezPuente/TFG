import React, { useEffect, useState } from 'react';
import './App.css';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useSurvey } from './hooks/useSurvey';

// API
import { fetchPruebas } from './api/apiService';

// Components
import Dashboard from './components/Dashboard';
import EvaluatorPanel from './components/EvaluatorPanel';
import SurveySelector from './components/survey/SurveySelector';
import SurveyForm from './components/survey/SurveyForm';
import SuccessCard from './components/survey/SuccessCard';

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [vista, setVista] = useState('encuesta');
  const [pruebas, setPruebas] = useState([]);

  // Auth
  const { isAuthenticated, loginError, handleLogin, handleLogout } = useAuth();

  // Survey
  const survey = useSurvey();

  // Load available experiments on mount
  useEffect(() => {
    fetchPruebas()
      .then(setPruebas)
      .catch(err => console.error('Error al traer pruebas:', err));
  }, []);

  // Helpers
  const pruebActual = pruebas.find(p => p.id === Number(survey.pruebaSeleccionada));

  const navToEncuesta = () => {
    setVista('encuesta');
    survey.resetSurvey();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="App">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="nav-content">
          <span className="brand">HCAI Research Lab</span>
          <div className="nav-links">
            <button
              className={`nav-btn ${vista === 'encuesta' ? 'active' : ''}`}
              onClick={navToEncuesta}
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

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="main-content">

        {/* Login */}
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

        {/* Admin views */}
        {isAuthenticated && vista === 'dashboard' && <Dashboard />}
        {isAuthenticated && vista === 'evaluador' && <EvaluatorPanel />}

        {/* Survey flow */}
        {vista === 'encuesta' && (
          survey.enviado ? (
            <SuccessCard onReset={survey.resetSurvey} />
          ) : !survey.encuestaEmpezada ? (
            <SurveySelector
              pruebas={pruebas}
              pruebaSeleccionada={survey.pruebaSeleccionada}
              onSelect={survey.setPruebaSeleccionada}
              onComenzar={survey.comenzarEvaluacion}
            />
          ) : (
            <SurveyForm
              pasoActual={survey.pasoActual}
              respuestas={survey.respuestas}
              logFileContent={survey.logFileContent}
              sessionId={survey.sessionId}
              handleChange={survey.handleChange}
              irSiguiente={survey.irSiguiente}
              irAnterior={survey.irAnterior}
              irAPaso={survey.irAPaso}
              handleFileUpload={survey.handleFileUpload}
              descargarLogEjemplo={survey.descargarLogEjemplo}
              handleSubmit={survey.handleSubmit}
              pruebaNombre={pruebActual?.nombre_sistema ?? ''}
            />
          )
        )}
      </main>
    </div>
  );
}

export default App;
