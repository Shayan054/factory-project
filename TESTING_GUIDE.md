# Testing Guide for Authentication System

## API Base URL
```
http://localhost:8000/api/
```

## 1. Test Login (Get JWT Token)

**Endpoint:** `POST /api/auth/login/`

**Request Body:**
```json
{
  "email": "your_superuser_email@example.com",
  "password": "your_password"
}
```

**Expected Response:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "employee_id": 1,
    "email": "your_email@example.com",
    "first_name": "Your",
    "last_name": "Name",
    "role": "CEO",
    "date_joined": "2025-12-18T..."
  }
}
```

**Using cURL:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "your_email@example.com", "password": "your_password"}'
```

**Using Python requests:**
```python
import requests

response = requests.post('http://localhost:8000/api/auth/login/', json={
    'email': 'your_email@example.com',
    'password': 'your_password'
})
print(response.json())
```

---

## 2. Get Current User Info

**Endpoint:** `GET /api/auth/me/`

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Expected Response:**
```json
{
  "employee_id": 1,
  "email": "your_email@example.com",
  "first_name": "Your",
  "last_name": "Name",
  "role": "CEO",
  "date_joined": "2025-12-18T..."
}
```

**Using cURL:**
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 3. Register New Employee (CEO Only)

**Endpoint:** `POST /api/auth/register/`

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email": "manager@example.com",
  "first_name": "John",
  "last_name": "Manager",
  "role": "MANAGER",
  "password": "secure_password123",
  "password2": "secure_password123"
}
```

**Expected Response (if CEO):**
```json
{
  "message": "Employee registered successfully.",
  "employee": {
    "employee_id": 2,
    "email": "manager@example.com",
    "first_name": "John",
    "last_name": "Manager",
    "role": "MANAGER",
    "date_joined": "2025-12-18T..."
  }
}
```

**Expected Response (if not CEO - 403 Forbidden):**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**Using cURL:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "first_name": "John",
    "last_name": "Manager",
    "role": "MANAGER",
    "password": "secure_password123",
    "password2": "secure_password123"
  }'
```

---

## 4. List All Employees (CEO Only)

**Endpoint:** `GET /api/auth/employees/`

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Expected Response (if CEO):**
```json
[
  {
    "employee_id": 1,
    "email": "ceo@example.com",
    "first_name": "CEO",
    "last_name": "User",
    "role": "CEO",
    "date_joined": "2025-12-18T..."
  },
  {
    "employee_id": 2,
    "email": "manager@example.com",
    "first_name": "John",
    "last_name": "Manager",
    "role": "MANAGER",
    "date_joined": "2025-12-18T..."
  }
]
```

---

## 5. Test Role-Based Permissions

### Test Manager Permissions (Add/View Only)

**Login as Manager:**
```bash
# Get manager token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@example.com", "password": "secure_password123"}'
```

**Test Adding a Product (Should Work):**
```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Authorization: Bearer MANAGER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Test Product",
    "description": "Test Description",
    "price": 100
  }'
```

**Test Editing a Product (Should Fail - 403 Forbidden):**
```bash
curl -X PUT http://localhost:8000/api/products/1/ \
  -H "Authorization: Bearer MANAGER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Updated Product",
    "description": "Updated Description",
    "price": 200
  }'
```

**Test Deleting a Product (Should Fail - 403 Forbidden):**
```bash
curl -X DELETE http://localhost:8000/api/products/1/ \
  -H "Authorization: Bearer MANAGER_ACCESS_TOKEN"
```

### Test CEO Permissions (Full Control)

**Login as CEO and test editing (Should Work):**
```bash
curl -X PUT http://localhost:8000/api/products/1/ \
  -H "Authorization: Bearer CEO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Updated Product",
    "description": "Updated Description",
    "price": 200
  }'
```

---

## 6. Test Using Django Admin Panel

**URL:** `http://localhost:8000/admin/`

1. Open browser and go to `http://localhost:8000/admin/`
2. Login with your superuser credentials
3. You should see:
   - **Employees** - Manage all employees
   - **Vendors** - Manage vendors
   - **Raw Materials** - Manage raw materials
   - **Customers** - Manage customers
   - **Products** - Manage products
   - **Orders** - Manage orders
   - **Order Details** - Manage order details
   - **Billings** - Manage billings

---

## 7. Quick Test Script (Python)

Save this as `test_auth.py`:

