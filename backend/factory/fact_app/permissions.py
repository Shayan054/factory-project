from rest_framework import permissions


class IsCEO(permissions.BasePermission):
    """
    Permission check for CEO role only
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_ceo()
        )


class IsManager(permissions.BasePermission):
    """
    Permission check for Manager role only
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_manager()
        )


class IsCEOOrReadOnly(permissions.BasePermission):
    """
    CEO can do everything, others can only read
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_ceo()
        )


class IsCEOOrManagerCanAdd(permissions.BasePermission):
    """
    CEO can do everything, Manager can only add/view (no edit/delete)
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # CEO can do everything
        if request.user.is_ceo():
            return True
        
        # Manager can only GET, POST (view and add)
        if request.user.is_manager():
            return request.method in ['GET', 'POST', 'HEAD', 'OPTIONS']
        
        return False

