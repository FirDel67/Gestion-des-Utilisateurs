document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM loaded!");

    // User list functionality
    if (document.getElementById('userTableBody')) {
        loadUsers();
        setupSearch();
    }

    // User detail functionality
    if (document.getElementById('deleteUserBtn')) {
        setupDeleteButton();
    }

    // Role assignment
    if (document.getElementById('assignRolesBtn')) {
        setupRoleAssignment();
    }
});

async function loadUsers(page = 1, search = '') {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (page > 1) params.append('page', page);

        const response = await fetch(`http://127.0.0.1:8000/api/users/?${params.toString()}`);

        const json = await response.json();
        console.log("Users: ", json.results);

        renderUsers(json.results);
    } catch (error) {
        showAlert('Failed to load users', 'error');
        console.log("Error loading users: ", error);

    }
}

function renderUsers(users) {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="border border-gray-300 whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0">
                        <img class="h-10 w-10 rounded-full" src="${user.profile || '/static/img/logo.jpg'}" alt="User Profile">
                    </div>
                    <div class="ml-4">
                        <div class="font-medium text-gray-900">${user.first_name} ${user.last_name}</div>
                        <div class="text-gray-500">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td class="border border-gray-300 whitespace-nowrap px-3 py-4 text-sm text-gray-500">${user.email}</td>
            <td class="border border-gray-300 whitespace-nowrap px-3 py-4 text-sm text-gray-500">${user.phone}</td>
            <td class="border border-gray-300 whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold 
                    ${user.status == 'active' ? 'bg-green-100 text-green-800' : user.status == 'disabled' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}">
                    ${user.status}
                </span>
            </td>
            <td class="border border-gray-300 relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button class="text-orange-600 hover:text-orange-900 mr-3 user-detail"><a href="/users/${user.id}/detail/">Details</a></button>
                <button class="text-blue-600 hover:text-blue-900 mr-3 user-edit"><a href="/users/${user.id}/edit/">Edit</a></button>
                <button class="text-purple-600 hover:text-purple-900 mr-3 user-role-assign" data-user-id="${user.id}">
                    Assign Roles
                </button>
                <button class="text-red-600 hover:text-red-900 user-delete" data-user-id="${user.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.user-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = `/admin/users/${btn.dataset.userId}/edit/`;
        });
    });

    document.querySelectorAll('.user-role-assign').forEach(btn => {
        btn.addEventListener('click', () => openUserRoleModal(btn.dataset.userId));
    });

    document.querySelectorAll('.user-delete').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteUser(btn.dataset.userId));
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    let timeout = null;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            loadUsers(1, e.target.value);
        }, 500);
    });
}

function setupDeleteButton() {
    const deleteBtn = document.getElementById('deleteUserBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeleteUser(deleteBtn.dataset.userId));
    }
}

