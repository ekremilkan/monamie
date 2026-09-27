import React, { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode, FC } from "react";
import { useCart } from "./CartContext";
import { buildApiUrl } from "@/lib/api";

interface AuthContextType {
  token: string | null;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (token: string) => void;
  logout: () => void;
  googleLogin: () => Promise<void>;
  linkGoogleAccount: () => void;
  unlinkGoogleAccount: () => Promise<void>;
  isGoogleLinked: boolean;
  // OTP Methodları
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  registerRequestOtp: (email: string, firstName: string, lastName: string) => Promise<void>;
  registerVerifyOtp: (email: string, code: string, firstName: string, lastName: string) => Promise<void>;
  logoutAll: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_STORAGE_KEY = "mon-amie-chicken-token";

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      return null;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Google hesap bağlantı durumunu kontrol et
  useEffect(() => {
    if (token) {
      const checkGoogleAccountStatus = async () => {
        try {
          const response = await fetch(buildApiUrl("/api/oauth/google/status"), {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setIsGoogleLinked(data.isLinked);
          }
        } catch (error) {
          console.error("Google hesap durumu kontrol edilemedi:", error);
        }
      };
      
      checkGoogleAccountStatus();
    }
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
    window.localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    closeLoginModal(); // Giriş başarılı olduğunda modalı otomatik kapat.
  };

  const logout = () => {
    setToken(null);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const googleLogin = async (): Promise<void> => {
    try {
      const redirectBase = window.location.origin;
      const statePayload = JSON.stringify({
        redirectBase,
        nonce:
          window.crypto?.randomUUID?.() ??
          Math.random().toString(36).replace(/[^a-z0-9]+/g, ""),
      });
      const response = await fetch(
        buildApiUrl(
          `/api/oauth/google/auth-url?state=${encodeURIComponent(statePayload)}`
        )
      );
      if (!response.ok) {
        throw new Error("Failed to get Google auth URL");
      }
      const json = (await response.json()) as GoogleAuthUrlResponse;
      const url = json?.data?.authUrl;
      if (!url) {
        throw new Error("Auth URL missing");
      }
      window.location.href = url;
    } catch (error) {
      console.error("Google login redirect failed:", error);
    }
  };

  const linkGoogleAccount = () => {
    // Google hesabını bağlamak için yönlendir
    window.location.href = buildApiUrl("/api/oauth/google/link");
  };

  const unlinkGoogleAccount = async () => {
    try {
      const response = await fetch(buildApiUrl("/api/oauth/google/unlink"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setIsGoogleLinked(false);
      } else {
        console.error("Google hesabı bağlantısı kaldırılamadı");
      }
    } catch (error) {
      console.error("Google hesabı bağlantısı kaldırılırken hata:", error);
    }
  };

  // OTP Methodları
  const requestOtp = async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl("/api/auth/request-otp"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP-Anfrage fehlgeschlagen');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP-Überprüfung fehlgeschlagen');
      }

      login(data.data.token);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerRequestOtp = async (email: string, firstName: string, lastName: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, firstName, lastName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerVerifyOtp = async (email: string, code: string, firstName: string, lastName: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl("/api/auth/verify-registration"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code, firstName, lastName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrierungsbestätigung fehlgeschlagen');
      }

      login(data.data.token);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAll = async (): Promise<void> => {
    if (!token) return;
    
    try {
      const response = await fetch(buildApiUrl("/api/auth/logout-all"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        logout();
      }
    } catch (error) {
      console.error('Logout all error:', error);
    }
  };

  const value = {
    token,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    login,
    logout,
    googleLogin,
    linkGoogleAccount,
    unlinkGoogleAccount,
    isGoogleLinked,
    // OTP Methodları
    requestOtp,
    verifyOtp,
    registerRequestOtp,
    registerVerifyOtp,
    logoutAll,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// 4. Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Response tipi: /api/oauth/google/auth-url
interface GoogleAuthUrlResponse {
  success: boolean;
  data: {
    authUrl: string;
  };
}
