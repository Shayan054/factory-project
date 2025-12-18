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
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]


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
    
    def perform_update(self, serializer):
        instance = serializer.instance
        old_status = instance.order_status
        new_status = serializer.validated_data.get('order_status', instance.order_status)
        
        # Save the order first
        serializer.save()
        
        # If status changed from pending to completed, update/create billing
        if old_status == 0 and new_status == 1:
            # Check if billing exists for this order
            from .models import Billing
            billing = Billing.objects.filter(order=instance).first()
            
            if billing:
                # Update existing billing - mark as fully paid if not already
                if billing.balance > 0:
                    billing.amount_received = billing.total_bill
                    billing.balance = 0
                    billing.payment_date = datetime.now()
                    billing.save()
            else:
                # Create new billing record if order is completed but no billing exists
                # This handles the case where order was marked complete without going through billing
                Billing.objects.create(
                    order=instance,
                    customer=instance.customer,
                    total_bill=instance.total_amount,
                    amount_received=instance.total_amount,  # Assume fully paid if marked complete
                    balance=0,
                    payment_date=datetime.now()
                )


class OrderDetailsViewSet(viewsets.ModelViewSet):
    queryset = OrderDetails.objects.all()
    serializer_class = OrderDetailsSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]


class BillingViewSet(viewsets.ModelViewSet):
    queryset = Billing.objects.all()
    serializer_class = BillingSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    
    def perform_create(self, serializer):
        # Set payment_date if amount_received > 0
        amount_received = serializer.validated_data.get('amount_received', 0)
        if amount_received > 0:
            serializer.save(payment_date=datetime.now())
    
    def perform_update(self, serializer):
        instance = serializer.instance
        old_amount_received = instance.amount_received
        new_amount_received = serializer.validated_data.get('amount_received', instance.amount_received)
        
        # Update payment_date if amount_received increased or was 0 and now > 0
        if new_amount_received > 0 and (old_amount_received == 0 or new_amount_received > old_amount_received):
            serializer.save(payment_date=datetime.now())
        else:
            serializer.save()
        
        # Update balance_payment_date if balance becomes 0
        total_bill = serializer.validated_data.get('total_bill', instance.total_bill)
        balance = total_bill - new_amount_received
        if balance == 0 and instance.balance > 0:
            serializer.save(balance_payment_date=datetime.now())

# Create your views here.
