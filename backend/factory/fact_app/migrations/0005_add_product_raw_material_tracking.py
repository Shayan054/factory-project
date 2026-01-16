# Generated migration for adding raw material tracking to products

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('fact_app', '0004_employee'),
    ]

    operations = [
        # Add price field to RawMaterial
        migrations.AddField(
            model_name='rawmaterial',
            name='price',
            field=models.IntegerField(default=0),
        ),
        # Add quantity field to Product (for inventory tracking)
        migrations.AddField(
            model_name='product',
            name='quantity',
            field=models.IntegerField(default=0),
        ),
        # Create ProductRawMaterial model (Bill of Materials)
        migrations.CreateModel(
            name='ProductRawMaterial',
            fields=[
                ('product_raw_material_id', models.AutoField(primary_key=True, serialize=False)),
                ('quantity_required', models.IntegerField()),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='raw_materials_used', to='fact_app.product')),
                ('raw_material', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='products_using', to='fact_app.rawmaterial')),
            ],
            options={
                'unique_together': {('product', 'raw_material')},
            },
        ),
    ]

