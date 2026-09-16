import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { GUEST_USER } from '../demo/demoData';
import {
  clearGuestSessionStorage,
  isGuestMode,
  setGuestModeFlag,
  startFreshDemoStore,
} from '../demo/demoStore';

// Local default for `npm run dev`; hosting sets VITE_API_URL at build time.
const API = (
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://127.0.0.1:8000/api'
).replace(/\/$/, '');

const join = (endpoint: string) =>
  endpoint.startsWith('/') ? `${API}${endpoint}` : `${API}/${endpoint}`;

interface User {
  employee_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'CEO' | 'MANAGER';
  date_joined: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  enterGuest: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  isGuest: boolean;
  isCEO: boolean;
  isManager: boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const navigate = useNavigate();

  // Load real user from localStorage, or restore guest session from sessionStorage
  useEffect(() => {
    if (isGuestMode()) {
      setIsGuest(true);
      setUser(GUEST_USER);
      setToken(null);
      return;
    }

    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Leaving demo for a real login
    clearGuestSessionStorage();
    setIsGuest(false);

    try {
      const response = await fetch(join('/auth/login/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      setToken(data.access);
      setUser(data.user);

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (error: any) {
      throw error;
    }
  };

  /** Start Guest/Demo Mode with a fresh in-browser dataset (no backend). */
  const enterGuest = () => {
    // Clear any real auth so we never mix tokens with demo mode
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);

    clearGuestSessionStorage();
    setGuestModeFlag(true);
    startFreshDemoStore();

    setIsGuest(true);
    setUser(GUEST_USER);

    setTimeout(() => {
      navigate('/', { replace: true });
    }, 50);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    clearGuestSessionStorage();
    setToken(null);
    setUser(null);
    setIsGuest(false);
    navigate('/login');
  };

  const refreshToken = async () => {
    if (isGuest || isGuestMode()) return;

    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        logout();
        return;
      }

      const response = await fetch(join('/auth/refresh/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        logout();
        return;
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      setToken(data.access);
    } catch {
      logout();
    }
  };

  const isAuthenticated = (!!token && !!user) || isGuest;
  const isCEO = !isGuest && user?.role === 'CEO';
  const isManager = isGuest || user?.role === 'MANAGER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        enterGuest,
        logout,
        isAuthenticated,
        isGuest,
        isCEO,
        isManager,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
