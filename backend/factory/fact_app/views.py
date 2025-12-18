from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime
from .models import (
    Vendor,
    RawMaterial,
    Customer,
    Product,
    Order,
    OrderDetails,
    Billing
)
from .serializers import (
    VendorSerializer,
    RawMaterialSerializer,
    CustomerSerializer,
    ProductSerializer,
    OrderSerializer,
    OrderDetailsSerializer,
    BillingSerializer
)


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer


class RawMaterialViewSet(viewsets.ModelViewSet):
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    def perform_create(self, serializer):
        # Generate order number
        last_order = Order.objects.order_by('-order_id').first()
        order_no = f"ORD-{datetime.now().strftime('%Y%m%d')}-{((last_order.order_id if last_order else 0) + 1):04d}"
        serializer.save(order_no=order_no)


class OrderDetailsViewSet(viewsets.ModelViewSet):
    queryset = OrderDetails.objects.all()
    serializer_class = OrderDetailsSerializer


class BillingViewSet(viewsets.ModelViewSet):
    queryset = Billing.objects.all()
    serializer_class = BillingSerializer
    
    def perform_create(self, serializer):
        # Set payment_date if amount_received > 0
        amount_received = serializer.validated_data.get('amount_received', 0)
        if amount_received > 0:
            serializer.save(payment_date=datetime.now())

# Create your views here.
