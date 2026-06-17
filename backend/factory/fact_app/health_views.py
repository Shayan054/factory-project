from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Employee


@api_view(["GET"])
@permission_classes([AllowAny])
def db_health_view(request):
    """
    Lightweight DB connectivity check for Render/free (no shell).
    Safe enough for debugging; remove/lock down after you're done.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()

        # Also verify that Django can access application tables.
        employee_count = Employee.objects.count()
        return Response({"ok": True, "employee_count": employee_count})
    except Exception as e:
        return Response(
            {"ok": False, "error": str(e)},
            status=500,
        )

