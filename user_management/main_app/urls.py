from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    UserListCreateAPIView, UserDetailAPIView, UserLoginAPIView, UserLogoutAPIView, RoleListCreateAPIView, 
    RoleDetailAPIView, PermissionListCreateAPIView, PermissionDetailAPIView, 
    UserRoleListCreateAPIView, UserRoleDeleteAPIView, RolePermissionListCreateAPIView, 
    RolePermissionDeleteAPIView, UserDetailWithRolesAPIView, RoleDetailView,

    login_view, register_view, password_reset_view, password_reset_confirm_view, profile_view, 
    user_list_view, user_detail_view, user_edit_view, role_list_view,
    role_detail_view, role_edit_view, permission_list_view, permission_detail_view,
)

urlpatterns = [
    path('account/login/', login_view, name='login'),
    path('account/register/', register_view, name='register'),
    path('account/password_reset/', password_reset_view, name='password_reset'),
    path('account/password_reset_confirm/', password_reset_confirm_view, name='password_reset_confirm'),
    path('account/profile/', profile_view, name='profile'),
    path('', user_list_view, name='user_list'),
    path('users/<int:user_id>/detail/', user_detail_view, name='user_detail'),
    path('users/<int:user_id>/edit/', user_edit_view, name='user_edit'),
    path('roles/', role_list_view, name='role_list_view'),
    path('roles/<int:role_id>/detail/', role_detail_view, name='role_detail'),
    path('roles/<int:role_id>/edit/', role_edit_view, name='role_edit'),
    path('permissions/', permission_list_view, name='permission_list'),
    path('permissions/<int:permission_id>/', permission_detail_view, name='permission_detail'),
    
    path('auth/', include('rest_framework.urls')),

    # Users
    path('api/users/', UserListCreateAPIView.as_view(), name='user-list-create'),
    path('api/users/<int:pk>/', UserDetailAPIView.as_view(), name='user-detail'),
    path('api/users/<int:user_id>/details/', UserDetailWithRolesAPIView.as_view(), name='user-detail-with-roles'),

    # Auth actions
    path('api/users/login/', UserLoginAPIView.as_view(), name='user-login'),
    path('api/users/logout/', UserLogoutAPIView.as_view(), name='user-logout'),

    # Roles
    path('api/roles/', RoleListCreateAPIView.as_view(), name='role-list-create'),
    path('api/roles/<int:pk>/', RoleDetailAPIView.as_view(), name='role-detail'),
    path('api/roles/<int:role_id>/details/', RoleDetailView.as_view(), name='api_role_detail'),

    # Permissions
    path('api/permissions/', PermissionListCreateAPIView.as_view(), name='permission-list'),
    path('api/permissions/<int:pk>/', PermissionDetailAPIView.as_view(), name='permission-detail'),

    # UserRole
    path('api/user-roles/', UserRoleListCreateAPIView.as_view(), name='user-role-list-create'),
    path('api/user-roles/<int:pk>/', UserRoleDeleteAPIView.as_view(), name='user-role-delete'),

    # RolePermission
    path('api/role-permissions/', RolePermissionListCreateAPIView.as_view(), name='role-permission-list-create'),
    path('api/role-permissions/<int:pk>/', RolePermissionDeleteAPIView.as_view(), name='role-permission-delete'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)