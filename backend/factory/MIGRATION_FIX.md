# Migration Fix Procedure

## The Problem
Django's admin app has migrations that reference AUTH_USER_MODEL. When AUTH_USER_MODEL is set to 'fact_app.Employee' before the Employee model exists, it causes errors.

## Solution Steps

### Step 1: Ensure Settings are Correct
- AUTH_USER_MODEL should be COMMENTED OUT
- django.contrib.admin should be COMMENTED OUT in INSTALLED_APPS

### Step 2: Clean Database (if admin_log table exists)
If you have admin_log table in your database, you need to remove it:

```sql
-- Connect to your MariaDB database
USE factory_db;

-- Drop the admin_log table if it exists
DROP TABLE IF EXISTS django_admin_log;

-- Remove admin migration records
DELETE FROM django_migrations WHERE app = 'admin';
```

### Step 3: Create Employee Migration
```bash
python manage.py makemigrations fact_app
```

### Step 4: Migrate Only fact_app
```bash
python manage.py migrate fact_app
```

### Step 5: Uncomment Settings
- Uncomment 'django.contrib.admin' in INSTALLED_APPS
- Uncomment AUTH_USER_MODEL = 'fact_app.Employee'

### Step 6: Create Admin Migration
```bash
python manage.py makemigrations admin
```

### Step 7: Run Full Migration
```bash
python manage.py migrate
```

