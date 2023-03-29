import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuthContext";
  
const ProtectedRoute: React.FC = () => {
    const {isLoggedIn} = useAuth();
    return (
        isLoggedIn ? <Outlet /> : <Navigate to="/login" />
    );
}

export default ProtectedRoute;