from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fact_app', '0008_auto_20260616_2356'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vendor',
            name='email',
            field=models.EmailField(blank=True, default='', max_length=150),
        ),
    ]
