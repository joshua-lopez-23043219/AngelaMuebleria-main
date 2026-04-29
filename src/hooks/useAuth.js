import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("muebleria_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing saved user", e);
      }
    }
  }, []);

  const handleAuth = (data) => {
    setUser(data.user);
    localStorage.setItem("muebleria_token", data.token);
    localStorage.setItem("muebleria_user", JSON.stringify(data.user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("muebleria_token");
    localStorage.removeItem("muebleria_user");
  };

  return {
    user,
    handleAuth,
    handleLogout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };
}
