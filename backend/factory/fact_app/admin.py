from django.contrib import admin
from .models import (
    Vendor,
    RawMaterial,
    Customer,
    Product,
    Order,
    OrderDetails,
    Billing,
)

admin.site.register(Vendor)
admin.site.register(RawMaterial)
admin.site.register(Customer)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(OrderDetails)
admin.site.register(Billing)