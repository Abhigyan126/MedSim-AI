import { useState, useEffect } from "react";
import API from "./api";
const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    API.get("/auth-check", { withCredentials: true })
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  return isAuthenticated;
};

export default useAuthCheck;
