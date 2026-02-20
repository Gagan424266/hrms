FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" sqlalchemy "pydantic[email]" python-dotenv alembic

COPY . .

RUN mkdir -p /app/data && chmod 777 /app/data

ENV DATABASE_URL=sqlite:////app/data/hrms.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