```python
import requests

BASE_URL = "http://localhost:8000/api"

# 1. Login
print("1. Testing Login...")
login_response = requests.post(f"{BASE_URL}/auth/login/", json={
    "email": "your_email@example.com",
    "password": "your_password"
})
print(f"Status: {login_response.status_code}")
if login_response.status_code == 200:
    data = login_response.json()
    access_token = data['access']
    print(f"✓ Login successful! Role: {data['user']['role']}")
    print(f"Access Token: {access_token[:50]}...")
else:
    print(f"✗ Login failed: {login_response.json()}")
    exit(1)

# 2. Get Current User
print("\n2. Testing Get Current User...")
headers = {"Authorization": f"Bearer {access_token}"}
me_response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
print(f"Status: {me_response.status_code}")
if me_response.status_code == 200:
    print(f"✓ Current user: {me_response.json()}")
else:
    print(f"✗ Failed: {me_response.json()}")

# 3. List Employees (CEO only)
print("\n3. Testing List Employees...")
employees_response = requests.get(f"{BASE_URL}/auth/employees/", headers=headers)
print(f"Status: {employees_response.status_code}")
if employees_response.status_code == 200:
    employees = employees_response.json()
    print(f"✓ Found {len(employees)} employees")
    for emp in employees:
        print(f"  - {emp['email']} ({emp['role']})")
else:
    print(f"✗ Failed: {employees_response.json()}")

# 4. Test Register Employee (CEO only)
print("\n4. Testing Register Employee...")
register_response = requests.post(f"{BASE_URL}/auth/register/", headers=headers, json={
    "email": "test_manager@example.com",
    "first_name": "Test",
    "last_name": "Manager",
    "role": "MANAGER",
    "password": "testpass123",
    "password2": "testpass123"
})
print(f"Status: {register_response.status_code}")
if register_response.status_code == 201:
    print(f"✓ Employee registered: {register_response.json()}")
else:
    print(f"✗ Failed: {register_response.json()}")

# 5. Test Product Permissions
print("\n5. Testing Product Permissions...")
# Add product
product_response = requests.post(f"{BASE_URL}/products/", headers=headers, json={
    "product_name": "Test Product",
    "description": "Test Description",
    "price": 100
})
print(f"Add Product Status: {product_response.status_code}")
if product_response.status_code == 201:
    product_id = product_response.json()['product_id']
    print(f"✓ Product created with ID: {product_id}")
    
    # Try to update
    update_response = requests.put(f"{BASE_URL}/products/{product_id}/", headers=headers, json={
        "product_name": "Updated Product",
        "description": "Updated Description",
        "price": 200
    })
    print(f"Update Product Status: {update_response.status_code}")
    if update_response.status_code == 200:
        print(f"✓ Product updated successfully")
    else:
        print(f"✗ Update failed: {update_response.json()}")

print("\n✓ All tests completed!")
```

Run it:
```bash
python test_auth.py
```

---

## Summary of Endpoints

| Endpoint | Method | Auth Required | CEO Only | Description |
|----------|--------|---------------|----------|-------------|
| `/api/auth/login/` | POST | No | No | Login and get JWT tokens |
| `/api/auth/me/` | GET | Yes | No | Get current user info |
| `/api/auth/register/` | POST | Yes | Yes | Register new employee |
| `/api/auth/employees/` | GET | Yes | Yes | List all employees |
| `/api/auth/refresh/` | POST | No | No | Refresh access token |
| `/api/products/` | GET/POST | Yes | No | View/Add products (Manager can add) |
| `/api/products/{id}/` | PUT/DELETE | Yes | Yes | Edit/Delete products (CEO only) |
| `/api/vendors/` | GET/POST | Yes | No | View/Add vendors (Manager can add) |
| `/api/vendors/{id}/` | PUT/DELETE | Yes | Yes | Edit/Delete vendors (CEO only) |
| `/api/customers/` | GET | Yes | No | View customers |
| `/api/customers/` | POST/PUT/DELETE | Yes | Yes | Add/Edit/Delete customers (CEO only) |

---

## Troubleshooting

1. **401 Unauthorized**: Check if your access token is valid and not expired
2. **403 Forbidden**: You don't have permission (e.g., Manager trying to delete)
3. **400 Bad Request**: Check request body format and required fields
4. **500 Internal Server Error**: Check server logs for details

