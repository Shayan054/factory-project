"""
Quick test script for authentication system
Run: python test_auth.py
Make sure to update the email and password below
"""
import requests
import sys

BASE_URL = "http://localhost:8000/api"

# Update these with your superuser credentials
SUPERUSER_EMAIL = "shayanbaloch90@gmail.com"  # CHANGE THIS
SUPERUSER_PASSWORD = "123"  # CHANGE THIS

def test_login():
    """Test login endpoint"""
    print("=" * 50)
    print("1. Testing Login...")
    print("=" * 50)
    
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": SUPERUSER_EMAIL,
        "password": SUPERUSER_PASSWORD
    })
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        access_token = data['access']
        user = data['user']
        print(f"✓ Login successful!")
        print(f"  User: {user['first_name']} {user['last_name']}")
        print(f"  Email: {user['email']}")
        print(f"  Role: {user['role']}")
        print(f"  Access Token: {access_token[:50]}...")
        return access_token
    else:
        print(f"✗ Login failed!")
        print(f"  Error: {response.json()}")
        return None

def test_current_user(access_token):
    """Test get current user endpoint"""
    print("\n" + "=" * 50)
    print("2. Testing Get Current User...")
    print("=" * 50)
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        user = response.json()
        print(f"✓ Successfully retrieved user info!")
        print(f"  Employee ID: {user['employee_id']}")
        print(f"  Email: {user['email']}")
        print(f"  Name: {user['first_name']} {user['last_name']}")
        print(f"  Role: {user['role']}")
        return True
    else:
        print(f"✗ Failed to get user info!")
        print(f"  Error: {response.json()}")
        return False

def test_list_employees(access_token):
    """Test list employees endpoint (CEO only)"""
    print("\n" + "=" * 50)
    print("3. Testing List Employees (CEO Only)...")
    print("=" * 50)
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/employees/", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        employees = response.json()
        print(f"✓ Successfully retrieved employees list!")
        print(f"  Total Employees: {len(employees)}")
        for emp in employees:
            print(f"  - {emp['email']} ({emp['role']}) - {emp['first_name']} {emp['last_name']}")
        return True
    elif response.status_code == 403:
        print(f"✗ Access Denied - This endpoint is for CEO only!")
        print(f"  Error: {response.json()}")
        return False
    else:
        print(f"✗ Failed!")
        print(f"  Error: {response.json()}")
        return False

def test_register_employee(access_token):
    """Test register employee endpoint (CEO only)"""
    print("\n" + "=" * 50)
    print("4. Testing Register Employee (CEO Only)...")
    print("=" * 50)
    
    headers = {"Authorization": f"Bearer {access_token}"}
    test_data = {
        "email": "test_manager@example.com",
        "first_name": "Test",
        "last_name": "Manager",
        "role": "MANAGER",
        "password": "testpass123",
        "password2": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register/", headers=headers, json=test_data)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Employee registered successfully!")
        print(f"  New Employee: {data['employee']['email']} ({data['employee']['role']})")
        return True
    elif response.status_code == 403:
        print(f"✗ Access Denied - Only CEO can register employees!")
        print(f"  Error: {response.json()}")
        return False
    else:
        print(f"✗ Failed!")
        print(f"  Error: {response.json()}")
        return False

def test_product_permissions(access_token):
    """Test product CRUD permissions"""
    print("\n" + "=" * 50)
    print("5. Testing Product Permissions...")
    print("=" * 50)
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test adding a product
    print("\n  a) Testing Add Product...")
    product_data = {
        "product_name": "Test Product",
        "description": "Test Description",
        "price": 100
    }
    response = requests.post(f"{BASE_URL}/products/", headers=headers, json=product_data)
    print(f"     Status Code: {response.status_code}")
    
    if response.status_code == 201:
        product = response.json()
        product_id = product['product_id']
        print(f"     ✓ Product created! ID: {product_id}")
        
        # Test updating product
        print("\n  b) Testing Update Product...")
        update_data = {
            "product_name": "Updated Test Product",
            "description": "Updated Description",
            "price": 200
        }
        update_response = requests.put(f"{BASE_URL}/products/{product_id}/", headers=headers, json=update_data)
        print(f"     Status Code: {update_response.status_code}")
        
        if update_response.status_code == 200:
            print(f"     ✓ Product updated successfully!")
        elif update_response.status_code == 403:
            print(f"     ✗ Access Denied - Only CEO can edit products!")
        else:
            print(f"     ✗ Failed: {update_response.json()}")
        
        # Test deleting product
        print("\n  c) Testing Delete Product...")
        delete_response = requests.delete(f"{BASE_URL}/products/{product_id}/", headers=headers)
        print(f"     Status Code: {delete_response.status_code}")
        
        if delete_response.status_code == 204:
            print(f"     ✓ Product deleted successfully!")
        elif delete_response.status_code == 403:
            print(f"     ✗ Access Denied - Only CEO can delete products!")
        else:
            print(f"     ✗ Failed: {delete_response.json()}")
    else:
        print(f"     ✗ Failed to create product: {response.json()}")

def main():
    print("\n" + "=" * 50)
    print("AUTHENTICATION SYSTEM TEST")
    print("=" * 50)
    print(f"\nTesting with email: {SUPERUSER_EMAIL}")
    print("Make sure the Django server is running on http://localhost:8000")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\nTest cancelled.")
        sys.exit(0)
    
    # Run tests
    access_token = test_login()
    
    if not access_token:
        print("\n✗ Cannot continue without access token. Please check your credentials.")
        sys.exit(1)
    
    test_current_user(access_token)
    test_list_employees(access_token)
    test_register_employee(access_token)
    test_product_permissions(access_token)
    
    print("\n" + "=" * 50)
    print("TEST COMPLETED!")
    print("=" * 50)
    print("\nCheck the results above to verify:")
    print("  ✓ Login works")
    print("  ✓ Current user endpoint works")
    print("  ✓ CEO can list employees")
    print("  ✓ CEO can register new employees")
    print("  ✓ Role-based permissions work correctly")
    print("\nFor detailed testing guide, see TESTING_GUIDE.md")

if __name__ == "__main__":
    main()

