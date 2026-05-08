from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from datetime import datetime, date
from django.db import transaction
from django.utils import timezone
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
from .serializers import (
    VendorSerializer,
    RawMaterialSerializer,
    CustomerSerializer,
    ProductSerializer,
    ProductRawMaterialSerializer,
    OrderSerializer,
    OrderDetailsSerializer,
    BillingSerializer,
    ExpenseSerializer,
    ExpenseCategorySerializer
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
    
    def perform_create(self, serializer):
        with transaction.atomic():
            material_name = serializer.validated_data.get('material')
            vendor = serializer.validated_data.get('vendor')
            quantity_to_add = serializer.validated_data.get('quantity', 0)
            price = serializer.validated_data.get('price', 0)
            
            # Check if raw material with same name and vendor already exists
            existing_raw_material = RawMaterial.objects.filter(
                material=material_name,
                vendor=vendor
            ).first()
            
            if existing_raw_material:
                # Add to existing quantity
                existing_raw_material.quantity += quantity_to_add
                # Update price if provided (use new price or keep existing)
                if price > 0:
                    existing_raw_material.price = price
                existing_raw_material.save()
                raw_material = existing_raw_material
            else:
                # Create new raw material
                raw_material = serializer.save()
            
            # Auto-create expense entry for the quantity added
            # Use the material name as the category (e.g., "Cement", "Sand")
            expense_category, created = ExpenseCategory.objects.get_or_create(
                name=raw_material.material
            )
            
            # Calculate total cost for the quantity added (not total inventory)
            total_cost = price * quantity_to_add
            
            # Create expense entry
            Expense.objects.create(
                category=expense_category,
                date=date.today(),
                amount=total_cost,
                quantity=quantity_to_add,
                remarks=f"Purchase of {quantity_to_add} {raw_material.measuring_unit} {raw_material.material} from {raw_material.vendor.name}"
            )


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    
    def perform_create(self, serializer):
        now = timezone.now()
        user_id = getattr(self.request.user, "employee_id", None)
        serializer.save(
            created_at=now,
            created_by=user_id,
            updated_at=now,
            updated_by=user_id,
            is_deleted=None,
        )
    
    def perform_update(self, serializer):
        now = timezone.now()
        user_id = getattr(self.request.user, "employee_id", None)
        serializer.save(updated_at=now, updated_by=user_id)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    
    def perform_create(self, serializer):
        # Just save the product - deduction will happen after BOM entries are created
        serializer.save()
    
    def _deduct_raw_materials_for_product(self, product, quantity_manufactured):
        """Helper method to deduct raw materials for a product"""
        if quantity_manufactured <= 0:
            return
        
        raw_materials_used = ProductRawMaterial.objects.filter(product=product)
        
        if not raw_materials_used.exists():
            # No BOM entries yet, can't deduct
            return
        
        for bom_entry in raw_materials_used:
            raw_material = bom_entry.raw_material
            # quantity_required is the TOTAL quantity to deduct (not per unit)
            quantity_needed = bom_entry.quantity_required
            
            # Check if enough raw material is available
            if raw_material.quantity < quantity_needed:
                raise ValueError(
                    f"Insufficient {raw_material.material}. "
                    f"Required: {quantity_needed} {raw_material.measuring_unit}, "
                    f"Available: {raw_material.quantity} {raw_material.measuring_unit}"
                )
            
            # Deduct raw material
            raw_material.quantity -= quantity_needed
            raw_material.save()
    
    def perform_update(self, serializer):
        with transaction.atomic():
            instance = serializer.instance
            old_quantity = instance.quantity
            new_quantity = serializer.validated_data.get('quantity', instance.quantity)
            
            # Calculate quantity difference (newly manufactured)
            quantity_manufactured = new_quantity - old_quantity
            
            # Save the product first
            product = serializer.save()
            
            # If quantity increased, deduct raw materials
            if quantity_manufactured > 0:
                self._deduct_raw_materials_for_product(product, quantity_manufactured)


class ProductRawMaterialViewSet(viewsets.ModelViewSet):
    queryset = ProductRawMaterial.objects.all()
    serializer_class = ProductRawMaterialSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    
    def perform_create(self, serializer):
        # Just save the BOM entry - deduction will be triggered by frontend
        serializer.save()


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    
    def perform_create(self, serializer):
        with transaction.atomic():
            # Generate order number
            last_order = Order.objects.order_by('-order_id').first()
            order_no = f"ORD-{datetime.now().strftime('%Y%m%d')}-{((last_order.order_id if last_order else 0) + 1):04d}"
            now = timezone.now()
            user_id = getattr(self.request.user, "employee_id", None)
            total_amount = serializer.validated_data.get("total_amount", 0) or 0
            discount = serializer.validated_data.get("discount", 0) or 0
            serializer.save(
                order_no=order_no,
                total_bill_after_discount=max(total_amount - discount, 0),
                created_at=now,
                created_by=user_id,
                updated_at=now,
                updated_by=user_id,
                is_deleted=None,
            )
    
    def perform_update(self, serializer):
        instance = serializer.instance
        old_status = instance.order_status
        new_status = serializer.validated_data.get('order_status', instance.order_status)
        
        # Save the order first
        now = timezone.now()
        user_id = getattr(self.request.user, "employee_id", None)
        total_amount = serializer.validated_data.get("total_amount", instance.total_amount) or 0
        discount = serializer.validated_data.get("discount", instance.discount) or 0
        serializer.save(
            total_bill_after_discount=max(total_amount - discount, 0),
            updated_at=now,
            updated_by=user_id,
        )
        
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
                    billing.payment_date = timezone.now()
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
                    payment_date=timezone.now()
                )


