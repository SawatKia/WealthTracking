// context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { storeToken, getToken, deleteToken } from "@/services/Authen"; // Token storage utilities
import { login as apiLogin } from "@/services/Authen"; // API login function
import { useRouter } from "expo-router";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken(); // Check for stored token
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const success = await apiLogin(email, password);
    console.log(success);
    if (success) {
      setIsAuthenticated(true);
      router.push("/(tabs)"); // Redirect to home
      return true;
    }
    return false;
  };

  const logout = async () => {
    await deleteToken(); // Remove stored token
    setIsAuthenticated(false);
    router.replace("/Login"); // Redirect to login
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
