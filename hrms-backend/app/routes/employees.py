from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from ..database import get_db
from ..models import Employee, Attendance
from ..schemas import EmployeeCreate, EmployeeResponse

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("/", response_model=List[EmployeeResponse])
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).order_by(Employee.created_at.desc()).all()


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    existing_id = db.query(Employee).filter(
        Employee.employee_id == employee.employee_id
    ).first()
    if existing_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee with ID '{employee.employee_id}' already exists",
        )

    existing_email = db.query(Employee).filter(
        Employee.email == employee.email
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee with email '{employee.email}' already exists",
        )

    db_employee = Employee(**employee.model_dump())
    db.add(db_employee)
    try:
        db.commit()
        db.refresh(db_employee)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee with this ID or email already exists",
        )
    return db_employee


@router.get("/{employee_db_id}", response_model=EmployeeResponse)
def get_employee(employee_db_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_db_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    return employee


@router.delete("/{employee_db_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_db_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_db_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    # Also delete related attendance records
    db.query(Attendance).filter(
        Attendance.employee_id == employee.employee_id
    ).delete()
    db.delete(employee)
    db.commit()
    return None
