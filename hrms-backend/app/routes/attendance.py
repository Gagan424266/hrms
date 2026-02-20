from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..models import Attendance, Employee
from ..schemas import (
    AttendanceCreate,
    AttendanceResponse,
    AttendanceWithEmployee,
    EmployeeAttendanceSummary,
)

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.get("/", response_model=List[AttendanceWithEmployee])
def get_all_attendance(
    employee_id: Optional[str] = Query(None),
    date_filter: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    query = db.query(Attendance, Employee).outerjoin(
        Employee, Attendance.employee_id == Employee.employee_id
    )

    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if date_filter:
        query = query.filter(Attendance.date == date_filter)

    results = query.order_by(Attendance.date.desc()).all()

    attendance_list = []
    for att, emp in results:
        item = AttendanceWithEmployee(
            id=att.id,
            employee_id=att.employee_id,
            date=att.date,
            status=att.status,
            created_at=att.created_at,
            full_name=emp.full_name if emp else None,
            department=emp.department if emp else None,
        )
        attendance_list.append(item)
    return attendance_list


@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(
        Employee.employee_id == attendance.employee_id
    ).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{attendance.employee_id}' not found",
        )

    existing = db.query(Attendance).filter(
        Attendance.employee_id == attendance.employee_id,
        Attendance.date == attendance.date,
    ).first()

    if existing:
        existing.status = attendance.status.value
        db.commit()
        db.refresh(existing)
        return existing

    db_attendance = Attendance(
        employee_id=attendance.employee_id,
        date=attendance.date,
        status=attendance.status.value,
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance


@router.get("/summary/{employee_id}", response_model=EmployeeAttendanceSummary)
def get_employee_summary(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    total = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.employee_id == employee_id)
        .scalar()
    )
    present = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.employee_id == employee_id, Attendance.status == "Present")
        .scalar()
    )
    return EmployeeAttendanceSummary(
        employee_id=employee_id,
        total_days=total,
        present_days=present,
        absent_days=total - present,
    )


@router.get("/employee/{employee_id}", response_model=List[AttendanceResponse])
def get_employee_attendance(employee_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id)
        .order_by(Attendance.date.desc())
        .all()
    )
    return records
