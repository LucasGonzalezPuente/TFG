"""
tests/test_pruebas.py
Integration tests for the pruebas router.
"""
import pytest


class TestCrearPrueba:
    PAYLOAD = {
        "nombre_sistema": "Sistema A",
        "descripcion_tarea": "Evaluar recomendaciones",
        "metricas": {"accuracy": 0.85, "f1_score": 0.80},
    }

    def test_crear_prueba_returns_200(self, client):
        response = client.post("/api/crear-prueba", json=self.PAYLOAD)
        assert response.status_code == 200

    def test_crear_prueba_returns_token_and_link(self, client):
        response = client.post("/api/crear-prueba", json=self.PAYLOAD)
        data = response.json()
        assert data["status"] == "success"
        assert "token_version" in data
        assert "link_generado" in data
        assert data["link_generado"].startswith("http://")

    def test_crear_prueba_token_is_8_chars(self, client):
        response = client.post("/api/crear-prueba", json=self.PAYLOAD)
        token = response.json()["token_version"]
        assert len(token) == 8

    def test_crear_prueba_nombre_sistema_in_response(self, client):
        response = client.post("/api/crear-prueba", json=self.PAYLOAD)
        assert response.json()["nombre_sistema"] == "Sistema A"

    def test_crear_prueba_missing_nombre_returns_422(self, client):
        bad = {k: v for k, v in self.PAYLOAD.items() if k != "nombre_sistema"}
        response = client.post("/api/crear-prueba", json=bad)
        assert response.status_code == 422

    def test_two_pruebas_get_different_tokens(self, client):
        r1 = client.post("/api/crear-prueba", json=self.PAYLOAD)
        r2 = client.post("/api/crear-prueba", json=self.PAYLOAD)
        assert r1.json()["token_version"] != r2.json()["token_version"]


class TestListarPruebas:
    def test_empty_db_returns_empty_list(self, client):
        response = client.get("/api/pruebas-realizadas")
        assert response.status_code == 200
        assert response.json() == []

    def test_returns_list_after_creating_prueba(self, client):
        client.post("/api/crear-prueba", json={
            "nombre_sistema": "Sistema B",
            "descripcion_tarea": "Tarea B",
            "metricas": {"accuracy": 0.9},
        })
        response = client.get("/api/pruebas-realizadas")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["nombre_sistema"] == "Sistema B"

    def test_prueba_has_expected_fields(self, client, prueba_fixture):
        response = client.get("/api/pruebas-realizadas")
        item = response.json()[0]
        assert "id" in item
        assert "nombre_sistema" in item
        assert "token_version" in item
        assert "fecha_creacion" in item





class TestCompareTests:
    def test_unknown_tokens_return_zeros(self, client):
        response = client.get("/api/compare-tests/fake_a/fake_b")
        assert response.status_code == 200
        data = response.json()
        # Should return a list of comparison rows
        assert isinstance(data, list)
        assert len(data) == 3

    def test_comparison_row_has_expected_keys(self, client):
        response = client.get("/api/compare-tests/fake_a/fake_b")
        for row in response.json():
            assert "nombre" in row
            assert "sistemaA" in row
            assert "sistemaB" in row

    def test_same_token_twice_returns_identical_values(self, client, prueba_fixture):
        token = prueba_fixture.token_version
        response = client.get(f"/api/compare-tests/{token}/{token}")
        data = response.json()
        for row in data:
            assert row["sistemaA"] == row["sistemaB"]
