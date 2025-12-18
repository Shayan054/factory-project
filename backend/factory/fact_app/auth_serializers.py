from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer for Employee model (for display)
    """
    class Meta:
        model = Employee
        fields = ['employee_id', 'email', 'first_name', 'last_name', 'role', 'date_joined']
        read_only_fields = ['employee_id', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for employee registration (CEO only)
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')
    
    class Meta:
        model = Employee
        fields = ['email', 'first_name', 'last_name', 'role', 'password', 'password2']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        employee = Employee.objects.create(**validated_data)
        employee.set_password(password)
        employee.save()
        return employee


class LoginSerializer(serializers.Serializer):
    """
    Serializer for login
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

