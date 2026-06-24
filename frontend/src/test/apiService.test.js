/**
 * frontend/src/test/apiService.test.js
 * Unit tests for apiService.js using Vitest's vi.stubGlobal to mock fetch.
 * No real network calls are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loginAdmin,
  fetchPruebas,
  crearPrueba,
  fetchDashboardMetrics,
  fetchLogMetrics,
  compareTests,
} from '../api/apiService';

// Helper: create a mock Response object
function mockResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── loginAdmin ────────────────────────────────────────────────────────────────

describe('loginAdmin', () => {
  it('returns token on valid credentials', async () => {
    const fakeToken = { status: 'success', token: 'jwt.abc.xyz' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(fakeToken)));

    const result = await loginAdmin('admin', 'admin123');
    expect(result).toEqual(fakeToken);
  });

  it('calls POST /api/login with correct body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ status: 'success', token: 't' }));
    vi.stubGlobal('fetch', fetchMock);

    await loginAdmin('admin', 'admin123');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/login');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ username: 'admin', password: 'admin123' });
  });

  it('throws when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, false, 401)));
    await expect(loginAdmin('admin', 'wrong')).rejects.toThrow('Credenciales incorrectas');
  });
});

// ── fetchPruebas ──────────────────────────────────────────────────────────────

describe('fetchPruebas', () => {
  it('returns parsed list of pruebas', async () => {
    const fakePruebas = [{ id: 1, nombre_sistema: 'Sistema A', token_version: 'abc12345' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(fakePruebas)));

    const result = await fetchPruebas();
    expect(result).toEqual(fakePruebas);
  });

  it('calls GET /api/pruebas-realizadas', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    await fetchPruebas();
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('pruebas-realizadas');
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, false, 500)));
    await expect(fetchPruebas()).rejects.toThrow('Error cargando pruebas');
  });
});

// ── crearPrueba ───────────────────────────────────────────────────────────────

describe('crearPrueba', () => {
  const payload = {
    nombre_sistema: 'Sistema Test',
    descripcion_tarea: 'Tarea de prueba',
    usuarios: ['usr_001'],
    metricas: { accuracy: 0.9 },
  };

  it('sends POST with the given payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ status: 'success', token_version: 'tok12345' }));
    vi.stubGlobal('fetch', fetchMock);

    await crearPrueba(payload);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it('returns token_version from server', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ status: 'success', token_version: 'abc12345', link_generado: 'http://x' })));
    const result = await crearPrueba(payload);
    expect(result.token_version).toBe('abc12345');
  });

  it('throws on server error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, false, 400)));
    await expect(crearPrueba(payload)).rejects.toThrow('Error en el servidor');
  });
});

// ── fetchDashboardMetrics ─────────────────────────────────────────────────────

describe('fetchDashboardMetrics', () => {
  it('calls the endpoint without prueba_id when none given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ total_usuarios: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchDashboardMetrics();
    const [url] = fetchMock.mock.calls[0];
    expect(url).not.toContain('prueba_id');
    expect(url).toContain('dashboard-metrics');
  });

  it('appends prueba_id when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ total_usuarios: 3 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchDashboardMetrics(42);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('prueba_id=42');
  });

  it('returns parsed metrics', async () => {
    const fakeMetrics = { total_usuarios: 5, sistema_evaluado: 'Sistema A' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(fakeMetrics)));
    const result = await fetchDashboardMetrics(1);
    expect(result.total_usuarios).toBe(5);
  });
});

// ── fetchLogMetrics ───────────────────────────────────────────────────────────

describe('fetchLogMetrics', () => {
  it('returns null silently on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, false, 404)));
    const result = await fetchLogMetrics(1);
    expect(result).toBeNull();
  });

  it('returns parsed log metrics on ok response', async () => {
    const fakeLogs = { resumen_objetivo: { total_interacciones: 10 } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(fakeLogs)));
    const result = await fetchLogMetrics(1);
    expect(result.resumen_objetivo.total_interacciones).toBe(10);
  });
});

// ── compareTests ──────────────────────────────────────────────────────────────

describe('compareTests', () => {
  it('calls the correct URL with both tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    await compareTests('tok_a', 'tok_b');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('compare-tests/tok_a/tok_b');
  });

  it('returns comparison array', async () => {
    const fakeComparison = [{ nombre: 'Accuracy (%)', sistemaA: 80, sistemaB: 90 }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(fakeComparison)));
    const result = await compareTests('a', 'b');
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Accuracy (%)');
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, false, 500)));
    await expect(compareTests('a', 'b')).rejects.toThrow('Error en la comparación');
  });
});
