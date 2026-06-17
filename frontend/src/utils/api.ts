const API = (import.meta.env.VITE_API_URL).replace(/\/$/, '');

const join = (endpoint: string) => endpoint.startsWith('/') ? `${API}${endpoint}` : `${API}/${endpoint}`;

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(join(endpoint), {
    ...options,
    headers,
  });

  // Check if response is HTML (error page) instead of JSON - only for error responses
  // This helps identify when the API URL is wrong or server returns error pages
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Clone response to peek at content without consuming original
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      if (text.trim().startsWith('<!')) {
        throw new Error(`Server returned HTML error page (${response.status}). Check API URL: ${join(endpoint)}`);
      }
    }
  }

  // If token expired, try to refresh
  if (response.status === 401 && token) {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        const refreshResponse = await fetch(join('/auth/refresh/'), {
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

