from django.db.models import Q

from .models import (
    Billing,
    Customer,
    Expense,
    Order,
    OrderDetails,
    Product,
    RawMaterial,
)


def active_orders():
    return Order.objects.exclude(is_deleted=1)


def active_customers():
    return Customer.objects.exclude(is_deleted=1)


def active_order_details():
    return OrderDetails.objects.exclude(is_deleted=1)


def active_billings():
    return Billing.objects.exclude(is_deleted=1)


def apply_text_search(queryset, search, *fields):
    term = (search or "").strip()
    if not term or not fields:
        return queryset
    condition = Q()
    for field in fields:
        condition |= Q(**{f"{field}__icontains": term})
    return queryset.filter(condition)


def filter_by_date_range(qs, field_name, date_from, date_to):
    if date_from:
        qs = qs.filter(**{f"{field_name}__gte": date_from})
    if date_to:
        qs = qs.filter(**{f"{field_name}__lte": date_to})
    return qs


def apply_order_filters(queryset, params):
    qs = queryset
    customer = params.get("customer")
    order_status = params.get("order_status")
    search = params.get("search")
    date_from = params.get("date_from")
    date_to = params.get("date_to")

    if customer:
        qs = qs.filter(customer_id=customer)
    if order_status is not None and order_status != "":
        qs = qs.filter(order_status=order_status)
    if search:
        qs = qs.filter(order_no__icontains=search)
    qs = filter_by_date_range(qs, "order_date__date", date_from, date_to)
    return qs


def apply_expense_filters(queryset, params):
    qs = queryset
    date_from = params.get("date_from")
    date_to = params.get("date_to")
    exclude_production = params.get("exclude_production")

    qs = filter_by_date_range(qs, "date", date_from, date_to)
    if exclude_production in ("1", "true", "True"):
        qs = qs.exclude(category__name__iexact="production")
    return qs


def orders_queryset(params=None):
    qs = (
        active_orders()
        .select_related("customer")
        .order_by("-order_date", "-order_id")
    )
    if params:
        qs = apply_order_filters(qs, params)
    return qs


def orders_detail_queryset(params=None):
    qs = orders_queryset(params).prefetch_related("order_details")
    return qs


def products_list_queryset():
    return Product.objects.all().order_by("product_name")


def products_detail_queryset():
    return Product.objects.prefetch_related(
        "raw_materials_used__raw_material"
    ).all()


def raw_materials_queryset():
    return RawMaterial.objects.select_related("vendor").order_by("material")


def expenses_queryset(params=None):
    qs = Expense.objects.select_related("category").order_by("-date", "-expense_id")
    if params:
        qs = apply_expense_filters(qs, params)
    return qs


def billings_queryset(params=None):
    qs = active_billings().select_related("order", "customer").order_by("-bill_date")
    order_id = params.get("order") if params else None
    if order_id:
        qs = qs.filter(order_id=order_id)
    customer_id = params.get("customer") if params else None
    if customer_id:
        qs = qs.filter(customer_id=customer_id)
    return qs


def order_details_queryset(params=None):
    qs = active_order_details().select_related("product", "order").order_by("-order_detail_id")
    order_id = params.get("order") if params else None
    if order_id:
        qs = qs.filter(order_id=order_id)
    return qs
