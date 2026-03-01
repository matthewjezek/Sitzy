import axios, { AxiosError } from 'axios'

const instance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  withCredentials: true,
})

export const AUTH_EXPIRED_EVENT = 'auth:expired'

instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

instance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers!.Authorization = `Bearer ${token}`
        return instance(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(
        'http://localhost:8000/auth/refresh',
        {},
        { withCredentials: true },
      )

      localStorage.setItem('access_token', data.access_token)
      processQueue(null, data.access_token)
      originalRequest.headers!.Authorization = `Bearer ${data.access_token}`
      return instance(originalRequest)
    } catch (err) {
      processQueue(err, null)
      localStorage.removeItem('access_token')
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default instance