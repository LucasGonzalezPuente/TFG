// ─── Base URL ────────────────────────────────────────────────────────────────
const BASE = 'http://127.0.0.1:8000/api';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function loginAdmin(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Credenciales incorrectas');
  return res.json(); // { status, token }
}

// ─── Pruebas (experimentos) ───────────────────────────────────────────────────
export async function fetchPruebas() {
  const res = await fetch(`${BASE}/pruebas-realizadas`);
  if (!res.ok) throw new Error('Error cargando pruebas');
  return res.json(); // [{ id, nombre_sistema, descripcion_tarea, token_version, fecha_creacion }]
}

export async function crearPrueba(payload) {
  const res = await fetch(`${BASE}/crear-prueba`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error en el servidor. Verifica los campos.');
  return res.json(); // { status, token_version, nombre_sistema, link_generado }
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export async function fetchUsuariosDisponibles() {
  const res = await fetch(`${BASE}/usuarios-disponibles`);
  if (!res.ok) throw new Error('Error cargando usuarios');
  return res.json(); // [{ id, nombre }]
}

// ─── Encuesta / Survey ───────────────────────────────────────────────────────
export async function submitSurvey(payload) {
  // payload: { session_id, prueba_id, respuestas, log_file }
  const res = await fetch(`${BASE}/submit-survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err.detail));
  }
  return res.json();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function fetchDashboardMetrics(pruebaId) {
  const url = pruebaId ? `${BASE}/dashboard-metrics?prueba_id=${pruebaId}` : `${BASE}/dashboard-metrics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error cargando métricas del dashboard');
  return res.json();
}

export async function fetchLogMetrics(pruebaId) {
  const url = pruebaId ? `${BASE}/log-metrics?prueba_id=${pruebaId}` : `${BASE}/log-metrics`;
  const res = await fetch(url);
  if (!res.ok) return null; // endpoint opcional — falla silenciosa
  return res.json();
}

// ─── Comparador A/B ──────────────────────────────────────────────────────────
export async function compareTests(tokenA, tokenB) {
  const res = await fetch(`${BASE}/compare-tests/${tokenA}/${tokenB}`);
  if (!res.ok) throw new Error('Error en la comparación de pruebas');
  return res.json();
}
