import axios from 'axios';

export default function CallAPI<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: unknown): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  return axios({
    url,
    method,
    headers,
    data,
  })
    .then(response => response.data)
    .catch(error => {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`API error: ${error.response.status} - ${error.response.statusText}`);
        } else {
          throw new Error(`Network error: ${error.message}`);
        }
      } else {
        throw new Error('An unexpected error occurred');
      }
    });
}