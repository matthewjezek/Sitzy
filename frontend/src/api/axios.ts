import axios from 'axios'

const instance = axios.create()

instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login?expired=1'
    }
    return Promise.reject(error)
  }
)

export default instance
