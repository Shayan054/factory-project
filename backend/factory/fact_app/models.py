from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


# Employee/User Model
class EmployeeManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'CEO')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class Employee(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('CEO', 'CEO'),
        ('MANAGER', 'Manager'),
    ]
    
    employee_id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MANAGER')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    
    objects = EmployeeManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'employees'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def is_ceo(self):
        return self.role == 'CEO'
    
    def is_manager(self):
        return self.role == 'MANAGER'


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