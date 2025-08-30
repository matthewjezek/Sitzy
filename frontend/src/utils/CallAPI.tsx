import instance from '../api/axios';
import { useNavigate } from 'react-router';

export default function CallAPI<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: unknown): Promise<T> {
  const navigate = useNavigate();
  return instance({
    url,
    method,
    data,
  })
    .then(response => response.data)
    .catch(error => {
      if (error.response && error.response.status === 401) {
        navigate('/login?expired=1');
        return Promise.reject(new Error('Unauthorized'));
      }
      if (error.message) {
        return Promise.reject(new Error(error.message));
      }
      return Promise.reject(new Error('An unexpected error occurred'));
    });
}
