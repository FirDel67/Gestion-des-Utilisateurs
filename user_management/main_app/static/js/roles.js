document.addEventListener('DOMContentLoaded', function () {
    // Role list functionality
    if (document.getElementById('roleTableBody')) {
        loadRoles();
        setupRoleSearch();
    }
});

async function loadRoles(page = 1, search = '') {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (page > 1) params.append('page', page);

        const response = await fetch(`http://127.0.0.1:8000/api/roles/?${params.toString()}`);
        const json = await response.json();

        console.log("Roles: ", json.results);

        renderRoles(json.results);
    } catch (error) {
        Swal.fire({
            title: 'Error!',
            text: 'Failed to load roles',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        console.log("Error loading roles: ", error);
    }
}

function renderRoles(roles) {
    const tableBody = document.getElementById('roleTableBody');
    tableBody.innerHTML = '';

    roles.forEach(role => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="border whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                <span class="text-blue-600 hover:text-blue-900">
                    ${role.name}
                </span>
            </td>
            <td class="border whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                ${role.description.substring(0, 50) + '...' || '-'}
            </td>
            <td class="border relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button class="text-orange-600 hover:text-orange-900 mr-3 role-detail"><a href="/roles/${role.id}/detail/">Details</a></button>
                <button class="text-blue-600 hover:text-blue-900 mr-3 role-edit" data-role-id="${role.id}">Edit</button>
                <button class="text-indigo-600 hover:text-indigo-900 mr-3 role-assign-perm" data-role-id="${role.id}">Assign Permissions</button>
                <button class="text-red-600 hover:text-red-900 role-delete" data-role-id="${role.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners
    document.querySelectorAll('.role-edit').forEach(btn => {
        btn.addEventListener('click', () => handleEditRole(btn.dataset.roleId));
    });

    document.querySelectorAll('.role-assign-perm').forEach(btn => {
        btn.addEventListener('click', () => openRolePermissionModal(btn.dataset.roleId));
    });

    document.querySelectorAll('.role-delete').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteRole(btn.dataset.roleId));
    });
}

function setupRoleSearch() {
    const searchInput = document.getElementById('roleSearch');
    let timeout = null;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            loadRoles(1, e.target.value);
        }, 500);
    });
}

async function handleDeleteRole(roleId) {
    const result = await Swal.fire({
        title: 'Delete Role',
        text: 'Are you sure you want to delete this role? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/roles/${roleId}/`, {
                method: 'DELETE',
            });

            if (response.ok) {
                Swal.fire('Deleted!', 'The role has been deleted.', 'success');
                loadRoles();
            } else {
                const data = await response.json();
                Swal.fire('Error!', data?.detail || 'Failed to delete role.', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', error.message, 'error');
        }
    }
}

async function handleEditRole(roleId) {
    try {
        const response = await fetch(`/api/roles/${roleId}/`);
        if (!response.ok) throw new Error('Failed to fetch role.');

        const role = await response.json();

        // Fill the form
        document.getElementById('role_id').value = role.id;
        document.getElementById('role_name').value = role.name;
        document.getElementById('role_description').value = role.description;

        clearRoleFormErrors();
        openRoleModal(true);
        console.log("Role detail: ", role);
    } catch (error) {
        Swal.fire('Error!', error.message, 'error');
    }
}

