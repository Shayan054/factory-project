# 🎤 Demo Cheat Sheet - Quick Reference

## 🚀 Quick Answers for Common Questions

### **Q: What is Authentication?**
**A:** Verifying WHO the user is (login with email/password → get JWT tokens)

### **Q: What is Authorization?**
**A:** Controlling WHAT the user can do (CEO = full access, Manager = limited access)

### **Q: How does JWT work?**
**A:** 
- User logs in → Backend generates encrypted token
- Token contains user info (ID, role)
- Every API request includes token in header: `Authorization: Bearer <token>`
- Backend validates token → Processes request

### **Q: Why Custom User Model?**
**A:** 
- Need email-based login (not username)
- Need role field (CEO/Manager)
- Django's default User model doesn't support this

### **Q: How are permissions enforced?**
**A:** 
- **Backend**: Permission classes check role before processing request
- **Frontend**: Hides/shows buttons based on role (UX only)
- **Security**: Backend is the real enforcement (frontend can be bypassed)

### **Q: What happens when token expires?**
**A:** 
- Access token expires (1 day) → API returns 401
- Frontend automatically uses refresh token
- Gets new access token → Retries request
- User doesn't notice (seamless)

---

## 📋 Demo Script

### **1. Show Login (2 min)**
```
"Let me show you the authentication system. When a user logs in..."
- Open login page
- Enter credentials
- Show Network tab → POST /api/auth/login/
- Explain: "Backend validates credentials and returns JWT tokens"
- Show tokens in localStorage
```

### **2. Show Role-Based Access (3 min)**
```
"Now let's see how authorization works based on roles..."
- Login as Manager
- Go to Management page
- Show: "Manager can only view, no Edit/Delete buttons"
- Explain: "Frontend checks role and hides buttons"
- Try to edit (if possible) → Show 403 error
- Explain: "Backend also enforces permissions"
```

### **3. Show CEO Access (2 min)**
```
"Now let's see CEO access..."
- Login as CEO
- Go to Management page
- Show: "CEO sees Edit/Delete buttons"
- Explain: "CEO has full CRUD access"
```

### **4. Show API Authentication (2 min)**
```
"Let me show how API requests work..."
- Open Network tab
- Make any API request (e.g., GET /api/products/)
- Show Request Headers: `Authorization: Bearer <token>`
- Explain: "Every request includes JWT token"
- Explain: "Backend validates token before processing"
```

### **5. Show Token Refresh (1 min)**
```
"If token expires..."
- Explain: "Access token expires after 1 day"
- "Frontend automatically uses refresh token"
- "Gets new access token seamlessly"
- "User doesn't need to login again"
```

---

## 🔑 Key Technical Terms

| Term | Meaning |
|------|---------|
| **JWT** | JSON Web Token - Encrypted token containing user info |
| **Access Token** | Short-lived token (1 day) for API requests |
| **Refresh Token** | Long-lived token (7 days) to get new access tokens |
| **RBAC** | Role-Based Access Control - Permissions based on user role |
| **AbstractBaseUser** | Django base class for custom user models |
| **PermissionsMixin** | Adds Django permission system to user model |
| **Context API** | React pattern for centralized state management |
| **Protected Route** | Route that requires authentication |
| **Bearer Token** | Token format: `Authorization: Bearer <token>` |

---

## 🎯 Key Points to Emphasize

1. ✅ **Security**: Backend always enforces permissions (frontend is just UX)
2. ✅ **Stateless**: JWT tokens = no server-side sessions needed
3. ✅ **Scalable**: Works across multiple servers
4. ✅ **User Experience**: Automatic token refresh = no frequent logins
5. ✅ **Role-Based**: Different access levels (CEO vs Manager)

---

## ⚠️ Common Pitfalls to Avoid

❌ **Don't say**: "Frontend permissions are secure"
✅ **Say**: "Frontend provides UX, but backend enforces security"

❌ **Don't say**: "Tokens are stored securely in localStorage"
✅ **Say**: "Tokens are stored in localStorage (encrypted by JWT itself)"

❌ **Don't say**: "JWT is more secure than sessions"
✅ **Say**: "JWT is stateless and scalable, both are secure when implemented correctly"

---

## 📝 Quick Code References

### **Backend Permission Check:**
```python
# In permissions.py
def has_permission(self, request, view):
    if request.user.is_ceo():
        return True  # CEO can do everything
    if request.user.is_manager():
        return request.method in ['GET', 'POST']  # Manager: view & add only
    return False
```

### **Frontend Role Check:**
```typescript
// In component
const { isCEO } = useAuth();

{isCEO && (
    <button>Edit</button>  // Only CEO sees this
)}
```

### **API Request with Token:**
```typescript
// Automatically adds token
const response = await apiRequest('/api/products/');
// Headers: Authorization: Bearer <token>
```

---

## 🎓 If Asked "How would you improve this?"

**Good answers:**
1. "Add role-based UI components library"
2. "Implement token blacklisting for logout"
3. "Add 2FA (Two-Factor Authentication)"
4. "Add audit logging for security"
5. "Implement rate limiting on API endpoints"

---

**Remember: Be confident, explain concepts clearly, and show the code! 🚀**

