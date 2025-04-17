import { apiRequest, showAlert, showConfirm, openModal, closeModal } from './api.js';

document.addEventListener('DOMContentLoaded', function () {
    // Tab switching functionality
    setupTabs();

    // Profile form handling
    if (document.getElementById('profileForm')) {
        setupProfileForm();
    }

    // Password form handling
    if (document.getElementById('passwordForm')) {
        setupPasswordForm();
    }

    // Avatar upload handling
    if (document.getElementById('avatar-upload')) {
        setupAvatarUpload();
    }

    // Activity log loading
    if (document.getElementById('activityTable')) {
        loadActivityLogs();
    }

    // Admin functionality
    if (document.getElementById('admin-content')) {
        setupAdminFeatures();
    }

    // 2FA setup
    if (document.getElementById('enable2faBtn')) {
        setup2FA();
    }
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.add('hidden'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.remove('hidden');
        });
    });
}

async function setupProfileForm() {
    const form = document.getElementById('profileForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            first_name: form.elements.first_name.value,
            last_name: form.elements.last_name.value,
            email: form.elements.email.value,
            phone: form.elements.phone.value || null
        };

        try {
            const response = await apiRequest('PATCH', `/api/users/${userId}/`, formData);
            showAlert('Profile updated successfully', 'success');
            // Update displayed name in header if changed
            document.querySelectorAll('.user-name').forEach(el => {
                el.textContent = `${response.data.first_name} ${response.data.last_name}`;
            });
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
}

async function setupPasswordForm() {
    const form = document.getElementById('passwordForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (form.elements.new_password.value !== form.elements.confirm_password.value) {
            showAlert('New passwords do not match', 'error');
            return;
        }

        const formData = {
            old_password: form.elements.current_password.value,
            new_password: form.elements.new_password.value
        };

        try {
            await apiRequest('POST', `/api/users/${userId}/change_password/`, formData);
            showAlert('Password changed successfully', 'success');
            form.reset();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
}

async function setupAvatarUpload() {
    const input = document.getElementById('avatar-upload');

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            showAlert('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image size should be less than 5MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`/api/users/${userId}/avatar/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCSRFToken()
                }
            });

            if (!response.ok) {
                throw new Error('Failed to upload avatar');
            }

            const data = await response.json();
            document.querySelectorAll('.user-avatar').forEach(img => {
                img.src = data.avatar_url + '?' + new Date().getTime();
            });
            showAlert('Avatar updated successfully', 'success');
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
}

async function loadActivityLogs() {
    try {
        const response = await apiRequest('GET', `/api/users/${userId}/activity/`);
        renderActivityLogs(response.data);
    } catch (error) {
        showAlert('Failed to load activity logs', 'error');
    }
}

