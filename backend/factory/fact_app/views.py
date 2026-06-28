from rest_framework import viewsets
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
    ProductListSerializer,
    ProductDetailSerializer,
    ProductRawMaterialSerializer,
    OrderListSerializer,
    OrderDetailSerializer,
    OrderDetailsSerializer,
    BillingSerializer,
    ExpenseSerializer,
    ExpenseCategorySerializer
)
from .permissions import IsCEOOrManagerCanAdd, CEOUpdateDestroyMixin
from .pagination import StandardPagination
from .querysets import (
    active_customers,
    billings_queryset,
    expenses_queryset,
    order_details_queryset,
    orders_detail_queryset,
    orders_queryset,
    products_detail_queryset,
    products_list_queryset,
    raw_materials_queryset,
)


class VendorViewSet(CEOUpdateDestroyMixin, viewsets.ModelViewSet):
    queryset = Vendor.objects.all().order_by("name")
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    pagination_class = StandardPagination


class RawMaterialViewSet(CEOUpdateDestroyMixin, viewsets.ModelViewSet):
    serializer_class = RawMaterialSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    pagination_class = StandardPagination

    def get_queryset(self):
        return raw_materials_queryset()
    
    def perform_create(self, serializer):
        with transaction.atomic():
            material_name = serializer.validated_data.get('material')
            vendor = serializer.validated_data.get('vendor')
            quantity_to_add = serializer.validated_data.get('quantity', 0)
            price = serializer.validated_data.get('price', 0)
            
            existing_raw_material = RawMaterial.objects.filter(
                material=material_name,
                vendor=vendor
            ).first()
            
            if existing_raw_material:
                existing_raw_material.quantity += quantity_to_add
                if price > 0:
                    existing_raw_material.price = price
                existing_raw_material.save()
                raw_material = existing_raw_material
            else:
                raw_material = serializer.save()
            
            expense_category, created = ExpenseCategory.objects.get_or_create(
                name=raw_material.material
            )
            
            total_cost = price * quantity_to_add
            
            Expense.objects.create(
                category=expense_category,
                date=date.today(),
                amount=total_cost,
                quantity=quantity_to_add,
                remarks=f"Purchase of {quantity_to_add} {raw_material.measuring_unit} {raw_material.material} from {raw_material.vendor.name}"
            )


