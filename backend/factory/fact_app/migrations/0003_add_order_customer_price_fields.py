# Generated migration for adding customer FK to Order, price to Product, and improvements to OrderDetails

from django.db import migrations, models
import django.db.models.deletion


def assign_default_customer_to_orders(apps, schema_editor):
    """Assign a default customer to any existing orders that don't have one"""
    Order = apps.get_model('fact_app', 'Order')
    Customer = apps.get_model('fact_app', 'Customer')
    
    # Get the first customer, or create a default one if none exists
    default_customer = Customer.objects.first()
    if not default_customer:
        default_customer = Customer.objects.create(
            name="Default Customer",
            contact="N/A",
            address="N/A",
            remark="Auto-created for existing orders"
        )
    
    # Assign default customer to any orders without a customer
    Order.objects.filter(customer__isnull=True).update(customer=default_customer)


class Migration(migrations.Migration):

    dependencies = [
        ('fact_app', '0002_auto_20251218_1827'),
    ]

    operations = [
        # Add price field to Product
        migrations.AddField(
            model_name='product',
            name='price',
            field=models.IntegerField(default=0),
        ),
        # Add customer foreign key to Order (nullable first)
        migrations.AddField(
            model_name='order',
            name='customer',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='orders',
                to='fact_app.customer'
            ),
        ),
        # Data migration: assign default customer to existing orders
        migrations.RunPython(assign_default_customer_to_orders, migrations.RunPython.noop),
        # Now make customer required (non-nullable)
        migrations.AlterField(
            model_name='order',
            name='customer',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='orders',
                to='fact_app.customer'
            ),
        ),
        # Make order_date auto-set
        migrations.AlterField(
            model_name='order',
            name='order_date',
            field=models.DateTimeField(auto_now_add=True),
        ),
        # Add default to order_status
        migrations.AlterField(
            model_name='order',
            name='order_status',
            field=models.IntegerField(default=0),
        ),
        # Add default to total_amount
        migrations.AlterField(
            model_name='order',
            name='total_amount',
            field=models.IntegerField(default=0),
        ),
        # Add price field to OrderDetails
        migrations.AddField(
            model_name='orderdetails',
            name='price',
            field=models.IntegerField(default=0),
        ),
        # Add product foreign key to OrderDetails
        migrations.AddField(
            model_name='orderdetails',
            name='product',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='order_details',
                to='fact_app.product'
            ),
        ),
        # Make bill_date auto-set
        migrations.AlterField(
            model_name='billing',
            name='bill_date',
            field=models.DateTimeField(auto_now_add=True),
        ),
        # Make payment_date and balance_payment_date nullable
        migrations.AlterField(
            model_name='billing',
            name='payment_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='billing',
            name='balance_payment_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

