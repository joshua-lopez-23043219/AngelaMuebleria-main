import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("muebleria_user");
    if (savedUser && savedUser !== "undefined") {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object') {
          setUser(parsed);
        }
      } catch (e) {
        console.error("Error parsing saved user", e);
        localStorage.removeItem("muebleria_user");
        localStorage.removeItem("muebleria_token");
      }
    } else if (savedUser === "undefined") {
      localStorage.removeItem("muebleria_user");
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
