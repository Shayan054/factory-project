from rest_framework import serializers
from .models import (
    Vendor,
    RawMaterial,
    Customer,
    Product,
    ProductRawMaterial,
    Order,
    OrderDetails,
    Billing,
    Expense,
    ExpenseCategory
)


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'


class RawMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterial
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class ProductRawMaterialSerializer(serializers.ModelSerializer):
    raw_material_name = serializers.CharField(source='raw_material.material', read_only=True)
    raw_material_unit = serializers.CharField(source='raw_material.measuring_unit', read_only=True)
    
    class Meta:
        model = ProductRawMaterial
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    raw_materials_used = ProductRawMaterialSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'


class OrderDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDetails
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    order_details = OrderDetailsSerializer(many=True, read_only=True)
    order_no = serializers.CharField(required=False, read_only=True)
    order_date = serializers.DateTimeField(required=False, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


class BillingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Billing
        fields = '__all__'


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(write_only=True, required=True)
    category_name_display = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'
        extra_kwargs = {
            'category': {'required': False, 'read_only': True}
        }