class CustomerViewSet(CEOUpdateDestroyMixin, viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    pagination_class = StandardPagination

    def get_queryset(self):
        return active_customers().order_by("name")
    
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


class ProductViewSet(CEOUpdateDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    pagination_class = StandardPagination

    def get_queryset(self):
        if self.action == "retrieve":
            return products_detail_queryset()
        return products_list_queryset()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    def _deduct_raw_materials_for_product(self, product, quantity_manufactured):
        if quantity_manufactured <= 0:
            return
        
        raw_materials_used = ProductRawMaterial.objects.filter(
            product=product
        ).select_related("raw_material")
        
        if not raw_materials_used.exists():
            return
        
        for bom_entry in raw_materials_used:
            raw_material = bom_entry.raw_material
            quantity_needed = bom_entry.quantity_required
            
            if raw_material.quantity < quantity_needed:
                raise ValidationError({
                    "detail": (
                        f"Insufficient {raw_material.material}. "
                        f"Required: {quantity_needed} {raw_material.measuring_unit}, "
                        f"Available: {raw_material.quantity} {raw_material.measuring_unit}"
                    )
                })
            
            raw_material.quantity -= quantity_needed
            raw_material.save()
    
    def perform_update(self, serializer):
        with transaction.atomic():
            instance = serializer.instance
            old_quantity = instance.quantity
            new_quantity = serializer.validated_data.get('quantity', instance.quantity)
            
            quantity_manufactured = new_quantity - old_quantity
            
            product = serializer.save()
            
            if quantity_manufactured > 0:
                self._deduct_raw_materials_for_product(product, quantity_manufactured)


class ProductRawMaterialViewSet(viewsets.ModelViewSet):
    queryset = ProductRawMaterial.objects.select_related(
        "product", "raw_material"
    ).all()
    serializer_class = ProductRawMaterialSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    pagination_class = StandardPagination
    
    def perform_create(self, serializer):
        serializer.save()


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    pagination_class = StandardPagination

    def get_queryset(self):
        params = self.request.query_params
        include_details = params.get("include_details") in ("1", "true", "True")
        if self.action == "retrieve" or (self.action == "list" and include_details):
            return orders_detail_queryset(params)
        return orders_queryset(params)

    def get_serializer_class(self):
        include_details = self.request.query_params.get("include_details") in (
            "1",
            "true",
            "True",
        )
        if self.action == "retrieve" or (self.action == "list" and include_details):
            return OrderDetailSerializer
        return OrderListSerializer
    
    def perform_create(self, serializer):
        with transaction.atomic():
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
        
        now = timezone.now()
        user_id = getattr(self.request.user, "employee_id", None)
        total_amount = serializer.validated_data.get("total_amount", instance.total_amount) or 0
        discount = serializer.validated_data.get("discount", instance.discount) or 0
        serializer.save(
            total_bill_after_discount=max(total_amount - discount, 0),
            updated_at=now,
            updated_by=user_id,
        )
        
        if old_status == 0 and new_status == 1:
            billing = Billing.objects.filter(order=instance).first()
            bill_total = instance.total_bill_after_discount or max(
                total_amount - discount, 0
            )
            
            if billing:
                if billing.balance > 0:
                    billing.amount_received = billing.total_bill
                    billing.balance = 0
                    billing.payment_date = timezone.now()
                    billing.save()
            else:
                Billing.objects.create(
                    order=instance,
                    customer=instance.customer,
                    total_bill=bill_total,
                    amount_received=bill_total,
                    balance=0,
                    payment_date=timezone.now()
                )


class OrderDetailsViewSet(viewsets.ModelViewSet):
    serializer_class = OrderDetailsSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    pagination_class = StandardPagination

    def get_queryset(self):
        return order_details_queryset(self.request.query_params)
    
    def perform_create(self, serializer):
        with transaction.atomic():
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
            
            if order_detail.product:
                product = order_detail.product
                quantity_ordered = order_detail.quantity
                
                if product.quantity < quantity_ordered:
                    raise ValidationError({
                        "detail": (
                            f"Insufficient {product.product_name} inventory. "
                            f"Required: {quantity_ordered}, Available: {product.quantity}"
                        )
                    })
                
                product.quantity -= quantity_ordered
                product.save()


class BillingViewSet(viewsets.ModelViewSet):
    serializer_class = BillingSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    pagination_class = StandardPagination

    def get_queryset(self):
        return billings_queryset(self.request.query_params)
    
    def perform_create(self, serializer):
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
        
        if new_amount_received > 0 and (old_amount_received == 0 or new_amount_received > old_amount_received):
            serializer.save(payment_date=now, updated_at=now, updated_by=user_id)
        else:
            serializer.save(updated_at=now, updated_by=user_id)
        
        total_bill = serializer.validated_data.get('total_bill', instance.total_bill)
        balance = total_bill - new_amount_received
        if balance == 0 and instance.balance > 0:
            serializer.save(balance_payment_date=now, updated_at=now, updated_by=user_id)


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all().order_by("name")
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsCEOOrManagerCanAdd]
    pagination_class = StandardPagination

    def get_queryset(self):
        return expenses_queryset(self.request.query_params)
    
    def perform_create(self, serializer):
        category_name = serializer.validated_data.pop('category_name', None)
        
        if not category_name:
            raise ValidationError({"category_name": "Category name is required"})
        
        expense_category, created = ExpenseCategory.objects.get_or_create(
            name=category_name.strip()
        )
        
        serializer.save(category=expense_category)
