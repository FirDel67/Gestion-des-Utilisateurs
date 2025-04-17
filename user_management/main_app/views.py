from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.db import transaction
from django.contrib.auth import login, logout
from django.shortcuts import get_object_or_404
from django.db.models import Q
# import pyotp
# import qrcode
# import base64
# from io import BytesIO

from .models import User, Role, Permission, UserRole, RolePermission, LoginLog
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    RoleSerializer,
    PermissionSerializer,
    UserRoleSerializer,
    RolePermissionSerializer,
    UserDetailSerializer,
    PasswordResetSerializer,
    PasswordChangeSerializer,
    LoginLogSerializer
)

from .pagination import DefaultPagination

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import User, Role, Permission, UserRole, RolePermission
from .serializers import (
    UserSerializer, UserDetailSerializer, RegisterSerializer,
    LoginSerializer, RoleSerializer, PermissionSerializer,
    UserRoleSerializer, RolePermissionSerializer
)
from django.contrib.auth import login, logout

# ----- USERS -----
class UserListCreateAPIView(APIView):
    def get(self, request):
        users = User.objects.all()
        paginator = DefaultPagination()

        # Apply search filter if search parameter exists
        search_query = request.query_params.get('search', None)
        if search_query:
            users = users.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(phone__icontains=search_query) 
            )

        paginated_users = paginator.paginate_queryset(users, request)
        serializer = UserSerializer(paginated_users, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailAPIView(APIView):
    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserDetailSerializer(user)
        return Response(serializer.data)

    def patch(self, request, pk):  # Changed from put to patch
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserLoginAPIView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        login(request, user)
        return Response({"message": "Login successful"}, status=status.HTTP_200_OK)


class UserLogoutAPIView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


# ----- ROLES -----
class RoleListCreateAPIView(APIView):
    def get(self, request):
        queryset = Role.objects.all()
        
        # Apply search filter if search parameter exists
        search_query = request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query)
            )
        
        # Paginate the results
        paginator = DefaultPagination()
        paginated_roles = paginator.paginate_queryset(queryset, request)
        serializer = RoleSerializer(paginated_roles, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = RoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RoleDetailAPIView(APIView):
    def get(self, request, pk):
        role = get_object_or_404(Role, pk=pk)
        serializer = RoleSerializer(role)
        return Response(serializer.data)

    def patch(self, request, pk):
        role = get_object_or_404(Role, pk=pk)
        serializer = RoleSerializer(role, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        role = get_object_or_404(Role, pk=pk)
        role.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RolePermissionAPIView(APIView):
    def get(self, request, pk):
        role = get_object_or_404(Role, pk=pk)
        serializer = PermissionSerializer(role.permissions.all(), many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        role = get_object_or_404(Role, pk=pk)
        permission_id = request.data.get('permission_id')
        permission = get_object_or_404(Permission, id=permission_id)
        if not RolePermission.objects.filter(role=role, permission=permission).exists():
            RolePermission.objects.create(role=role, permission=permission)
            return Response({"message": "Permission added to role successfully"}, status=status.HTTP_201_CREATED)
        return Response({"message": "Role already has this permission"}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        role = get_object_or_404(Role, pk=pk)
        permission_id = request.data.get('permission_id')
        permission = get_object_or_404(Permission, id=permission_id)
        RolePermission.objects.filter(role=role, permission=permission).delete()
        return Response({"message": "Permission removed from role successfully"}, status=status.HTTP_204_NO_CONTENT)


# ----- PERMISSIONS -----
class PermissionListCreateAPIView(APIView):
    def get(self, request):
        paginator = DefaultPagination()
        permissions = Permission.objects.all()
        
        # Apply search filter if search parameter exists
        search_query = request.query_params.get('search', None)
        if search_query:
            permissions = permissions.filter(
                Q(name__icontains=search_query) |
                Q(code__icontains=search_query) |
                Q(description__icontains=search_query)
            )
        
        paginated_permissions = paginator.paginate_queryset(permissions, request)
        serializer = PermissionSerializer(paginated_permissions, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        serializer = PermissionSerializer(data=request.data)
        if serializer.is_valid():
            permission = serializer.save()
            return Response(PermissionSerializer(permission).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PermissionDetailAPIView(APIView):
    def get(self, request, pk):
        try:
            permission = Permission.objects.get(pk=pk)
        except Permission.DoesNotExist:
            raise NotFound('Permission not found')
        
        serializer = PermissionSerializer(permission)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            permission = Permission.objects.get(pk=pk)
        except Permission.DoesNotExist:
            raise NotFound('Permission not found')
        
        serializer = PermissionSerializer(permission, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        permission = get_object_or_404(Permission, pk=pk)
        permission.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ----- USER ROLES -----
class UserRoleListCreateAPIView(APIView):
    def get(self, request):
        queryset = UserRole.objects.select_related('user', 'role')
        user_id = request.query_params.get('user_id')
        role_id = request.query_params.get('role_id')

        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if role_id:
            queryset = queryset.filter(role_id=role_id)

        paginator = DefaultPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        serializer = UserRoleSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        user_id = request.data.get('user_id')  # Ensure you're getting user_id from request data
        role_ids = request.data.get('roles', [])

        if not user_id or not role_ids:
            return Response({"error": "User ID and roles are required."}, status=status.HTTP_400_BAD_REQUEST)

        user_roles = []
        for role_id in role_ids:
            user_role = UserRole(user_id=user_id, role_id=role_id)
            user_roles.append(user_role)

        UserRole.objects.bulk_create(user_roles)  # Use bulk_create for efficiency
        return Response({"message": "Roles assigned successfully."}, status=status.HTTP_201_CREATED)

    def patch(self, request):
        user_id = request.data.get('user_id')
        role_ids = request.data.get('roles', [])

        if not user_id:
            return Response({"error": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Convert role_ids to integers if they aren't already
            role_ids = [int(role_id) for role_id in role_ids]
        except (ValueError, TypeError):
            return Response({"error": "Invalid role IDs format."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():  # Ensure all operations succeed or fail together
            # Get current roles as a set of IDs
            current_role_ids = set(UserRole.objects.filter(user_id=user_id)
                                .values_list('role_id', flat=True))
            
            # Convert input to set for easier comparison
            new_role_ids = set(role_ids)
            
            # Determine roles to add and remove
            roles_to_add = new_role_ids - current_role_ids
            roles_to_remove = current_role_ids - new_role_ids

            # Remove unwanted roles
            if roles_to_remove:
                UserRole.objects.filter(user_id=user_id, role_id__in=roles_to_remove).delete()
            
            # Add new roles
            if roles_to_add:
                UserRole.objects.bulk_create([
                    UserRole(user_id=user_id, role_id=role_id) 
                    for role_id in roles_to_add
                ])

        return Response({
            "message": "Roles updated successfully.",
            "added": len(roles_to_add),
            "removed": len(roles_to_remove)
        }, status=status.HTTP_200_OK)


class UserRoleDeleteAPIView(APIView):
    def delete(self, request, pk):
        user_role = get_object_or_404(UserRole, pk=pk)
        user_role.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserDetailWithRolesAPIView(APIView):
    """
    Retrieve a user with assigned roles and each role's permissions.
    """
    def get(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)

        roles = UserRole.objects.filter(user=user).select_related('role')

        roles_data = []
        for user_role in roles:
            role = user_role.role
            permissions = RolePermission.objects.filter(role=role).select_related('permission')
            permissions_data = [
                {
                    'id': p.permission.id,
                    'name': p.permission.name,
                    'code': p.permission.code,
                    'description': p.permission.description
                } for p in permissions
            ]
            roles_data.append({
                'id': role.id,
                'name': role.name,
                'description': role.description,
                'permissions': permissions_data
            })

        user_data = {
            'id': user.id,
            'full_name': user.first_name + " " + user.last_name,
            'email': user.email,
            'phone': user.phone,
            'profile': user.profile.url if user.profile else None,
            'status': user.status,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
            'roles': roles_data
        }

        return Response(user_data, status=status.HTTP_200_OK)
    

# ----- ROLE PERMISSIONS -----
class RolePermissionListCreateAPIView(APIView):
    def get(self, request):
        queryset = RolePermission.objects.select_related('role', 'permission')
        role_id = request.query_params.get('role_id')
        permission_id = request.query_params.get('permission_id')
        print("Role Perm QS: ", queryset)

        if role_id:
            queryset = queryset.filter(role_id=role_id)
        if permission_id:
            queryset = queryset.filter(permission_id=permission_id)

        paginator = DefaultPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        serializer = RolePermissionSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        user_id = request.data.get('role_id')  # Ensure you're getting user_id from request data
        permission_ids = request.data.get('permissions', [])

        if not user_id or not permission_ids:
            return Response({"error": "Role ID and permissions are required."}, status=status.HTTP_400_BAD_REQUEST)

        role_permissions = []
        for permission_id in permission_ids:
            role_permission = RolePermission(role_id=user_id, permission_id=permission_id)
            role_permissions.append(role_permission)

        RolePermission.objects.bulk_create(role_permissions)  # Use bulk_create for efficiency
        return Response({"message": "Permissions added to Roles assigned successfully."}, status=status.HTTP_201_CREATED)

    def patch(self, request):
        role_id = request.data.get('role_id')
        permission_ids = request.data.get('permissions', [])

        if not role_id:
            return Response({"error": "Role ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Convert permission_ids to integers if they aren't already
            permission_ids = [int(permission_id) for permission_id in permission_ids]
        except (ValueError, TypeError):
            return Response({"error": "Invalid permission IDs format."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():  # Ensure all operations succeed or fail together
            # Get current permissions as a set of IDs
            current_permission_ids = set(RolePermission.objects.filter(role_id=role_id)
                                          .values_list('permission_id', flat=True))
            
            # Convert input to set for easier comparison
            new_permission_ids = set(permission_ids)
            
            # Determine permissions to add and remove
            permissions_to_add = new_permission_ids - current_permission_ids
            permissions_to_remove = current_permission_ids - new_permission_ids

            # Remove unwanted permissions
            if permissions_to_remove:
                RolePermission.objects.filter(role_id=role_id, permission_id__in=permissions_to_remove).delete()
            
            # Add new permissions
            if permissions_to_add:
                RolePermission.objects.bulk_create([
                    RolePermission(role_id=role_id, permission_id=permission_id) 
                    for permission_id in permissions_to_add
                ])

        return Response({
            "message": "Permissions updated successfully.",
            "added": len(permissions_to_add),
            "removed": len(permissions_to_remove)
        }, status=status.HTTP_200_OK)
    

class RolePermissionDeleteAPIView(APIView):
    def delete(self, request, pk):
        role_permission = get_object_or_404(RolePermission, pk=pk)
        role_permission.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RoleDetailView(APIView):
    def get(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        permissions = Permission.objects.filter(rolepermission__role=role)
        return Response({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": PermissionSerializer(permissions, many=True).data
        })

    def post(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        permission_ids = request.data.get('permissions', [])
        RolePermission.objects.filter(role=role).delete()
        for pid in permission_ids:
            perm = get_object_or_404(Permission, id=pid)
            RolePermission.objects.create(role=role, permission=perm)
        return Response({"message": "Permissions updated successfully."})

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def user_activity_logs(request, user_id):
#     if not request.user.is_staff and request.user.id != int(user_id):
#         return Response({"detail": "Not authorized"}, status=403)
    
#     logs = LoginLog.objects.filter(user_id=user_id).order_by('-timestamp')[:50]
#     serializer = LoginLogSerializer(logs, many=True)
#     return Response(serializer.data)

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def upload_avatar(request, user_id):
#     if not request.user.is_staff and request.user.id != int(user_id):
#         return Response({"detail": "Not authorized"}, status=403)
    
#     if 'avatar' not in request.FILES:
#         return Response({"detail": "No file uploaded"}, status=400)
    
#     user = User.objects.get(id=user_id)
#     user.avatar = request.FILES['avatar']
#     user.save()
    
#     return Response({
#         "avatar_url": user.avatar.url,
#         "detail": "Avatar updated successfully"
#     })

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def setup_2fa(request):
#     if request.user.totp_secret:
#         return Response({"detail": "2FA already enabled"}, status=400)
    
#     # Generate a random secret
#     secret = pyotp.random_base32()
#     # Create a provisioning URI for the authenticator app
#     provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
#         name=request.user.email,
#         issuer_name="Your App Name"
#     )
    
#     # Generate QR code
#     qr = qrcode.QRCode(
#         version=1,
#         error_correction=qrcode.constants.ERROR_CORRECT_L,
#         box_size=6,
#         border=4,
#     )
#     qr.add_data(provisioning_uri)
#     qr.make(fit=True)
#     img = qr.make_image(fill_color="black", back_color="white")
    
#     # Save QR code to temporary file
#     buffer = BytesIO()
#     img.save(buffer, format="PNG")
#     qr_code_url = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"
    
#     return Response({
#         "secret": secret,
#         "qr_code_url": qr_code_url
#     })

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def verify_2fa(request):
#     secret = request.data.get('secret')
#     code = request.data.get('code')
    
#     if not secret or not code:
#         return Response({"detail": "Missing secret or code"}, status=400)
    
#     totp = pyotp.TOTP(secret)
#     if not totp.verify(code, valid_window=1):
#         return Response({"detail": "Invalid code"}, status=400)
    
#     request.user.totp_secret = secret
#     request.user.save()
    
#     return Response({"detail": "2FA enabled successfully"})

# @receiver(user_logged_in)
# def log_user_login(sender, request, user, **kwargs):
#     user_agent = request.META.get('HTTP_USER_AGENT', '')
#     ip_address = request.META.get('REMOTE_ADDR')
    
#     LoginLog.objects.create(
#         user=user,
#         ip_address=ip_address,
#         user_agent=user_agent,
#         event='login'
#     )


from django.shortcuts import render

# Account views
def login_view(request):
    return render(request, 'account/login.html')

def register_view(request):
    return render(request, 'account/register.html')

def password_reset_view(request):
    return render(request, 'account/password_reset.html')

def password_reset_confirm_view(request):
    return render(request, 'account/password_reset_confirm.html')

def profile_view(request):
    return render(request, 'account/profile.html')

# Admin views
def user_list_view(request):
    return render(request, 'admin/users/list.html')

def user_detail_view(request, user_id):
    return render(request, 'admin/users/detail.html', {'user_id': user_id})

def user_edit_view(request, user_id):
    return render(request, 'admin/users/edit.html', {'user_id': user_id})

def role_list_view(request):
    return render(request, 'admin/roles/list.html')

def role_detail_view(request, role_id):
    return render(request, 'admin/roles/detail.html', {'role_id': role_id})

def role_edit_view(request, role_id):
    return render(request, 'admin/roles/edit.html', {'role_id': role_id})

def permission_list_view(request):
    return render(request, 'admin/permissions/list.html')

def permission_detail_view(request, permission_id):
    return render(request, 'admin/permissions/detail.html', {'permission_id': permission_id})
