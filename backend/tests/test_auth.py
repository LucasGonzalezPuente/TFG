"""
tests/test_auth.py
Integration tests for POST /api/login.
"""


class TestLogin:
    def test_valid_credentials_returns_200_and_token(self, client):
        response = client.post("/api/login", json={"username": "admin", "password": "admin123"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "token" in data
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 10

    def test_wrong_password_returns_401(self, client):
        response = client.post("/api/login", json={"username": "admin", "password": "wrong"})
        assert response.status_code == 401
        assert response.json()["detail"] == "Error de login"

    def test_wrong_username_returns_401(self, client):
        response = client.post("/api/login", json={"username": "hacker", "password": "admin123"})
        assert response.status_code == 401

    def test_both_wrong_returns_401(self, client):
        response = client.post("/api/login", json={"username": "x", "password": "y"})
        assert response.status_code == 401

    def test_missing_password_returns_422(self, client):
        response = client.post("/api/login", json={"username": "admin"})
        assert response.status_code == 422

    def test_missing_username_returns_422(self, client):
        response = client.post("/api/login", json={"password": "admin123"})
        assert response.status_code == 422

    def test_empty_body_returns_422(self, client):
        response = client.post("/api/login", json={})
        assert response.status_code == 422

    def test_token_is_valid_jwt_structure(self, client):
        """JWT has 3 base64 segments separated by dots."""
        response = client.post("/api/login", json={"username": "admin", "password": "admin123"})
        token = response.json()["token"]
        parts = token.split(".")
        assert len(parts) == 3
