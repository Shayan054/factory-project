"""
Temporarily rename admin migrations folder to avoid loading them.
Run this BEFORE makemigrations/migrate, then run restore_admin_migrations.py after.
"""

import os
import shutil

admin_migrations_path = os.path.join(
    os.path.dirname(__file__),
    'venv', 'Lib', 'site-packages', 'django', 'contrib', 'admin', 'migrations'
)

backup_path = admin_migrations_path + '_backup'

if os.path.exists(admin_migrations_path) and not os.path.exists(backup_path):
    shutil.move(admin_migrations_path, backup_path)
    print(f"✓ Renamed admin migrations folder to {backup_path}")
    print("You can now run: python manage.py makemigrations fact_app")
    print("Then run: python manage.py migrate fact_app")
    print("\nAfter Employee migration succeeds, run restore_admin_migrations.py")
else:
    print("Admin migrations already renamed or backup exists")

