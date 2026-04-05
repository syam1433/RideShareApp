import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // named import (correct)
import API from "../../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadUser = async () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      try {
        const decoded = jwtDecode(token);

        const normalizedId = decoded.id || decoded.userId;

        API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        let profile = {};
        try {
          const res = await API.get("/users/me");
          profile = res.data || {};
        } catch (profileErr) {
          console.warn("Failed to load profile:", profileErr.message);
        }

        setUser({
          id: profile._id || normalizedId,
          _id: profile._id || normalizedId,
          name: profile.name || decoded.name || "User",
          email: profile.email || decoded.email || "",
          phone: profile.phone || decoded.phone || "",
          avatar: profile.avatar || "",
          role: profile.role || role || decoded.role || "user",
          rating: profile.rating,
          totalReviews: profile.totalReviews,
          overloadViolations: profile.overloadViolations,
          canCreateRide: profile.canCreateRide,
          isBlacklisted: profile.isBlacklisted,
          blacklistReason: profile.blacklistReason,
          blacklistedAt: profile.blacklistedAt,
          token,
        });
      } catch (err) {
        console.error("Token decode failed:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    }

    setLoading(false);
  };

  loadUser();
}, []);

  const login = (token, role, userData = {}) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const normalizedId = userData.id || userData._id;
    setUser({
      ...userData,
      id: normalizedId,
      _id: normalizedId,
      role,
      token,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    delete API.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!user.token,
    isDriver: user?.role === "driver",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);