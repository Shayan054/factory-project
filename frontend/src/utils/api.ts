const API = import.meta.env.VITE_API_URL;

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers,
  });

  // If token expired, try to refresh
  if (response.status === 401 && token) {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        const refreshResponse = await fetch(`${API}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('access_token', data.access);
          
          // Retry original request
          headers['Authorization'] = `Bearer ${data.access}`;
          return fetch(`${API}${endpoint}`, {
            ...options,
            headers,
          });
        }
      } catch (error) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  }

  return response;
};

