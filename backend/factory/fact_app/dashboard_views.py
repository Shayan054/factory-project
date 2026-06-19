from calendar import month_abbr
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Expense
from .querysets import active_billings, active_orders


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_metrics_view(request):
    now = timezone.now()
    current_year = now.year
    current_month = now.month

    orders = active_orders()
    billings = active_billings()

    monthly_sales = (
        orders.filter(
            order_date__year=current_year,
            order_date__month=current_month,
        ).aggregate(total=Sum("total_amount"))["total"]
        or 0
    )

    annual_sales = (
        orders.filter(order_date__year=current_year).aggregate(
            total=Sum("total_amount")
        )["total"]
        or 0
    )

    amount_received = (
        billings.aggregate(total=Sum("amount_received"))["total"] or 0
    )

    billed_order_ids = set(billings.values_list("order_id", flat=True))
    remaining_from_billings = (
        billings.aggregate(total=Sum("balance"))["total"] or 0
    )
    remaining_unbilled = (
        orders.exclude(order_id__in=billed_order_ids).aggregate(
            total=Sum("total_amount")
        )["total"]
        or 0
    )
    remaining_amount = remaining_from_billings + remaining_unbilled

    total_orders = orders.count()
    pending_orders = orders.filter(order_status=0).count()
    completed_orders = orders.filter(order_status=1).count()

    sales_chart = []
    for i in range(5, -1, -1):
        month_index = current_month - i
        year = current_year
        while month_index <= 0:
            month_index += 12
            year -= 1
        month_sales = (
            orders.filter(
                order_date__year=year,
                order_date__month=month_index,
            ).aggregate(total=Sum("total_amount"))["total"]
            or 0
        )
        sales_chart.append(
            {
                "month": month_abbr[month_index],
                "sales": month_sales,
            }
        )

    expense_start = (now.date() - timedelta(days=730)).isoformat()
    monthly_expenses = (
        Expense.objects.exclude(category__name__iexact="production")
        .filter(date__year=current_year, date__month=current_month)
        .aggregate(total=Sum("amount"))["total"]
        or 0
    )
    annual_expenses = (
        Expense.objects.exclude(category__name__iexact="production")
        .filter(date__year=current_year)
        .aggregate(total=Sum("amount"))["total"]
        or 0
    )

    return Response(
        {
            "monthly_sales": monthly_sales,
            "annual_sales": annual_sales,
            "amount_received": amount_received,
            "remaining_amount": remaining_amount,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "monthly_expenses": monthly_expenses,
            "annual_expenses": annual_expenses,
            "sales_chart": sales_chart,
            "expense_chart_from": expense_start,
        }
    )
