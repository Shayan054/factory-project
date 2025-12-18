from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Employee
from .auth_serializers import RegisterSerializer, LoginSerializer, EmployeeSerializer
from .permissions import IsCEO


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint - returns JWT tokens
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        try:
            employee = Employee.objects.get(email=email)
            if employee.check_password(password):
                if not employee.is_active:
                    return Response(
                        {'error': 'Account is disabled.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(employee)
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': EmployeeSerializer(employee).data
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': 'Invalid credentials.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCEO])
def register_employee_view(request):
    """
    Register new employee - CEO only
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        employee = serializer.save()
        return Response({
            'message': 'Employee registered successfully.',
            'employee': EmployeeSerializer(employee).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """
    Get current authenticated user details
    """
    serializer = EmployeeSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCEO])
def list_employees_view(request):
    """
    List all employees - CEO only
    """
    employees = Employee.objects.all()
    serializer = EmployeeSerializer(employees, many=True)
    return Response(serializer.data)

