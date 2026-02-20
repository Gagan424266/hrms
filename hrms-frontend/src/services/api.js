import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// Employees
export const employeeApi = {
  getAll: () => api.get('/api/employees/'),
  create: (data) => api.post('/api/employees/', data),
  delete: (id) => api.delete(`/api/employees/${id}`),
  getById: (id) => api.get(`/api/employees/${id}`),
}

// Attendance
export const attendanceApi = {
  getAll: (params = {}) => api.get('/api/attendance/', { params }),
  mark: (data) => api.post('/api/attendance/', data),
  getByEmployee: (employeeId) =>
    api.get(`/api/attendance/employee/${employeeId}`),
  getSummary: (employeeId) =>
    api.get(`/api/attendance/summary/${employeeId}`),
}

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/'),
}
