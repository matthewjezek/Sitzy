import { Navigate, Outlet } from "react-router";

export default function AnonymousRoute() {
  const token = localStorage.getItem('access_token')

  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
