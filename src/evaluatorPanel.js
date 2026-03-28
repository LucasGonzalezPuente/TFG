import React, { useState, useEffect } from 'react';
import './App.css'; 

function EvaluatorPanel() {
  const [form, setForm] = useState({
    nombre_sistema: '',
    descripcion_tarea: '',
    usuarios: [],
    metricas: {}
  });

  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const metricasAI = [
    { id: 'accuracy', label: 'Accuracy (Exactitud)', placeholder: '0.0 - 1.0' },
    { id: 'precision', label: 'Precision', placeholder: '0.0 - 1.0' },
    { id: 'recall', label: 'Recall (Sensibilidad)', placeholder: '0.0 - 1.0' },
    { id: 'f1_score', label: 'F1-Score', placeholder: '0.0 - 1.0' },
    { id: 'auc_roc', label: 'AUC-ROC', placeholder: '0.0 - 1.0' },
    { id: 'rmse', label: 'RMSE (Root Mean Sq. Error)', placeholder: 'Valor numérico' },
    { id: 'mae', label: 'MAE (Mean Absolute Error)', placeholder: 'Valor numérico' },
    { id: 'r2', label: 'R² (Coef. Determinación)', placeholder: '0.0 - 1.0' },
  ];

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/usuarios-disponibles')
      .then(res => res.json())
      .then(data => setUsuariosDisponibles(data))
      .catch(err => console.error("Error cargando usuarios:", err));
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleUsuario = (id) => {
    setForm(prev => {
      const exists = prev.usuarios.includes(id);
      return {
        ...prev,
        usuarios: exists ? prev.usuarios.filter(u => u !== id) : [...prev.usuarios, id]
      };
    });
  };

  const handleMetricChange = (id, valor) => {
    const nuevasMetricas = { ...form.metricas };
    if (valor === '') {
      delete nuevasMetricas[id];
    } else {
      nuevasMetricas[id] = parseFloat(valor);
    }
    setForm({ ...form, metricas: nuevasMetricas });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/crear-prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        const data = await res.json();
        setResultado(data);
      } else {
        alert("Error en el servidor. Verifica que los campos sean correctos.");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor (FastAPI)");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="evaluator-container" style={{maxWidth: '800px', margin: '40px auto', padding: '20px'}}>
      <header className="form-header" style={{textAlign: 'center', marginBottom: '30px'}}>
        <h1>⚙️ Configuración de Experimentos</h1>
        <p>Define una nueva variante del sistema para comparar resultados en el Dashboard.</p>
      </header>

      {!resultado ? (
        <form onSubmit={handleSubmit} className="survey-container" style={{background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
          
          <div className="form-group" style={{marginBottom: '20px'}}>
            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>1. Nombre de la Versión</label>
            <input 
              className="metric-input"
              type="text" 
              name="nombre_sistema" 
              placeholder="Ej: Chatbot con Explicaciones Visuales" 
              value={form.nombre_sistema} 
              onChange={handleInputChange} 
              required 
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}}
            />
          </div>

          <div className="form-group" style={{marginBottom: '20px'}}>
            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>2. Objetivo de la Tarea</label>
            <textarea 
              name="descripcion_tarea" 
              rows="3"
              placeholder="Describe qué debe hacer el usuario..."
              value={form.descripcion_tarea} 
              onChange={handleInputChange}
              required
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}}
            />
          </div>

          <div className="form-group" style={{marginBottom: '20px'}}>
            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>3. Usuarios Invitados</label>
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px'}}>
              {usuariosDisponibles.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUsuario(u.id)}
                  style={{
                    padding: '8px 15px',
                    borderRadius: '20px',
                    border: '1px solid #2563EB',
                    backgroundColor: form.usuarios.includes(u.id) ? '#2563EB' : 'white',
                    color: form.usuarios.includes(u.id) ? 'white' : '#2563EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {u.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{marginBottom: '30px'}}>
            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>4. Ground Truth (Métricas Técnicas)</label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px'}}>
              {metricasAI.map(m => (
                <div key={m.id} style={{display: 'flex', flexDirection: 'column'}}>
                  <span style={{fontSize: '0.85rem', color: '#555'}}>{m.label}</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder={m.placeholder}
                    value={form.metricas[m.id] || ''}
                    onChange={(e) => handleMetricChange(m.id, e.target.value)}
                    style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
                  />
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="primary-btn"
            style={{width: '100%', padding: '15px', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}
          >
            {cargando ? 'Registrando...' : 'Crear Nueva Prueba'}
          </button>
        </form>
      ) : (
        <div className="success-card" style={{textAlign: 'center', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}>
          <h2 style={{color: '#059669'}}>✅ ¡Versión Registrada!</h2>
          <p>La prueba ya está disponible en la base de datos.</p>
          
          <div style={{background: '#F3F4F6', padding: '20px', borderRadius: '10px', margin: '25px 0', borderLeft: '5px solid #2563EB'}}>
            <p style={{margin: '5px 0'}}><strong>Nombre:</strong> {resultado.nombre_sistema}</p>
            <p style={{margin: '5px 0'}}><strong>ID para Surveys:</strong> <code style={{fontSize: '1.2rem', color: '#D97706'}}>{resultado.token_version}</code></p>
          </div>

          <button 
            className="secondary-btn" 
            onClick={() => {setResultado(null); setForm({nombre_sistema: '', descripcion_tarea: '', usuarios: [], metricas: {}})}}
            style={{padding: '10px 20px', cursor: 'pointer'}}
          >
            Configurar otra variante
          </button>
        </div>
      )}
    </div>
  );
}

export default EvaluatorPanel;