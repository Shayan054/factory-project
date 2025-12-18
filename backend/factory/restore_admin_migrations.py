"""
Restore admin migrations folder after Employee migration.
Run this AFTER Employee migration succeeds.
"""

import os
import shutil

admin_migrations_path = os.path.join(
    os.path.dirname(__file__),
    'venv', 'Lib', 'site-packages', 'django', 'contrib', 'admin', 'migrations'
)

backup_path = admin_migrations_path + '_backup'

if os.path.exists(backup_path):
    if os.path.exists(admin_migrations_path):
        shutil.rmtree(admin_migrations_path)
    shutil.move(backup_path, admin_migrations_path)
    print("✓ Restored admin migrations folder")
    print("Now uncomment admin and AUTH_USER_MODEL in settings.py")
    print("Then run: python manage.py makemigrations")
    print("Then run: python manage.py migrate")
else:
    print("No backup found - admin migrations were not renamed")