async function setupRoleAssignment() {
    const assignBtn = document.getElementById('assignRolesBtn');
    if (!assignBtn) return;

    assignBtn.addEventListener('click', async () => {
        try {
            const userId = assignBtn.dataset.userId;
            const [userResponse, rolesResponse] = await Promise.all([
                apiRequest('GET', `/api/users/${userId}/`),
                apiRequest('GET', '/api/roles/')
            ]);

            const user = userResponse.data;
            const roles = rolesResponse.data.results;

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'space-y-4';
            modalContent.innerHTML = `
                <p class="text-sm text-gray-500">Select roles for ${user.first_name} ${user.last_name}</p>
                <div class="space-y-2" id="rolesCheckboxGroup">
                    ${roles.map(role => `
                        <div class="flex items-center">
                            <input id="role-${role.id}" name="roles" type="checkbox" value="${role.id}" 
                                ${user.roles.some(r => r.id === role.id) ? 'checked' : ''}
                                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <label for="role-${role.id}" class="ml-3 block text-sm font-medium text-gray-700">
                                ${role.name}
                            </label>
                        </div>
                    `).join('')}
                </div>
            `;

            // Show modal
            const modal = document.getElementById('roleAssignmentModal');
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = '';
            modalBody.appendChild(modalContent);

            // Set up save button
            const saveBtn = modal.querySelector('.modal-save');
            saveBtn.onclick = async () => {
                try {
                    const selectedRoles = Array.from(modal.querySelectorAll('input[name="roles"]:checked'))
                        .map(checkbox => checkbox.value);

                    await apiRequest('POST', `/api/users/${userId}/roles/`, {
                        role_ids: selectedRoles
                    });

                    showAlert('Roles updated successfully', 'success');
                    window.location.reload();
                } catch (error) {
                    showAlert(error.message, 'error');
                }
            };

            // Open modal
            openModal('roleAssignmentModal');
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
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

async function handleDeleteUser(userId) {
    console.log("Del id: ", userId);

    try {
        const confirmed = await Swal.fire({
            title: 'Delete User',
            text: 'Are you sure you want to delete this user? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (confirmed.isConfirmed) {
            await fetch(`http://127.0.0.1:8000/api/users/${userId}/`, {
                method: 'DELETE'
            });
            await Swal.fire({
                title: 'Deleted!',
                text: 'User deleted successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            window.location.href = '/';
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// === Open User ↔ Role Modal ===
async function openUserRoleModal(userId) {
    document.getElementById('userRoleUserId').value = userId;
    const rolesContainer = document.getElementById('rolesList');
    rolesContainer.innerHTML = '';

    try {
        const [allRolesRes, assignedRes] = await Promise.all([
            fetch('http://127.0.0.1:8000/api/roles/'),
            fetch(`http://127.0.0.1:8000/api/user-roles/?user_id=${userId}`)
        ]);

        const allRoles = await allRolesRes.json();
        const assignedRoles = await assignedRes.json();

        const assignedIds = new Set(assignedRoles.results.map(r => r.role));

        allRoles.results.length > 0 && allRoles.results.forEach(role => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'roles';
            checkbox.value = role.id;
            checkbox.id = `role_${role.id}`;
            checkbox.checked = assignedRoles.results.length > 0 && assignedIds.has(role.id);

            const label = document.createElement('label');
            label.htmlFor = `role_${role.id}`;
            label.className = 'ml-2 text-sm text-gray-700';
            label.textContent = role.name;

            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-center';
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);

            rolesContainer.appendChild(wrapper);
        });

        document.getElementById('userRoleModal').classList.remove('hidden');
    } catch (error) {
        console.error(error);
        showAlert('Failed to load roles', 'error');
    }
}

function closeUserRoleModal() {
    document.getElementById('userRoleModal').classList.add('hidden');
}

// === Submit User ↔ Roles ===
document.getElementById('userRoleForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const userId = document.getElementById('userRoleUserId').value;
    const checkboxes = document.querySelectorAll('#rolesList input[name="roles"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    try {
        // Check if the user already has roles
        const response = await fetch(`http://127.0.0.1:8000/api/user-roles/?user_id=${userId}`);
        const existingRoles = await response.json();

        if (existingRoles.count > 0) {
            // If roles exist, send a PUT request to update
            await fetch(`http://127.0.0.1:8000/api/user-roles/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': '{{csrfToken}}',
                },
                body: JSON.stringify({ user_id: userId, roles: selectedIds })
            });
            showAlert('Roles updated successfully', 'success');
        } else {
            // If no roles exist, send a POST request to create
            await fetch(`http://127.0.0.1:8000/api/user-roles/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': '{{csrfToken}}',
                },
                body: JSON.stringify({ user_id: userId, roles: selectedIds })
            });
            showAlert('Roles added to User successfully', 'success');
        }
        closeUserRoleModal();
    } catch (error) {
        console.error(error);
        showAlert('Failed to update roles', 'error');
    }
});
