from rest_framework.routers import DefaultRouter
from .views import (
    VendorViewSet,
    RawMaterialViewSet,
    CustomerViewSet,
    ProductViewSet,
    OrderViewSet,
    OrderDetailsViewSet,
    BillingViewSet
)

router = DefaultRouter()
router.register(r'vendors', VendorViewSet)
router.register(r'raw-materials', RawMaterialViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-details', OrderDetailsViewSet)
router.register(r'billings', BillingViewSet)

urlpatterns = router.urls