class OrderDetailsViewSet(viewsets.ModelViewSet):
    queryset = OrderDetails.objects.all()
    serializer_class = OrderDetailsSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    
    def perform_create(self, serializer):
        with transaction.atomic():
            # Validate inventory BEFORE saving, so we return JSON 400 instead of HTML 500
            product = serializer.validated_data.get("product")
            quantity_ordered = serializer.validated_data.get("quantity", 0) or 0
            if product and product.quantity < quantity_ordered:
                raise ValidationError({
                    "detail": (
                        f"Insufficient {product.product_name} inventory. "
                        f"Required: {quantity_ordered}, Available: {product.quantity}"
                    )
                })

            now = timezone.now()
            user_id = getattr(self.request.user, "employee_id", None)
            order_detail = serializer.save(
                created_at=now,
                created_by=user_id,
                updated_at=now,
                updated_by=user_id,
                is_deleted=None,
            )
            
            # Deduct product inventory when order is placed
            if order_detail.product:
                product = order_detail.product
                quantity_ordered = order_detail.quantity
                
                # Check if enough product is available
                if product.quantity < quantity_ordered:
                    raise ValidationError({
                        "detail": (
                            f"Insufficient {product.product_name} inventory. "
                            f"Required: {quantity_ordered}, Available: {product.quantity}"
                        )
                    })
                
                # Deduct product quantity
                product.quantity -= quantity_ordered
                product.save()


class BillingViewSet(viewsets.ModelViewSet):
    queryset = Billing.objects.all()
    serializer_class = BillingSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    
    def perform_create(self, serializer):
        # Set payment_date if amount_received > 0
        amount_received = serializer.validated_data.get('amount_received', 0)
        now = timezone.now()
        user_id = getattr(self.request.user, "employee_id", None)
        if amount_received > 0:
            serializer.save(
                payment_date=now,
                created_at=now,
                created_by=user_id,
                updated_at=now,
                updated_by=user_id,
                is_deleted=None,
            )
        else:
            serializer.save(
                created_at=now,
                created_by=user_id,
                updated_at=now,
                updated_by=user_id,
                is_deleted=None,
            )
    
    def perform_update(self, serializer):
        instance = serializer.instance
        old_amount_received = instance.amount_received
        new_amount_received = serializer.validated_data.get('amount_received', instance.amount_received)
        now = timezone.now()
        user_id = getattr(self.request.user, "employee_id", None)
        
        # Update payment_date if amount_received increased or was 0 and now > 0
        if new_amount_received > 0 and (old_amount_received == 0 or new_amount_received > old_amount_received):
            serializer.save(payment_date=now, updated_at=now, updated_by=user_id)
        else:
            serializer.save(updated_at=now, updated_by=user_id)
        
        # Update balance_payment_date if balance becomes 0
        total_bill = serializer.validated_data.get('total_bill', instance.total_bill)
        balance = total_bill - new_amount_received
        if balance == 0 and instance.balance > 0:
            serializer.save(balance_payment_date=now, updated_at=now, updated_by=user_id)


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    
    def perform_create(self, serializer):
        # Get category name from serializer validated data
        category_name = serializer.validated_data.pop('category_name', None)
        
        if not category_name:
            raise ValueError("Category name is required")
        
        # Get or create the expense category
        expense_category, created = ExpenseCategory.objects.get_or_create(
            name=category_name.strip()
        )
        
        # Save expense with the category
        serializer.save(category=expense_category)

# Create your views here.
