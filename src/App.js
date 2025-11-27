import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';

function App() {
  
 const [respuestas, setRespuestas] = useState({
    facilidad: '',
    precision: '',
    frecuencia: 'diariamente',
    comentarios: ''
  });

  // El formulario ya se envio
  const [enviado, setEnviado] = useState(false); 

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRespuestas({
      ...respuestas,
      [name]: value
    });
  };

  // Manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Respuestas enviadas:", respuestas); 
    setEnviado(true);
  };

   return (
    <div className="App">
      <header className="App-header">
        <div className="survey-container">
          
          {!enviado ? (
            <>
              <h1>Encuesta de Google Maps</h1>
              <p>Tu opinión nos ayuda a mejorar la navegación.</p>
              
              <form onSubmit={handleSubmit}>
                
                {/* Pregunta 1*/}
                <div className="form-group">
                  <label>1. Del 1 al 5, ¿qué tan fácil es usar la app?</label>
                  <div className="radio-group">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <label key={num}>
                        <input
                          type="radio"
                          name="facilidad"
                          value={num}
                          onChange={handleChange}
                          required
                        />
                        {num}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pregunta 2*/}
                <div className="form-group">
                  <label>2. ¿Consideras precisas las rutas sugeridas?</label>
                  <div className="radio-group">
                    <label>
                      <input type="radio" name="precision" value="si" onChange={handleChange} required /> Sí
                    </label>
                    <label>
                      <input type="radio" name="precision" value="no" onChange={handleChange} /> No
                    </label>
                  </div>
                </div>

                {/* Pregunta 3*/}
                <div className="form-group">
                  <label>3. ¿Con qué frecuencia usas Google Maps?</label>
                  <select name="frecuencia" value={respuestas.frecuencia} onChange={handleChange}>
                    <option value="diariamente">Diariamente</option>
                    <option value="semanalmente">Semanalmente</option>
                    <option value="mensualmente">Mensualmente</option>
                    <option value="rara_vez">Rara vez</option>
                  </select>
                </div>

                {/* Pregunta 4*/}
                <div className="form-group">
                  <label>4. Comentarios adicionales o sugerencias:</label>
                  <textarea
                    name="comentarios"
                    rows="4"
                    placeholder="Escribe aquí tu opinión..."
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="submit-btn">Enviar Encuesta</button>
              </form>
            </>
          ) : (
            <div className="thank-you-message">
              <h2>¡Gracias por tu opinión!</h2>
              <p>Hemos recibido tus respuestas correctamente.</p>
              <button className="submit-btn" onClick={() => setEnviado(false)}>Volver a empezar</button>
            </div>
          )}

        </div>
      </header>
    </div>
  );

}

export default App;
