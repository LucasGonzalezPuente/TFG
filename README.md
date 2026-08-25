# HCAI Dashboard

![HCAI Dashboard](https://img.shields.io/badge/Status-Active-brightgreen) ![React](https://img.shields.io/badge/React-19.2.6-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791) ![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED)

HCAI Dashboard (Human-Centered AI Dashboard) is a comprehensive web application designed to help evaluators configure experiments, collect subjective surveys, and log objective user interaction metrics when interacting with AI systems. It provides an end-to-end platform for both raw event tracking and analytical metric consolidation.

## 🌟 Key Features

- **Experiment Configuration:** Create and manage test iterations with custom metrics and descriptions.
- **Subjective Survey Collection:** Gather direct feedback from participants.
- **Objective Telemetry:** Log and analyze raw interactions (clicks, errors, completion time).
- **AI Performance Metrics:** Track system accuracy, precision, recall, F1 score, AUC-ROC, RMSE, and more.
- **Interactive Dashboard:** Visualize evaluation results with responsive charts using Recharts.

## 🏗️ Technology Stack

### Frontend
- **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Visualizations:** [Recharts](https://recharts.org/)
- **Testing:** [Vitest](https://vitest.dev/) + React Testing Library
- **Linting:** ESLint

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3)
- **ORM & Database:** SQLAlchemy + PostgreSQL
- **Authentication:** PyJWT (JSON Web Tokens)
- **Containerization:** Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js & npm (if running the frontend locally outside Docker)
- Python 3.10+ (if running the backend locally outside Docker)

### Running with Docker (Recommended)

The easiest way to start the entire stack (Database, Backend, and Frontend) is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/LucasGonzalezPuente/TFG.git
cd tfg-def

# Start the application
docker-compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API Docs (Swagger UI):** http://localhost:8000/docs
- **Database:** Exposed internally to the backend, running on standard port `5432`.

### Local Development Setup

If you prefer to run the services individually without Docker:

#### 1. Database
Make sure you have a PostgreSQL instance running and update the `DATABASE_URL` environment variable accordingly. 
By default, the backend expects: `postgresql://postgres:root@localhost/hcai_db`

#### 2. Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testing

### Frontend Tests
The frontend uses Vitest. To run tests:
```bash
cd frontend
npm run test
# For coverage reports:
npm run test:coverage
```

### Backend Tests
To run Python tests (assuming `pytest` is in `requirements-test.txt`):
```bash
cd backend
pip install -r requirements-test.txt
pytest
```

## 📂 Project Structure

```
.
├── backend/                  # FastAPI Application
│   ├── routers/              # API Endpoints (auth, dashboard, surveys, etc.)
│   ├── models.py             # SQLAlchemy DB Models
│   ├── schemas.py            # Pydantic Schemas
│   ├── database.py           # DB Connection Setup
│   ├── main.py               # FastAPI Entrypoint
│   └── Dockerfile
├── frontend/                 # React Application
│   ├── src/                  # React Components, Pages, and Tests
│   ├── public/               # Static Assets
│   └── Dockerfile
├── docker-compose.yml        # Orchestration file
└── README.md
```

## 📜 License

This project is created as part of a final degree project (TFG - Trabajo de Fin de Grado).
