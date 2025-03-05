import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { storeToken, getToken, deleteToken } from "@/services/AuthenService";
import { login as apiLogin, loginGoogle } from "@/services/AuthenService";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      setIsAuthenticated(!!token);
    };
    checkAuth();
  
    // Listen for OAuth redirect
    const handleDeepLink = ({ url }: { url: string }) => {
      const { queryParams } = Linking.parse(url);
      console.log(queryParams)
      if (queryParams && queryParams.access_token) {
        const accessToken = queryParams.access_token as string;
        storeToken(accessToken);
        setIsAuthenticated(true);
        router.push("/(tabs)"); // Navigate to home page
      }
    };
  
    const subscription = Linking.addEventListener("url", handleDeepLink);
  
    // Cleanup with the 'remove' method
    return () => {
      subscription.remove();
    };
  }, []);
  

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    if (response === true) {
      setIsAuthenticated(true);
      router.push("/(tabs)");
      return true;
    }
    return response;
  };

  const loginWithGoogle = async () => {
    try {
      const response = await loginGoogle();
      console.log(response)
      const loginUrl = response.data;

      if (loginUrl) {
        // router.push(loginUrl);
      } else {
        console.error("No URL received from Google login API");
      }
    } catch (error) {
      console.error("Failed to initiate Google login", error);
    }
  };

  const logout = async () => {
    await deleteToken();
    setIsAuthenticated(false);
    router.replace("/Login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, loginWithGoogle, logout }}>
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
