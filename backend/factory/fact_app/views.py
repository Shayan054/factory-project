from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
from .permissions import IsCEOOrReadOnly, IsCEOOrManagerCanAdd


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]


class RawMaterialViewSet(viewsets.ModelViewSet):
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, IsCEOOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    
    def perform_create(self, serializer):
        # Generate order number
        last_order = Order.objects.order_by('-order_id').first()
        order_no = f"ORD-{datetime.now().strftime('%Y%m%d')}-{((last_order.order_id if last_order else 0) + 1):04d}"
        serializer.save(order_no=order_no)


class OrderDetailsViewSet(viewsets.ModelViewSet):
    queryset = OrderDetails.objects.all()
    serializer_class = OrderDetailsSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]


class BillingViewSet(viewsets.ModelViewSet):
    queryset = Billing.objects.all()
    serializer_class = BillingSerializer
    permission_classes = [IsAuthenticated, IsCEOOrReadOnly]
    
    def perform_create(self, serializer):
        # Set payment_date if amount_received > 0
        amount_received = serializer.validated_data.get('amount_received', 0)
        if amount_received > 0:
            serializer.save(payment_date=datetime.now())

# Create your views here.
