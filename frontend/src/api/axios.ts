import axios from 'axios'

const instance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000, // 10 seconds timeout
})

instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

export default instance