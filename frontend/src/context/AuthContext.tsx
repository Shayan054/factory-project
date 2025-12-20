import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, ''); 

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
  logout: () => void;
  isAuthenticated: boolean;
  isCEO: boolean;
  isManager: boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        // Clear invalid data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim().startsWith('<!')) {
          throw new Error(`Server returned HTML instead of JSON. Check API URL: ${API}/auth/login/`);
        }
      }

      if (!response.ok) {
        // Handle empty response or non-JSON response
        let errorMessage = 'Login failed';
        try {
          const errorText = await response.text();
          if (errorText && !errorText.trim().startsWith('<!')) {
            try {
              const error = JSON.parse(errorText);
              errorMessage = error.error || error.detail || errorMessage;
            } catch {
              errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
            }
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}. Check if API is running at ${API}`;
          }
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}. Check if API is running at ${API}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Store tokens and user
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update state first
      setToken(data.access);
      setUser(data.user);
      
      // Navigate to dashboard after a brief delay to ensure state is updated
      // This ensures ProtectedRoute recognizes the user as authenticated
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        logout();
        return;
      }

      const response = await fetch(`${API}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim().startsWith('<!')) {
          console.error('Server returned HTML instead of JSON for token refresh');
          logout();
          return;
        }
      }

      if (!response.ok) {
        logout();
        return;
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      setToken(data.access);
    } catch (error) {
      logout();
    }
  };

  const isAuthenticated = !!token && !!user;
  const isCEO = user?.role === 'CEO';
  const isManager = user?.role === 'MANAGER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
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

