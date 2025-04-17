document.addEventListener('DOMContentLoaded', () => {
    loadPermissions();
    setupPermissionsSearch();

    document.getElementById('addPermissionBtn').addEventListener('click', () => {
        openPermissionModal();
    });

    document.getElementById('permissionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePermission();
    });

    // Ensure this ID matches your HTML
    document.getElementById('permission_name').addEventListener('input', () => {
        const name = document.getElementById('permission_name').value.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const randomPartLength = Math.max(15 - name.length, 4); // At least 4 random characters
        const randomPart = generateRandomString(randomPartLength);
        const generatedCode = (name + '_' + randomPart).substring(0, 15);
        document.getElementById('permission_code').value = generatedCode; // Ensure this ID matches
    });
});

async function loadPermissions(page = 1, search = '') {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (page > 1) params.append('page', page);

        const response = await fetch(`http://127.0.0.1:8000/api/permissions/?${params.toString()}`);
        const permissions = await response.json();

        console.log("Permissions: ", permissions.results);

        const tbody = document.getElementById('permissionTableBody');
        tbody.innerHTML = '';

        permissions.results.forEach(permission => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border px-4 py-3 text-sm">${permission.name}</td>
                <td class="border px-4 py-3 text-sm">${permission.code}</td>
                <td class="border px-4 py-3 text-sm">${permission.description || ''}</td>
                <td class="border px-4 py-3 text-sm text-right">
                    <button class="text-blue-600 hover:underline mr-2" onclick="editPermission(${permission.id})">Edit</button>
                    <button class="text-red-600 hover:underline" onclick="deletePermission(${permission.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        showAlert('Failed to load permissions', 'error');
    }
}

function openPermissionModal(permission = null) {
    clearPermissionFormErrors();
    const modal = document.getElementById('permissionModal');
    const title = document.getElementById('permissionModalTitle');

    document.getElementById('permissionForm').reset();
    document.getElementById('permission_id').value = '';

    if (permission) {
        title.textContent = 'Edit Permission';
        document.getElementById('permission_id').value = permission.id;
        document.getElementById('permission_name').value = permission.name;
        document.getElementById('permission_code').value = permission.code;
        document.getElementById('permission_description').value = permission.description || '';
    } else {
        title.textContent = 'Create Permission';
    }

    modal.classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function clearPermissionFormErrors() {
    ['name', 'code', 'description'].forEach(field => {
        const errorEl = document.getElementById(`permission_${field}_error`);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }
    });
}

async function savePermission() {
    clearPermissionFormErrors();

    const id = document.getElementById('permission_id').value;
    const name = document.getElementById('permission_name').value.trim();
    const code = document.getElementById('permission_code').value.trim();
    const description = document.getElementById('permission_description').value.trim();

    const payload = { name, code, description };

    try {
        const response = await fetch(`/api/permissions/${id || ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            closeModal('permissionModal');
            showAlert(`Permission ${id ? 'updated' : 'created'} successfully`, 'success');
            loadPermissions();
        } else {
            displayPermissionFormErrors(data);
        }
    } catch (error) {
        showAlert('Something went wrong while saving.', 'error');
    }
}

function displayPermissionFormErrors(errors) {
    for (const field in errors) {
        const el = document.getElementById(`permission_${field}_error`);
        if (el) {
            el.textContent = errors[field].join(' ');
            el.classList.remove('hidden');
        }
    }
}

async function deletePermission(id) {
    const result = await Swal.fire({
        title: 'Delete Permission?',
        text: 'Are you sure you want to delete this permission? This cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/permissions/${id}/`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showAlert('Permission deleted successfully', 'success');
                loadPermissions();
            } else {
                showAlert('Failed to delete permission', 'error');
            }
        } catch (error) {
            showAlert('An error occurred while deleting', 'error');
        }
    }
}

async function editPermission(id) {
    try {
        const response = await fetch(`/api/permissions/${id}/`);
        const data = await response.json();
        openPermissionModal(data);
    } catch (error) {
        showAlert('Failed to fetch permission data.', 'error');
    }
}

function showAlert(message, type = 'success') {
    Swal.fire({
        icon: type,
        title: message,
        timer: 3000,
        showConfirmButton: false
    });
}

function setupPermissionsSearch() {
    const searchInput = document.getElementById('permissionSearch');
    let timeout = null;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            loadPermissions(1, e.target.value);
        }, 500);
    });
}

document.getElementById('permissionName').addEventListener('input', () => {
    const name = document.getElementById('permissionName').value.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const randomPartLength = Math.max(15 - name.length, 4); // At least 4 random characters
    const randomPart = generateRandomString(randomPartLength);
    const generatedCode = (name + '_' + randomPart).substring(0, 15);
    document.getElementById('permissionCode').value = generatedCode;
});

function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
