from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    VendorViewSet,
    RawMaterialViewSet,
    CustomerViewSet,
    ProductViewSet,
    ProductRawMaterialViewSet,
    OrderViewSet,
    OrderDetailsViewSet,
    BillingViewSet,
    ExpenseViewSet,
    ExpenseCategoryViewSet
)
from .health_views import db_health_view
from .dashboard_views import dashboard_metrics_view
from .auth_views import (
    login_view,
    register_employee_view,
    current_user_view,
    list_employees_view
)

router = DefaultRouter()
router.register(r'vendors', VendorViewSet)
router.register(r'raw-materials', RawMaterialViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'products', ProductViewSet)
router.register(r'product-raw-materials', ProductRawMaterialViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-details', OrderDetailsViewSet)
router.register(r'billings', BillingViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'expense-categories', ExpenseCategoryViewSet)

urlpatterns = [
    # Authentication endpoints
    path('db-health/', db_health_view, name='db_health'),
    path('dashboard/metrics/', dashboard_metrics_view, name='dashboard_metrics'),
    path('auth/login/', login_view, name='login'),
    path('auth/register/', register_employee_view, name='register'),
    path('auth/me/', current_user_view, name='current_user'),
    path('auth/employees/', list_employees_view, name='list_employees'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + router.urls