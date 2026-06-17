# Replaced by 0000_employee so AUTH_USER_MODEL is resolvable early.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('fact_app', '0003_add_order_customer_price_fields'),
        ('fact_app', '0000_employee'),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
