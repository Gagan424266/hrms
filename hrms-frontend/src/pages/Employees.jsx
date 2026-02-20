import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { employeeApi } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Legal',
  'Customer Support',
]

function AddEmployeeForm({ onSubmit, onClose, isLoading }) {
  const [form, setForm] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    department: '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.employee_id.trim()) errs.employee_id = 'Employee ID is required'
    if (!form.full_name.trim()) errs.full_name = 'Full name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address'
    if (!form.department) errs.department = 'Department is required'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit(form)
  }

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Employee ID *</label>
        <input
          type="text"
          placeholder="e.g. EMP-001"
          className={`form-input ${errors.employee_id ? 'border-red-400 focus:ring-red-400' : ''}`}
          value={form.employee_id}
          onChange={handleChange('employee_id')}
        />
        {errors.employee_id && <p className="text-xs text-red-500 mt-1">{errors.employee_id}</p>}
      </div>

      <div>
        <label className="form-label">Full Name *</label>
        <input
          type="text"
          placeholder="e.g. Jane Doe"
          className={`form-input ${errors.full_name ? 'border-red-400 focus:ring-red-400' : ''}`}
          value={form.full_name}
          onChange={handleChange('full_name')}
        />
        {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
      </div>

      <div>
        <label className="form-label">Email Address *</label>
        <input
          type="email"
          placeholder="e.g. jane@company.com"
          className={`form-input ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
          value={form.email}
          onChange={handleChange('email')}
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="form-label">Department *</label>
        <select
          className={`form-select ${errors.department ? 'border-red-400 focus:ring-red-400' : ''}`}
          value={form.department}
          onChange={handleChange('department')}
        >
          <option value="">Select department</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding...
            </>
          ) : (
            'Add Employee'
          )}
        </button>
      </div>
    </form>
  )
}

function EmployeeRow({ employee, onDelete }) {
  const initials = employee.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
  ]
  const colorIndex = employee.id % colors.length

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors[colorIndex]}`}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{employee.full_name}</p>
            <p className="text-xs text-slate-500">{employee.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {employee.employee_id}
        </span>
      </td>
      <td className="px-5 py-3.5 hidden md:table-cell">
        <span className="text-sm text-slate-600">{employee.department}</span>
      </td>
      <td className="px-5 py-3.5 hidden lg:table-cell">
        <span className="text-xs text-slate-500">
          {new Date(employee.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={() => onDelete(employee)}
          className="btn-danger-outline"
          title="Delete employee"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span className="hidden sm:inline">Delete</span>
        </button>
      </td>
    </tr>
  )
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await employeeApi.getAll()
      setEmployees(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees() }, [])

  const handleAdd = async (data) => {
    setIsAdding(true)
    try {
      const res = await employeeApi.create(data)
      setEmployees((prev) => [res.data, ...prev])
      setShowAddModal(false)
      toast.success(`${data.full_name} added successfully!`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await employeeApi.delete(deleteTarget.id)
      setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      toast.success(`${deleteTarget.full_name} deleted.`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search employees..."
              className="form-input pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading employees..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchEmployees} />
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees yet"
            description="Add your first employee to get started with HRMS Lite."
            action={
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                Add Employee
              </button>
            }
            icon={
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No results found"
            description={`No employees match "${search}"`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Department
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Joined
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => (
                  <EmployeeRow key={emp.id} employee={emp} onDelete={setDeleteTarget} />
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">
                Showing {filtered.length} of {employees.length} employees
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isAdding && setShowAddModal(false)}
        title="Add New Employee"
      >
        <AddEmployeeForm
          onSubmit={handleAdd}
          onClose={() => setShowAddModal(false)}
          isLoading={isAdding}
        />
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteTarget?.full_name}? This will also remove all their attendance records and cannot be undone.`}
        confirmLabel="Delete Employee"
        isLoading={isDeleting}
      />
    </div>
  )
}
