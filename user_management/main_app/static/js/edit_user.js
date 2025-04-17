document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('editUserForm');
    if (!form) return;

    const userId = form.dataset.userId;  // Make sure to set data-user-id in template
    populateFormWithUserData(userId)
    const updateUrl = `http://127.0.0.1:8000/api/users/${userId}/`;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        if (!validateForm()) return;

        const formData = new FormData(form);

        try {
            const response = await fetch(updateUrl, {
                method: 'PATCH',
                body: formData,
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('User updated successfully!', 'success');
                setTimeout(() => {
                    window.location.href = "/";
                }, 3000);
            } else {
                if (data && typeof data === 'object') {
                    displayFormErrors(data);
                } else {
                    showAlert('Update failed. Please try again.', 'error');
                }
            }
        } catch (error) {
            console.error(error);
            showAlert('An unexpected error occurred.', 'error');
        }
    });

    function validateForm() {
        let isValid = true;

        const firstName = form.elements.first_name.value.trim();
        const lastName = form.elements.last_name.value.trim();
        const phone = form.elements.phone.value.trim();
        const email = form.elements.email.value.trim();
        // const password = form.elements.password.value;
        // const password2 = form.elements.password2.value;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!firstName) {
            showError('first_name', 'First name is required.');
            isValid = false;
        }

        if (!lastName) {
            showError('last_name', 'Last name is required.');
            isValid = false;
        }

        if (!email || !emailRegex.test(email)) {
            showError('email', 'Enter a valid email address.');
            isValid = false;
        }

        // if (password || password2) {
        //     if (password.length < 8) {
        //         showError('password', 'Password must be at least 8 characters.');
        //         isValid = false;
        //     }

        //     if (password !== password2) {
        //         showError('password2', 'Passwords do not match.');
        //         isValid = false;
        //     }
        // }

        if (!phone) {
            showError('phone_number', 'Phone Number is required.');
            isValid = false;
        }

        return isValid;
    }

    function showError(fieldId, message) {
        const el = document.getElementById(`${fieldId}_error`);
        if (el) {
            el.textContent = message;
            el.classList.remove('hidden');
        }
    }

    function clearErrors() {
        document.querySelectorAll('[id$="_error"]').forEach(el => {
            el.textContent = '';
            el.classList.add('hidden');
        });
    }

    function displayFormErrors(errors) {
        for (const field in errors) {
            if (Array.isArray(errors[field])) {
                showError(field, errors[field].join(' '));
            } else {
                showError(field, errors[field]);
            }
        }
    }

    function showAlert(message, type = 'success') {
        const alertBox = document.createElement('div');
        alertBox.className = `p-4 rounded mb-4 text-sm font-medium ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        alertBox.textContent = message;
        form.parentNode.insertBefore(alertBox, form);

        setTimeout(() => alertBox.remove(), 4000);
    }

    async function populateFormWithUserData(userId) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data.');
            }

            const user = await response.json();

            // Fill the form fields
            const form = document.getElementById('editUserForm');
            if (!form) return;

            form.elements.first_name.value = user.first_name || '';
            form.elements.last_name.value = user.last_name || '';
            form.elements.email.value = user.email || '';
            form.elements.phone.value = user.phone || '';

            // Optional: display existing profile image if available
            if (user.profile && user.profile !== '') {
                const imgPreview = document.createElement('img');
                imgPreview.src = user.profile;
                imgPreview.alt = 'Current Profile Image';
                imgPreview.classList.add('mt-2', 'w-24', 'h-24', 'rounded-full', 'object-cover');

                const profileField = document.getElementById('profile_image');
                profileField.parentNode.appendChild(imgPreview);
            }

        } catch (error) {
            console.error('Error populating form:', error);
            alert('Could not load user data.');
        }
    }

});
