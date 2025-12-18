"""
Script to fix migration state before creating Employee model.
Run this BEFORE running makemigrations/migrate for Employee.

Usage: python fix_migrations.py
"""

import os
import sys
import django

# Setup Django - IMPORTANT: Make sure admin is commented out in settings
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'factory.settings')

# Check if admin is commented out
with open('factory/settings.py', 'r') as f:
    settings_content = f.read()
    if "AUTH_USER_MODEL = 'fact_app.Employee'" in settings_content and not "# AUTH_USER_MODEL" in settings_content:
        print("ERROR: AUTH_USER_MODEL is still uncommented!")
        print("Please comment it out in settings.py first.")
        sys.exit(1)
    if "'django.contrib.admin'" in settings_content and "# 'django.contrib.admin'" not in settings_content:
        print("ERROR: django.contrib.admin is still in INSTALLED_APPS!")
        print("Please comment it out in settings.py first.")
        sys.exit(1)

django.setup()

from django.db import connection

def fix_migrations():
    """Remove admin_log table and admin migration records"""
    print("Cleaning database migration state...")
    
    with connection.cursor() as cursor:
        try:
            # Drop admin_log table if it exists
            cursor.execute("DROP TABLE IF EXISTS django_admin_log;")
            print("✓ Dropped django_admin_log table (if it existed)")
        except Exception as e:
            print(f"Note: Could not drop django_admin_log: {e}")
        
        try:
            # Remove admin migration records
            cursor.execute("DELETE FROM django_migrations WHERE app = 'admin';")
            count = cursor.rowcount
            print(f"✓ Removed {count} admin migration record(s)")
        except Exception as e:
            print(f"Note: Could not remove admin migrations: {e}")
        
        print("\n✓ Database cleaned successfully!")
        print("\nNext steps:")
        print("1. python manage.py makemigrations fact_app")
        print("2. python manage.py migrate fact_app")
        print("3. Uncomment 'django.contrib.admin' in INSTALLED_APPS")
        print("4. Uncomment AUTH_USER_MODEL = 'fact_app.Employee'")
        print("5. python manage.py makemigrations")
        print("6. python manage.py migrate")

if __name__ == '__main__':
    fix_migrations()

