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

  // Estilos inline reutilizados
  const cardStyle = {
    background: 'var(--card-dark)',
    border: '1px solid var(--border-color)',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  };

  const labelStyle = {
    fontWeight: '700',
    display: 'block',
    marginBottom: '8px',
    color: 'var(--text-main)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-dark)',
    color: 'var(--text-main)',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: 'var(--text-main)' }}>⚙️ Configuración de Experimentos</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Define una nueva variante del sistema para comparar resultados en el Dashboard.
        </p>
      </header>

      {!resultado ? (
        <form onSubmit={handleSubmit} style={cardStyle}>
          
          {/* 1. Nombre */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>1. Nombre de la Versión</label>
            <input 
              type="text" 
              name="nombre_sistema" 
              placeholder="Ej: Chatbot con Explicaciones Visuales" 
              value={form.nombre_sistema} 
              onChange={handleInputChange} 
              required 
              style={inputStyle}
            />
          </div>

          {/* 2. Descripción de la tarea */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>2. Objetivo de la Tarea</label>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
              Este texto se mostrará al usuario antes de comenzar la evaluación.
            </p>
            <textarea 
              name="descripcion_tarea" 
              rows="3"
              placeholder="Ej: Usa Google Maps para buscar la ruta de Santander a Torrelavega..."
              value={form.descripcion_tarea} 
              onChange={handleInputChange}
              required
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* 3. Usuarios */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>3. Usuarios Invitados</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {usuariosDisponibles.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUsuario(u.id)}
                  style={{
                    padding: '8px 15px',
                    borderRadius: '20px',
                    border: '1px solid var(--accent-primary)',
                    backgroundColor: form.usuarios.includes(u.id) ? 'var(--accent-primary)' : 'transparent',
                    color: form.usuarios.includes(u.id) ? 'white' : 'var(--accent-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {u.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Métricas */}
          <div style={{ marginBottom: '30px' }}>
            <label style={labelStyle}>4. Ground Truth (Métricas Técnicas de la IA)</label>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Introduce los valores reales de las métricas del sistema evaluado. Aparecerán en el Dashboard para triangulación.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
              {metricasAI.map(m => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.label}</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder={m.placeholder}
                    value={form.metricas[m.id] ?? ''}
                    onChange={(e) => handleMetricChange(m.id, e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="primary-btn"
            style={{ width: '100%' }}
          >
            {cargando ? 'Registrando...' : 'Crear Nueva Prueba'}
          </button>
        </form>
      ) : (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-secondary)' }}>✅ ¡Versión Registrada!</h2>
          <p style={{ color: 'var(--text-muted)' }}>La prueba ya está disponible en la base de datos.</p>
          
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid var(--accent-primary)',
            padding: '20px',
            borderRadius: '10px',
            margin: '25px 0',
            textAlign: 'left'
          }}>
            <p style={{ margin: '5px 0', color: 'var(--text-main)' }}>
              <strong>Nombre:</strong> {resultado.nombre_sistema}
            </p>
            {/* FIX: clave corregida de version_token → token_version */}
            <p style={{ margin: '5px 0', color: 'var(--text-main)' }}>
              <strong>Token para Surveys:</strong>{' '}
              <code style={{ fontSize: '1.2rem', color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                {resultado.token_version}
              </code>
            </p>
            <p style={{ margin: '5px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <strong>Link directo:</strong> {resultado.link_generado}
            </p>
          </div>

          <button 
            className="secondary-btn" 
            onClick={() => {
              setResultado(null);
              setForm({ nombre_sistema: '', descripcion_tarea: '', usuarios: [], metricas: {} });
            }}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Configurar otra variante
          </button>
        </div>
      )}
    </div>
  );
}

export default EvaluatorPanel;