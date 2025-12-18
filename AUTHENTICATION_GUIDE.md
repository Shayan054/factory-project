# 🔐 Authentication & Authorization System - Complete Guide

## 📚 Table of Contents
1. [Overview: Authentication vs Authorization](#overview)
2. [Backend Architecture](#backend)
3. [Frontend Architecture](#frontend)
4. [Complete Flow Diagram](#flow)
5. [Key Concepts Explained](#concepts)
6. [Common Questions & Answers](#qa)

---

## 🎯 Overview: Authentication vs Authorization {#overview}

### **Authentication** (Who are you?)
- **Purpose**: Verify user identity (login)
- **Method**: Email + Password → JWT Tokens
- **Result**: User is identified and logged in

### **Authorization** (What can you do?)
- **Purpose**: Control what actions user can perform
- **Method**: Role-based permissions (CEO vs Manager)
- **Result**: Different access levels based on role

---

## 🏗️ Backend Architecture {#backend}

### 1. **Custom User Model** (`models.py`)

#### Why Custom User Model?
- Default Django User model doesn't fit our needs
- We need **roles** (CEO, Manager) and custom fields

#### Implementation:
```python
class Employee(AbstractBaseUser, PermissionsMixin):
    # Custom fields
    email = models.EmailField(unique=True)  # Login with email
    role = models.CharField(choices=[('CEO', 'CEO'), ('MANAGER', 'Manager')])
    
    # Helper methods
    def is_ceo(self):
        return self.role == 'CEO'
    
    def is_manager(self):
        return self.role == 'MANAGER'
```

**Key Concepts:**
- `AbstractBaseUser`: Base class for custom user (handles password hashing)
- `PermissionsMixin`: Adds Django permission system
- `USERNAME_FIELD = 'email'`: Login with email instead of username

---

### 2. **JWT Authentication** (`auth_views.py`)

#### What is JWT?
- **JWT** = JSON Web Token
- Stateless authentication (no server-side sessions)
- Token contains user info (encrypted)

#### Login Flow:
```python
@api_view(['POST'])
def login_view(request):
    # 1. Get email & password
    email = request.data['email']
    password = request.data['password']
    
    # 2. Verify credentials
    employee = Employee.objects.get(email=email)
    if employee.check_password(password):
        # 3. Generate JWT tokens
        refresh = RefreshToken.for_user(employee)
        
        # 4. Return tokens + user data
        return {
            'access': str(refresh.access_token),  # Short-lived (1 day)
            'refresh': str(refresh),              # Long-lived (7 days)
            'user': employee_data
        }
```

**Token Types:**
- **Access Token**: Used for API requests (expires in 1 day)
- **Refresh Token**: Used to get new access token (expires in 7 days)

---

### 3. **Role-Based Permissions** (`permissions.py`)

#### Permission Classes:

**1. `IsCEO`** - Only CEO can access
```python
def has_permission(self, request, view):
    return request.user.is_authenticated and request.user.is_ceo()
```

**2. `IsCEOOrReadOnly`** - CEO can do everything, others can only read
```python
def has_permission(self, request, view):
    if request.method in SAFE_METHODS:  # GET, HEAD, OPTIONS
        return request.user.is_authenticated  # Anyone logged in
    return request.user.is_ceo()  # Only CEO for POST, PUT, DELETE
```

**3. `IsCEOOrManagerCanAdd`** - CEO full access, Manager can add/view only
```python
def has_permission(self, request, view):
    if request.user.is_ceo():
        return True  # CEO can do everything
    
    if request.user.is_manager():
        return request.method in ['GET', 'POST']  # Manager: view & add only
    
    return False
```

**How it works:**
- Each ViewSet has `permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]`
- Before processing request, Django checks permissions
- If permission denied → Returns 403 Forbidden

---

### 4. **Django Settings** (`settings.py`)

#### Key Configurations:

```python
# 1. Use our custom user model
AUTH_USER_MODEL = 'fact_app.Employee'

# 2. REST Framework uses JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# 3. JWT Token Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),  # Authorization: Bearer <token>
}
```

---

## 🎨 Frontend Architecture {#frontend}

### 1. **AuthContext** (`AuthContext.tsx`)

#### Purpose:
- Centralized authentication state management
- Provides auth functions to all components

#### Key Features:

**State Management:**
```typescript
const [user, setUser] = useState<User | null>(null);
const [token, setToken] = useState<string | null>(null);
```

**Login Function:**
```typescript
const login = async (email: string, password: string) => {
    // 1. Send credentials to backend
    const response = await fetch('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    // 2. Get tokens + user data
    const { access, refresh, user } = await response.json();
    
    // 3. Store in localStorage
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    // 4. Update state
    setToken(access);
    setUser(user);
    
    // 5. Navigate to dashboard
    navigate('/');
};
```

**Token Refresh:**
```typescript
const refreshToken = async () => {
    const refresh = localStorage.getItem('refresh_token');
    
    // Get new access token
    const response = await fetch('/api/auth/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh })
    });
    
    const { access } = await response.json();
    localStorage.setItem('access_token', access);
    setToken(access);
};
```

**Helper Properties:**
```typescript
const isAuthenticated = !!token && !!user;
const isCEO = user?.role === 'CEO';
const isManager = user?.role === 'MANAGER';
```

---

### 2. **Protected Routes** (`ProtectedRoute.tsx`)

#### Purpose:
- Prevent unauthorized access to pages
- Redirect to login if not authenticated

#### Implementation:
```typescript
export default function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
}
```

**Usage:**
```typescript
<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/operations" element={<Operations />} />
</Route>
```

---

### 3. **API Request Utility** (`api.ts`)

#### Purpose:
- Automatically add JWT token to all API requests
- Handle token refresh on 401 errors

#### Implementation:
```typescript
export const apiRequest = async (endpoint: string, options = {}) => {
    // 1. Get token from localStorage
    const token = localStorage.getItem('access_token');
    
    // 2. Add Authorization header
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // JWT token
    };
    
    // 3. Make request
    const response = await fetch(`${API}${endpoint}`, {
        ...options,
        headers
    });
    
    // 4. If 401 (Unauthorized), try refresh token
    if (response.status === 401 && token) {
        const refresh = localStorage.getItem('refresh_token');
        const refreshResponse = await fetch('/api/auth/refresh/', {
            method: 'POST',
            body: JSON.stringify({ refresh })
        });
        
        if (refreshResponse.ok) {
            const { access } = await refreshResponse.json();
            localStorage.setItem('access_token', access);
            
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${access}`;
            return fetch(`${API}${endpoint}`, { ...options, headers });
        }
    }
    
    return response;
};
```

**Why this is important:**
- Every API call automatically includes authentication
- No need to manually add token in each component
- Automatic token refresh prevents logout on expiration

---

## 🔄 Complete Flow Diagram {#flow}

### **Login Flow:**
```
User enters email/password
    ↓
Frontend sends POST /api/auth/login/
    ↓
Backend verifies credentials
    ↓
Backend generates JWT tokens (access + refresh)
    ↓
Backend returns tokens + user data
    ↓
Frontend stores tokens in localStorage
    ↓
Frontend updates AuthContext state
    ↓
Frontend navigates to Dashboard
```

### **API Request Flow:**
```
Component calls apiRequest('/api/products/')
    ↓
apiRequest adds Authorization: Bearer <token>
    ↓
Request sent to backend
    ↓
Backend JWT middleware validates token
    ↓
Backend checks permissions (IsCEOOrManagerCanAdd)
    ↓
If authorized → Process request → Return data
If unauthorized → Return 403 Forbidden
    ↓
If 401 (token expired) → Frontend refreshes token
    ↓
Retry request with new token
```

### **Role-Based Access Flow:**
```
User tries to edit order
    ↓
Frontend: Check isCEO (show/hide edit button)
    ↓
User clicks Edit → Sends PUT /api/orders/1/
    ↓
Backend: Check IsCEOOrManagerCanAdd permission
    ↓
If Manager → 403 Forbidden (can only GET, POST)
If CEO → 200 OK (can do everything)
```

---

## 💡 Key Concepts Explained {#concepts}

### 1. **JWT (JSON Web Token)**
- **Stateless**: No server-side session storage
- **Self-contained**: Token contains user info (encrypted)
- **Structure**: `header.payload.signature`
- **Benefits**: Scalable, works across multiple servers

### 2. **Token Refresh Pattern**
- Access token expires quickly (1 day) for security
- Refresh token lasts longer (7 days)
- When access token expires, use refresh token to get new one
- Prevents frequent logins while maintaining security

### 3. **Role-Based Access Control (RBAC)**
- **CEO**: Full access (CRUD - Create, Read, Update, Delete)
- **Manager**: Limited access (CR - Create, Read only)
- Permissions checked on every request

### 4. **Context API Pattern**
- Centralized state management
- Avoids prop drilling
- Any component can access auth state via `useAuth()`

### 5. **Protected Routes**
- Client-side route protection
- Checks authentication before rendering
- Redirects to login if not authenticated

---

## ❓ Common Questions & Answers {#qa}

### **Q1: Why Custom User Model instead of Django's default?**
**A:** We need:
- Email-based login (not username)
- Role field (CEO/Manager)
- Custom fields (first_name, last_name)
- Django's default User model is too rigid

### **Q2: Why JWT instead of Session-based auth?**
**A:** 
- **Stateless**: No server-side session storage needed
- **Scalable**: Works across multiple servers
- **Mobile-friendly**: Easy to use in mobile apps
- **RESTful**: Perfect for API-based architecture

### **Q3: How does token refresh work?**
**A:**
1. Access token expires (1 day)
2. API returns 401 Unauthorized
3. Frontend automatically uses refresh token
4. Backend validates refresh token
5. Backend returns new access token
6. Frontend retries original request

### **Q4: What happens if refresh token expires?**
**A:** User must login again. Refresh token expires after 7 days.

### **Q5: How are permissions checked?**
**A:**
1. Request arrives at ViewSet
2. Django REST Framework checks `permission_classes`
3. Each permission class runs `has_permission()`
4. If all pass → Request processed
5. If any fail → Returns 403 Forbidden

### **Q6: Why both frontend and backend permission checks?**
**A:**
- **Frontend**: UX (hide/show buttons) - Can be bypassed
- **Backend**: Security (actual enforcement) - Cannot be bypassed
- **Rule**: Never trust frontend alone, always verify on backend

### **Q7: What is localStorage used for?**
**A:**
- Stores JWT tokens (access + refresh)
- Stores user data (name, role, etc.)
- Persists across page refreshes
- **Note**: Not secure for sensitive data (tokens are encrypted though)

### **Q8: How does the system prevent unauthorized access?**
**A:**
1. **Frontend**: ProtectedRoute checks authentication
2. **API**: apiRequest adds JWT token
3. **Backend**: JWT middleware validates token
4. **Backend**: Permission classes check role
5. **Result**: Multi-layer security

---

## 🎓 Summary for Demo

### **Key Points to Mention:**

1. **Custom User Model**: We extended Django's user system to support roles
2. **JWT Authentication**: Stateless, secure token-based authentication
3. **Role-Based Permissions**: CEO has full access, Manager has limited access
4. **Frontend Context**: Centralized auth state management
5. **Protected Routes**: Client-side route protection
6. **Automatic Token Refresh**: Seamless user experience
7. **Multi-layer Security**: Frontend UX + Backend enforcement

### **Demo Flow:**
1. Show login page → Explain JWT token generation
2. Login as Manager → Show limited access (no edit/delete)
3. Login as CEO → Show full access
4. Show API requests in Network tab → Explain Authorization header
5. Show permission errors → Explain backend enforcement

---

## 📝 Code Locations

- **Backend User Model**: `backend/factory/fact_app/models.py` (lines 30-64)
- **Backend Permissions**: `backend/factory/fact_app/permissions.py`
- **Backend Auth Views**: `backend/factory/fact_app/auth_views.py`
- **Backend Settings**: `backend/factory/factory/settings.py` (lines 141-164)
- **Frontend Auth Context**: `frontend/src/context/AuthContext.tsx`
- **Frontend Protected Route**: `frontend/src/components/ProtectedRoute.tsx`
- **Frontend API Utility**: `frontend/src/utils/api.ts`

---

**Good luck with your demo! 🚀**

