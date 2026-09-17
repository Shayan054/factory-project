from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Employee


@api_view(["GET"])
@permission_classes([AllowAny])
def db_health_view(request):
    """
    Lightweight DB connectivity check.
    Returns standard status without exposing internal database details or exceptions.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()
        return Response({"status": "healthy", "ok": True})
    except Exception:
        return Response(
            {"status": "unhealthy", "ok": False},
            status=500,
        )

