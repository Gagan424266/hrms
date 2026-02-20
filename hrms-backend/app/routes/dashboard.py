from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from ..database import get_db
from ..models import Employee, Attendance
from ..schemas import DashboardStats, DepartmentStat

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()

    total_employees = db.query(func.count(Employee.id)).scalar() or 0
    total_attendance = db.query(func.count(Attendance.id)).scalar() or 0

    present_today = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.date == today, Attendance.status == "Present")
        .scalar()
        or 0
    )
    absent_today = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.date == today, Attendance.status == "Absent")
        .scalar()
        or 0
    )

    dept_query = (
        db.query(Employee.department, func.count(Employee.id).label("count"))
        .group_by(Employee.department)
        .all()
    )
    department_stats = [
        DepartmentStat(department=d, count=c) for d, c in dept_query
    ]

    return DashboardStats(
        total_employees=total_employees,
        total_attendance_records=total_attendance,
        present_today=present_today,
        absent_today=absent_today,
        department_stats=department_stats,
    )
