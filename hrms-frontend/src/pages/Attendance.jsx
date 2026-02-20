import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { attendanceApi, employeeApi } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Modal from '../components/Modal'

function MarkAttendanceForm({ employees, onSubmit, onClose, isLoading }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    employee_id: '',
    date: today,
    status: 'Present',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.employee_id) errs.employee_id = 'Please select an employee'
    if (!form.date) errs.date = 'Date is required'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit(form)
  }

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Employee *</label>
        <select
          className={`form-select ${errors.employee_id ? 'border-red-400' : ''}`}
          value={form.employee_id}
          onChange={handleChange('employee_id')}
        >
          <option value="">Select an employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.employee_id}>
              {e.full_name} ({e.employee_id})
            </option>
          ))}
        </select>
        {errors.employee_id && <p className="text-xs text-red-500 mt-1">{errors.employee_id}</p>}
      </div>

      <div>
        <label className="form-label">Date *</label>
        <input
          type="date"
          className={`form-input ${errors.date ? 'border-red-400' : ''}`}
          value={form.date}
          onChange={handleChange('date')}
          max={today}
        />
        {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
      </div>

      <div>
        <label className="form-label">Status *</label>
        <div className="flex gap-3">
          {['Present', 'Absent'].map((status) => (
            <label
              key={status}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                ${form.status === status
                  ? status === 'Present'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-red-400 bg-red-50 text-red-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
            >
              <input
                type="radio"
                name="status"
                value={status}
                checked={form.status === status}
                onChange={handleChange('status')}
                className="sr-only"
              />
              {status === 'Present' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-sm font-medium">{status}</span>
            </label>
          ))}
        </div>
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
              Saving...
            </>
          ) : (
            'Save Attendance'
          )}
        </button>
      </div>
    </form>
  )
}

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isMarking, setIsMarking] = useState(false)

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Per-employee summary panel
  const [summaries, setSummaries] = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filterEmployee) params.employee_id = filterEmployee
      if (filterDate) params.date = filterDate

      const [attRes, empRes] = await Promise.all([
        attendanceApi.getAll(params),
        employeeApi.getAll(),
      ])
      setRecords(attRes.data)
      setEmployees(empRes.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filterEmployee, filterDate])

  useEffect(() => { fetchData() }, [fetchData])

  // Fetch summary for selected employee
  useEffect(() => {
    if (!filterEmployee || summaries[filterEmployee]) return
    attendanceApi.getSummary(filterEmployee).then((res) => {
      setSummaries((p) => ({ ...p, [filterEmployee]: res.data }))
    }).catch(() => {})
  }, [filterEmployee, summaries])

  const handleMark = async (data) => {
    setIsMarking(true)
    try {
      await attendanceApi.mark(data)
      setShowModal(false)
      toast.success('Attendance recorded successfully!')
      setSummaries((p) => { const n = { ...p }; delete n[data.employee_id]; return n })
      fetchData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsMarking(false)
    }
  }

  const clearFilters = () => {
    setFilterEmployee('')
    setFilterDate('')
  }

  const hasFilters = filterEmployee || filterDate
  const selectedEmployee = employees.find((e) => e.employee_id === filterEmployee)
  const summary = summaries[filterEmployee]

  return (
    <div className="space-y-5">
      {/* Filters & Action Bar */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Filter by Employee</label>
              <select
                className="form-select"
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.employee_id}>
                    {e.full_name} ({e.employee_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Filter by Date</label>
              <input
                type="date"
                className="form-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary h-[38px]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
            <button onClick={() => setShowModal(true)} className="btn-primary h-[38px]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Mark Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Employee Summary (visible when filtered by employee) */}
      {filterEmployee && selectedEmployee && (
        <div className="card p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-xs text-slate-500">Selected Employee</p>
              <p className="text-sm font-semibold text-slate-800">{selectedEmployee.full_name}</p>
              <p className="text-xs text-slate-500">{selectedEmployee.department}</p>
            </div>
            {summary && (
              <>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-800">{summary.total_days}</p>
                    <p className="text-xs text-slate-500">Total Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">{summary.present_days}</p>
                    <p className="text-xs text-slate-500">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-500">{summary.absent_days}</p>
                    <p className="text-xs text-slate-500">Absent</p>
                  </div>
                  {summary.total_days > 0 && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">
                        {Math.round((summary.present_days / summary.total_days) * 100)}%
                      </p>
                      <p className="text-xs text-slate-500">Attendance Rate</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading attendance records..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchData} />
        ) : records.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No records found' : 'No attendance records yet'}
            description={
              hasFilters
                ? 'No records match the selected filters.'
                : 'Start marking attendance to see records here.'
            }
            action={
              !hasFilters ? (
                <button onClick={() => setShowModal(true)} className="btn-primary">
                  Mark Attendance
                </button>
              ) : (
                <button onClick={clearFilters} className="btn-secondary">
                  Clear Filters
                </button>
              )
            }
            icon={
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Employee ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Department
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-800">
                        {rec.full_name || rec.employee_id}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {rec.employee_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-600">
                        {new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{rec.department || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={rec.status === 'Present' ? 'badge-present' : 'badge-absent'}>
                        {rec.status === 'Present' ? (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        )}
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">
                {records.length} {records.length === 1 ? 'record' : 'records'} found
                {hasFilters && ' (filtered)'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !isMarking && setShowModal(false)}
        title="Mark Attendance"
      >
        {employees.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-500">
              No employees found. Please add employees first.
            </p>
            <button onClick={() => setShowModal(false)} className="btn-secondary mt-4">
              Close
            </button>
          </div>
        ) : (
          <MarkAttendanceForm
            employees={employees}
            onSubmit={handleMark}
            onClose={() => setShowModal(false)}
            isLoading={isMarking}
          />
        )}
      </Modal>
    </div>
  )
}
