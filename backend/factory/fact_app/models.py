from django.db import models

class Vendor(models.Model):
    vendor_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)

    contact_person = models.CharField(
        max_length=100,
        default=""
    )
    email = models.EmailField(
        max_length=150,
        default=""
    )
    phone = models.CharField(
        max_length=20,
        default=""
    )

    def __str__(self):
        return self.name

class RawMaterial(models.Model):
    material_id = models.AutoField(primary_key=True)
    material = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    measuring_unit = models.CharField(max_length=50)
    quantity = models.IntegerField()

    # Foreign Key
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="raw_materials"
    )

    def __str__(self):
        return self.material

class Customer(models.Model):
    customer_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    contact = models.CharField(max_length=50)
    address = models.TextField()
    remark = models.TextField(blank=True)

    def __str__(self):
        return self.name
    
class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    product_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.IntegerField(default=0)

    def __str__(self):
        return self.product_name

class Order(models.Model):
    order_id = models.AutoField(primary_key=True)
    order_no = models.CharField(max_length=50)
    order_date = models.DateTimeField(auto_now_add=True)
    order_status = models.IntegerField(default=0)  # enum value: 0=Pending, 1=Completed
    total_amount = models.IntegerField(default=0)
    
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    def __str__(self):
        return self.order_no
    
class OrderDetails(models.Model):
    order_detail_id = models.AutoField(primary_key=True)
    order_item = models.CharField(max_length=100)
    quantity = models.IntegerField()
    price = models.IntegerField(default=0)  # Price per unit at time of order
    sub_total = models.IntegerField()

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="order_details"
    )
    
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_details"
    )

    def __str__(self):
        return f"{self.order_item} ({self.quantity})"

class Billing(models.Model):
    billing_id = models.AutoField(primary_key=True)
    total_bill = models.IntegerField()
    amount_received = models.IntegerField()
    balance = models.IntegerField()
    bill_date = models.DateTimeField(auto_now_add=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    balance_payment_date = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True)

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="billings"
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="billings"
    )

    def __str__(self):
        return f"Bill #{self.billing_id}"