import { getUser } from "@/services/authStorage";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const user = getUser();

  // not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // logged in but wrong role → go to login
  if (allowedRoles && !allowedRoles.includes(user.accountType)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