function renderActivityLogs(activities) {
    const tableBody = document.getElementById('activityTable');
    tableBody.innerHTML = '';

    activities.forEach(activity => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                ${activity.event}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                ${activity.ip_address}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div class="flex items-center">
                    <i class="fas ${getDeviceIcon(activity.user_agent)} mr-2"></i>
                    <span>${getDeviceName(activity.user_agent)}</span>
                </div>
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                ${new Date(activity.timestamp).toLocaleString()}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function getDeviceIcon(userAgent) {
    if (/mobile/i.test(userAgent)) return 'fa-mobile-alt';
    if (/tablet/i.test(userAgent)) return 'fa-tablet-alt';
    if (/windows/i.test(userAgent)) return 'fa-laptop';
    if (/macintosh/i.test(userAgent)) return 'fa-laptop';
    if (/linux/i.test(userAgent)) return 'fa-desktop';
    return 'fa-question-circle';
}

function getDeviceName(userAgent) {
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    if (/windows/i.test(userAgent)) return 'Windows PC';
    if (/macintosh/i.test(userAgent)) return 'Mac';
    if (/linux/i.test(userAgent)) return 'Linux PC';
    return 'Unknown Device';
}

async function setupAdminFeatures() {
    await loadUserRoles();

    document.getElementById('addRoleBtn').addEventListener('click', () => {
        openAddRoleModal();
    });

    document.getElementById('toggleStatusBtn').addEventListener('click', async () => {
        const newStatus = !userIsActive;
        const confirmed = await showConfirm(
            newStatus ? 'Enable Account' : 'Disable Account',
            `Are you sure you want to ${newStatus ? 'enable' : 'disable'} this account?`
        );

        if (confirmed) {
            try {
                await apiRequest('PATCH', `/api/users/${userId}/`, {
                    is_active: newStatus
                });
                window.location.reload();
            } catch (error) {
                showAlert(error.message, 'error');
            }
        }
    });
}

async function loadUserRoles() {
    try {
        const response = await apiRequest('GET', `/api/users/${userId}/roles/`);
        renderUserRoles(response.data);
    } catch (error) {
        showAlert('Failed to load user roles', 'error');
    }
}

function renderUserRoles(roles) {
    const container = document.getElementById('userRolesContainer');
    container.innerHTML = '';

    if (roles.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">No roles assigned</p>';
        return;
    }

    roles.forEach(role => {
        const roleElement = document.createElement('div');
        roleElement.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        roleElement.innerHTML = `
            <div>
                <h4 class="font-medium text-gray-900">${role.name}</h4>
                <p class="text-xs text-gray-500">${role.description || 'No description'}</p>
            </div>
            <button class="remove-role-btn text-red-600 hover:text-red-900" data-role-id="${role.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(roleElement);
    });

    document.querySelectorAll('.remove-role-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const roleId = btn.dataset.roleId;
            try {
                await apiRequest('DELETE', `/api/users/${userId}/roles/${roleId}/`);
                loadUserRoles();
                showAlert('Role removed successfully', 'success');
            } catch (error) {
                showAlert(error.message, 'error');
            }
        });
    });
}

async function openAddRoleModal() {
    try {
        const response = await apiRequest('GET', '/api/roles/');
        const roles = response.data.results.filter(role => !userRoles.includes(role.id));

        if (roles.length === 0) {
            showAlert('No available roles to assign', 'info');
            return;
        }

        const modalContent = document.createElement('div');
        modalContent.className = 'space-y-4';
        modalContent.innerHTML = `
            <p class="text-sm text-gray-500">Select a role to assign to this user</p>
            <div class="space-y-2 max-h-96 overflow-y-auto">
                ${roles.map(role => `
                    <div class="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer role-option" data-role-id="${role.id}">
                        <div class="min-w-0 flex-1">
                            <h4 class="text-sm font-medium text-gray-900">${role.name}</h4>
                            <p class="text-xs text-gray-500 truncate">${role.description || 'No description'}</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                `).join('')}
            </div>
        `;

        const modal = document.getElementById('addRoleModal');
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = '';
        modalBody.appendChild(modalContent);

        modal.querySelector('.modal-save').classList.add('hidden');

        document.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', async () => {
                const roleId = option.dataset.roleId;
                try {
                    await apiRequest('POST', `/api/users/${userId}/roles/`, {
                        role_id: roleId
                    });
                    closeModal('addRoleModal');
                    loadUserRoles();
                    showAlert('Role assigned successfully', 'success');
                } catch (error) {
                    showAlert(error.message, 'error');
                }
            });
        });

        openModal('addRoleModal');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function setup2FA() {
    document.getElementById('enable2faBtn').addEventListener('click', async () => {
        try {
            // Step 1: Initiate 2FA setup
            const response = await apiRequest('POST', '/api/auth/2fa/setup/');

            // Step 2: Show QR code and verification form in modal
            const modalContent = document.createElement('div');
            modalContent.className = 'space-y-6 text-center';
            modalContent.innerHTML = `
                <p class="text-sm text-gray-500">Scan this QR code with your authenticator app</p>
                <div class="flex justify-center">
                    <img src="${response.data.qr_code_url}" alt="QR Code" class="h-48 w-48">
                </div>
                <p class="text-xs text-gray-500">Or enter this secret key manually: <code class="bg-gray-100 px-1">${response.data.secret}</code></p>
                
                <div class="pt-4 border-t border-gray-200">
                    <p class="text-sm text-gray-500 mb-2">Enter the 6-digit code from your authenticator app</p>
                    <input type="text" id="totpCode" placeholder="123456" maxlength="6"
                           class="block w-32 mx-auto text-center text-lg tracking-widest rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <button id="verify2faBtn"
                            class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Verify & Enable
                    </button>
                </div>
            `;

            const modal = document.getElementById('addRoleModal'); // Reusing modal
            modal.querySelector('.modal-title').textContent = 'Set Up Two-Factor Authentication';
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = '';
            modalBody.appendChild(modalContent);

            modal.querySelector('.modal-save').classList.add('hidden');

            document.getElementById('verify2faBtn').addEventListener('click', async () => {
                const code = document.getElementById('totpCode').value;
                if (!code || code.length !== 6) {
                    showAlert('Please enter a valid 6-digit code', 'error');
                    return;
                }

                try {
                    await apiRequest('POST', '/api/auth/2fa/verify/', {
                        code: code,
                        secret: response.data.secret
                    });

                    closeModal('addRoleModal');
                    showAlert('Two-factor authentication enabled successfully', 'success');
                    document.getElementById('enable2faBtn').textContent = 'Disable 2FA';
                    document.getElementById('enable2faBtn').classList.remove('bg-green-600', 'hover:bg-green-700');
                    document.getElementById('enable2faBtn').classList.add('bg-red-600', 'hover:bg-red-700');
                } catch (error) {
                    showAlert('Invalid verification code', 'error');
                }
            });

            openModal('addRoleModal');
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
}