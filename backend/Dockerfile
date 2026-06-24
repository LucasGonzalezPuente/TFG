FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (cached layer unless requirements.txt changes)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Source is bind-mounted at runtime for hot-reload; this COPY is only used
# for production builds or if the volume is absent.
COPY backend/ ./backend/

# Run uvicorn with --reload so code changes are picked up instantly
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