async function setupPermissionManagement() {
    const manageBtn = document.getElementById('managePermissionsBtn');
    if (!manageBtn) return;

    manageBtn.addEventListener('click', async () => {
        try {
            const roleId = manageBtn.dataset.roleId;
            const [roleResponse, permissionsResponse] = await Promise.all([
                apiRequest('GET', `/api/roles/${roleId}/`),
                apiRequest('GET', '/api/permissions/')
            ]);

            const role = roleResponse.data;
            const permissions = permissionsResponse.data.results;

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'space-y-4';
            modalContent.innerHTML = `
                <p class="text-sm text-gray-500">Select permissions for role: <strong>${role.name}</strong></p>
                <div class="space-y-3 max-h-96 overflow-y-auto" id="permissionsCheckboxGroup">
                    ${permissions.map(permission => `
                        <div class="flex items-start">
                            <div class="flex items-center h-5">
                                <input id="perm-${permission.id}" name="permissions" type="checkbox" value="${permission.id}" 
                                    ${role.permissions.some(p => p.id === permission.id) ? 'checked' : ''}
                                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            </div>
                            <div class="ml-3 text-sm">
                                <label for="perm-${permission.id}" class="font-medium text-gray-700">
                                    ${permission.name} (<code>${permission.code}</code>)
                                </label>
                                <p class="text-gray-500">${permission.description || 'No description'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Show modal
            const modal = document.getElementById('permissionAssignmentModal');
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = '';
            modalBody.appendChild(modalContent);

            // Set up save button
            const saveBtn = modal.querySelector('.modal-save');
            saveBtn.onclick = async () => {
                try {
                    const selectedPermissions = Array.from(modal.querySelectorAll('input[name="permissions"]:checked'))
                        .map(checkbox => checkbox.value);

                    await apiRequest('POST', `/api/roles/${roleId}/permissions/`, {
                        permission_ids: selectedPermissions
                    });

                    showAlert('Permissions updated successfully', 'success');
                    window.location.reload();
                } catch (error) {
                    showAlert(error.message, 'error');
                }
            };

            // Open modal
            openModal('permissionAssignmentModal');
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
}

function openRoleModal(isEdit = false) {
    document.getElementById('roleModalTitle').textContent = isEdit ? 'Edit Role' : 'Create Role';
    document.getElementById('roleModal').classList.remove('hidden');
}

function closeRoleModal() {
    document.getElementById('roleModal').classList.add('hidden');
    clearRoleForm();
}

function clearRoleFormErrors() {
    const errorFields = ['name_error', 'description_error'];
    errorFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = '';
            el.classList.add('hidden');
        }
    });
}

document.getElementById('roleForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    clearRoleFormErrors();

    const roleId = document.getElementById('role_id').value;
    const name = document.getElementById('role_name').value.trim();
    const description = document.getElementById('role_description').value.trim();

    const payload = {
        name,
        description,
    };

    const url = roleId
        ? `/api/roles/${roleId}/`     // Update
        : '/api/roles/';              // Create

    const method = roleId ? 'PATCH' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{csrfToken}}',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            closeRoleModal();
            loadRoles(); // reload list
            await Swal.fire({
                title: 'Success!',
                text: 'Role saved successfully!',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            clearRoleForm()
        } else {
            if (data && typeof data === 'object') {
                displayRoleFormErrors(data);
            } else {
                await Swal.fire({
                    title: 'Error!',
                    text: 'Something went wrong while saving the role.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    } catch (error) {
        console.error(error);
        await Swal.fire({
            title: 'Error!',
            text: 'Network error or server issue.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});

function displayRoleFormErrors(errors) {
    for (const field in errors) {
        const errorEl = document.getElementById(`${field}_error`);
        if (errorEl) {
            errorEl.textContent = errors[field].join(' ');
            errorEl.classList.remove('hidden');
        }
    }
}

function clearRoleForm() {
    // Clear input fields
    document.getElementById('role_id').value = '';
    document.getElementById('role_name').value = '';
    document.getElementById('role_description').value = '';

    // Clear error messages
    clearRoleFormErrors();
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-md ${type === 'error' ? 'bg-red-100 text-red-800' :
        type === 'success' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
        }`;
    alert.textContent = message;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

async function openRolePermissionModal(roleId) {
    document.getElementById('rolePermissionModal').classList.remove('hidden');
    document.getElementById('modalRoleId').value = roleId;

    const permissionsContainer = document.getElementById('permissionsList');
    permissionsContainer.innerHTML = '';

    try {
        const [roleRes, permissionsRes] = await Promise.all([
            fetch(`http://127.0.0.1:8000/api/role-permissions/?role_id=${roleId}`),
            fetch('http://127.0.0.1:8000/api/permissions/')
        ]);

        const roleData = await roleRes.json();
        const allPermissions = await permissionsRes.json();

        const assignedIds = new Set(roleData.results.map(rp => rp.permission));

        allPermissions.results.forEach(p => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = p.id;
            checkbox.id = `permission_${p.id}`;
            checkbox.checked = assignedIds.has(p.id);

            const label = document.createElement('label');
            label.htmlFor = `permission_${p.id}`;
            label.className = 'ml-2 text-sm text-gray-700';
            label.textContent = p.name;

            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-center space-x-2';
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);

            permissionsContainer.appendChild(wrapper);
        });

    } catch (error) {
        console.error(error);
        showAlert('Failed to load permissions', 'error');
    }
}

function closeRolePermissionModal() {
    document.getElementById('rolePermissionModal').classList.add('hidden');
}

document.getElementById('assignPermissionsForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const roleId = document.getElementById('modalRoleId').value;
    const checkedPermissions = Array.from(document.querySelectorAll('#permissionsList input:checked')).map(i => i.value);

    try {
        // Check if the role already has permissions
        const response = await fetch(`http://127.0.0.1:8000/api/role-permissions/?role_id=${roleId}`);
        const existingPermissions = await response.json();

        if (existingPermissions.count > 0) {
            // If permissions exist, send a PATCH request to update
            await fetch(`http://127.0.0.1:8000/api/role-permissions/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': "{{csrfToken}}"
                },
                body: JSON.stringify({ role_id: roleId, permissions: checkedPermissions })
            });
            showAlert('Permissions updated successfully.', 'success');
        } else {
            // If no permissions exist, send a POST request to create
            await fetch(`http://127.0.0.1:8000/api/role-permissions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': "{{csrfToken}}"
                },
                body: JSON.stringify({ role_id: roleId, permissions: checkedPermissions })
            });
            showAlert('Permissions assigned successfully.', 'success');
        }

        closeRolePermissionModal();
        loadRoles(); // Reload roles if you're showing them elsewhere
    } catch (err) {
        showAlert('Failed to assign permissions.', 'error');
        console.error(err);
    }
});

