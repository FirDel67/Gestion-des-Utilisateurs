document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        if (!validateForm()) return;

        const formData = new FormData(form);  // This will automatically include the CSRF token

        try {
            const response = await fetch('http://127.0.0.1:8000/api/users/', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('User registered successfully!', 'success');
                setTimeout(() => {
                    window.location.href = "/";
                }, 3000);
            } else {
                if (data && typeof data === 'object') {
                    displayFormErrors(data);
                } else {
                    showAlert('Registration failed. Please try again.', 'error');
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
        const password = form.elements.password.value;
        const password2 = form.elements.password2.value;

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

        if (password.length < 8) {
            showError('password', 'Password must be at least 8 characters.');
            isValid = false;
        }

        if (password !== password2) {
            showError('password2', 'Passwords do not match.');
            isValid = false;
        }

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
        alertBox.className = `p-4 rounded mb-4 text-sm font-medium ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`;
        alertBox.textContent = message;
        form.parentNode.insertBefore(alertBox, form);

        setTimeout(() => alertBox.remove(), 4000);
    }
});
