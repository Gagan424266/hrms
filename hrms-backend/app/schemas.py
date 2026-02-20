from pydantic import BaseModel, EmailStr, field_validator
from datetime import date, datetime
from typing import Optional, List
from enum import Enum


class AttendanceStatus(str, Enum):
    present = "Present"
    absent = "Absent"


class EmployeeCreate(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    department: str

    @field_validator("employee_id", "full_name", "department")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v.strip()


class EmployeeResponse(BaseModel):
    id: int
    employee_id: str
    full_name: str
    email: str
    department: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AttendanceCreate(BaseModel):
    employee_id: str
    date: date
    status: AttendanceStatus


class AttendanceResponse(BaseModel):
    id: int
    employee_id: str
    date: date
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AttendanceWithEmployee(BaseModel):
    id: int
    employee_id: str
    date: date
    status: str
    created_at: datetime
    full_name: Optional[str] = None
    department: Optional[str] = None

    model_config = {"from_attributes": True}


class EmployeeAttendanceSummary(BaseModel):
    employee_id: str
    total_days: int
    present_days: int
    absent_days: int


class DepartmentStat(BaseModel):
    department: str
    count: int


class DashboardStats(BaseModel):
    total_employees: int
    total_attendance_records: int
    present_today: int
    absent_today: int
    department_stats: List[DepartmentStat]
