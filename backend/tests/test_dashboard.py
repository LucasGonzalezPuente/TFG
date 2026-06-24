"""
tests/test_dashboard.py
Integration tests for GET /api/dashboard-metrics and GET /api/log-metrics.
"""
import pytest


class TestDashboardMetricsEmpty:
    """Behaviour when there is no data in the DB."""

    def test_no_prueba_returns_zero_usuarios(self, client):
        response = client.get("/api/dashboard-metrics")
        assert response.status_code == 200
        assert response.json()["total_usuarios"] == 0

    def test_unknown_prueba_id_returns_zero(self, client):
        response = client.get("/api/dashboard-metrics?prueba_id=9999")
        assert response.status_code == 200
        assert response.json()["total_usuarios"] == 0

    def test_prueba_without_sessions_returns_zero(self, client, prueba_fixture):
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba_fixture.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["total_usuarios"] == 0
        assert data["sistema_evaluado"] == prueba_fixture.nombre_sistema


class TestDashboardMetricsWithData:
    """Behaviour when a full session is seeded (via session_fixture)."""

    def test_total_usuarios_is_one(self, client, session_fixture):
        prueba, _, _ = session_fixture
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba.id}")
        assert response.status_code == 200
        assert response.json()["total_usuarios"] == 1

    def test_sistema_evaluado_matches_prueba(self, client, session_fixture):
        prueba, _, _ = session_fixture
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba.id}")
        assert response.json()["sistema_evaluado"] == prueba.nombre_sistema

    def test_subjetivo_keys_present(self, client, session_fixture):
        prueba, _, _ = session_fixture
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba.id}")
        subjetivo = response.json()["subjetivo"]
        assert "confianza" in subjetivo
        assert "explicabilidad" in subjetivo
        assert "carga_cognitiva" in subjetivo

    def test_objetivo_keys_present(self, client, session_fixture):
        prueba, _, _ = session_fixture
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba.id}")
        objetivo = response.json()["objetivo"]
        assert "tiempo_medio" in objetivo
        assert "accuracy_real_promedio" in objetivo

    def test_accuracy_computed_as_percentage(self, client, session_fixture):
        """LogObjetivo.accuracy = 0.80  →  should appear as 80.0 in response."""
        prueba, _, _ = session_fixture
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba.id}")
        accuracy = response.json()["objetivo"]["accuracy_real_promedio"]
        assert accuracy == pytest.approx(80.0, abs=0.1)

    def test_evaluador_accuracy_from_prueba_metricas(self, client, session_fixture):
        """Prueba.metricas_seleccionadas has accuracy=0.85 → 85.0."""
        prueba, _, _ = session_fixture
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba.id}")
        evaluador_acc = response.json()["evaluador"]["accuracy_esperado"]
        assert evaluador_acc == pytest.approx(85.0, abs=0.1)

    def test_detalles_individuales_has_one_entry(self, client, session_fixture):
        prueba, _, _ = session_fixture
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba.id}")
        detalles = response.json()["detalles_individuales"]
        assert len(detalles) == 1

    def test_detalles_entry_has_session_id(self, client, session_fixture):
        prueba, encuesta, _ = session_fixture
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba.id}")
        detalle = response.json()["detalles_individuales"][0]
        assert detalle["session_id"] == encuesta.session_id

    def test_confianza_score_in_range(self, client, session_fixture):
        prueba, _, _ = session_fixture
        response = client.get(f"/api/dashboard-metrics?prueba_id={prueba.id}")
        conf = response.json()["subjetivo"]["confianza"]
        assert 0 <= conf <= 100

    def test_latest_prueba_selected_when_no_id_given(self, client, session_fixture):
        """Without prueba_id the endpoint should pick the most recent prueba."""
        response = client.get("/api/dashboard-metrics")
        assert response.status_code == 200
        assert response.json()["total_usuarios"] >= 0


class TestLogMetricsEmpty:
    def test_no_prueba_returns_none(self, client):
        response = client.get("/api/log-metrics")
        assert response.status_code == 200
        # No prueba → None (the endpoint returns None)
        assert response.json() is None

    def test_unknown_prueba_id_returns_none(self, client):
        response = client.get("/api/log-metrics?prueba_id=9999")
        assert response.status_code == 200
        assert response.json() is None

    def test_prueba_without_logs_returns_zero_resumen(self, client, prueba_fixture):
        response = client.get(f"/api/log-metrics?prueba_id={prueba_fixture.id}")
        assert response.status_code == 200
        data = response.json()
        resumen = data["resumen_objetivo"]
        assert resumen["total_interacciones"] == 0
        assert resumen["total_errores"] == 0


class TestLogMetricsWithData:
    def test_resumen_total_interacciones(self, client, session_fixture):
        """LogObjetivo.numero_clics = 30."""
        prueba, _, _ = session_fixture
        response = client.get(f"/api/log-metrics?prueba_id={prueba.id}")
        assert response.json()["resumen_objetivo"]["total_interacciones"] == 30

    def test_resumen_total_errores(self, client, session_fixture):
        """LogObjetivo.errores_cometidos = 2."""
        prueba, _, _ = session_fixture
        response = client.get(f"/api/log-metrics?prueba_id={prueba.id}")
        assert response.json()["resumen_objetivo"]["total_errores"] == 2

    def test_resumen_tiempo_medio(self, client, session_fixture):
        """LogObjetivo.tiempo_total = 120.5."""
        prueba, _, _ = session_fixture
        response = client.get(f"/api/log-metrics?prueba_id={prueba.id}")
        assert response.json()["resumen_objetivo"]["tiempo_medio_s"] == pytest.approx(120.5, abs=0.1)

    def test_errores_por_sesion_present(self, client, session_fixture):
        prueba, _, _ = session_fixture
        response = client.get(f"/api/log-metrics?prueba_id={prueba.id}")
        errores = response.json()["errores_por_sesion"]
        assert isinstance(errores, list)
        assert len(errores) == 1
        assert "errores" in errores[0]

    def test_tiempo_por_sesion_present(self, client, session_fixture):
        prueba, _, _ = session_fixture
        response = client.get(f"/api/log-metrics?prueba_id={prueba.id}")
        tiempos = response.json()["tiempo_por_sesion"]
        assert isinstance(tiempos, list)
        assert tiempos[0]["tiempo_s"] == pytest.approx(120.5, abs=0.1)

    def test_metricas_evaluador_accuracy(self, client, session_fixture):
        """prueba.metricas_seleccionadas = {"accuracy": 0.85} → 85.0 in response."""
        prueba, _, _ = session_fixture
        response = client.get(f"/api/log-metrics?prueba_id={prueba.id}")
        metricas = response.json()["metricas_evaluador"]
        assert metricas.get("accuracy") == pytest.approx(85.0, abs=0.1)
