import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { User } from "@decisionos/shared";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await api.post("/auth/login", { email, password, rememberMe });
    setUser(response.data.data.user);
    navigate("/dashboard");
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post("/auth/register", { name, email, password });
    setUser(response.data.data.user);
    navigate("/dashboard");
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    navigate("/login");
  };

  const updateUser = async (data: Partial<User>) => {
    const response = await api.patch("/users/settings", data);
    setUser(response.data.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}