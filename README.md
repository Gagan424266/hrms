# HRMS Lite – Human Resource Management System

A lightweight, full-stack HRMS application that allows an admin to manage employee records and track daily attendance.

---

## Live Links

| Service | URL |
|---------|-----|
| Frontend | https://gagan424266.github.io/hrms/ |
| Backend API | https://hrms-backend.onrender.com |
| API Docs | https://hrms-backend.onrender.com/docs |
| GitHub | https://github.com/Gagan424266/hrms |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios |
| Backend | Python, FastAPI, SQLAlchemy ORM |
| Database | PostgreSQL (production) / SQLite (local dev, zero config) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git + GitHub |

---

## Features

### Employee Management
- Add employees with ID, Full Name, Email, Department
- View all employees in a searchable table
- Delete employees (also removes related attendance records)
- Duplicate employee ID and email validation

### Attendance Management
- Mark attendance (Present / Absent) for any employee and date
- Re-marking updates the existing record for that date
- Filter attendance by employee or date
- View per-employee summary: total days, present, absent, attendance rate %

### Dashboard
- Total employees count
- Total attendance records
- Present / Absent count for today
- Department-wise employee breakdown with progress bars
- Quick action links

---

## Project Structure

```
hrms/
├── hrms-backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models.py        # ORM models (Employee, Attendance)
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── routes/
│   │       ├── employees.py # GET, POST, DELETE /api/employees/
│   │       ├── attendance.py# GET, POST /api/attendance/
│   │       └── dashboard.py # GET /api/dashboard/
│   ├── requirements.txt
│   ├── render.yaml          # Render deploy config
│   └── Procfile
└── hrms-frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Employees.jsx
    │   │   └── Attendance.jsx
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── Modal.jsx
    │   │   ├── ConfirmDialog.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   ├── EmptyState.jsx
    │   │   └── ErrorMessage.jsx
    │   └── services/
    │       └── api.js       # Axios API layer
    ├── package.json
    └── vercel.json          # Vercel SPA routing config
```

---

## Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd hrms-backend

# Install dependencies
pip install -r requirements.txt

# Run the server (uses SQLite by default — no DB setup needed)
python -m uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### Frontend

```bash
cd hrms-frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:3000

---

## API Reference

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees/` | List all employees |
| POST | `/api/employees/` | Add new employee |
| DELETE | `/api/employees/{id}` | Delete employee |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance/` | List all records (supports `?employee_id=&date=` filters) |
| POST | `/api/attendance/` | Mark attendance |
| GET | `/api/attendance/summary/{employee_id}` | Get employee attendance summary |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/` | Get summary stats |

---

## Deployment

### Backend on Render
1. Go to [render.com](https://render.com) → sign up with GitHub
2. New → Web Service → connect `Gagan424266/hrms` repo
3. Set root directory: `hrms-backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add a PostgreSQL database → set `DATABASE_URL` env var
7. Enable `psycopg2-binary` line in `requirements.txt` for PostgreSQL support

### Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) → sign up with GitHub
2. New Project → import `Gagan424266/hrms` repo
3. Set root directory: `hrms-frontend`
4. Framework preset: Vite
5. Add env variable: `VITE_API_URL=<your-render-backend-url>`
6. Deploy

---

## Assumptions & Limitations

- Single admin user — no authentication or role-based access
- Attendance re-marking on the same date updates the existing record rather than creating a duplicate
- SQLite is used as the default local database; PostgreSQL is required in production (uncomment `psycopg2-binary` in requirements.txt)
- Leave management, payroll, and advanced HR features are out of scope
- Date input is capped at today (no future-date attendance)
