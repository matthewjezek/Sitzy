import { Navigate, Outlet } from "react-router";

export default function AnonymousRoute() {
  const token = localStorage.getItem('token')

  return token ? <Navigate to="/" replace /> : <Outlet />;
}
