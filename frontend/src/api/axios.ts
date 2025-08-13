import axios from 'axios'
import { useNavigate } from "react-router"

const AxiosInstance = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const instance = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 10000, // 10 seconds timeout
  });

  instance.interceptors.request.use(
    config => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    error => Promise.reject(error)
  )
  

  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token')
        navigate('/login?expired=1')
      }
      return Promise.reject(error)
    }
  )
  return instance
}
export default AxiosInstance
