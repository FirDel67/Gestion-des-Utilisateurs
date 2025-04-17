document.addEventListener('DOMContentLoaded', function () {
    // Registration form handling
    if (document.getElementById('registerForm')) {
        setupRegistrationForm();
    }

    // Password reset form handling
    if (document.getElementById('passwordResetForm')) {
        setupPasswordResetForm();
    }

    // Password reset confirmation handling
    if (document.getElementById('passwordResetConfirmForm')) {
        setupPasswordResetConfirmForm();
    }
});

function setupRegistrationForm() {
    const form = document.getElementById('registerForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        alert("Submitting register form")

        // Clear previous errors
        clearErrors();

        // Validate form
        if (!validateRegistrationForm()) {
            return;
        }

        // Prepare form data
        const formData = new FormData(form); // Create FormData from the form element

        // Optionally, you can add other fields if needed
        formData.append('first_name', form.elements.first_name.value);
        formData.append('last_name', form.elements.last_name.value);
        formData.append('email', form.elements.email.value);
        formData.append('password', form.elements.password.value);
        formData.append('password2', form.elements.password2.value);
        const profileImage = form.elements.profile_image.files[0];
        if (profileImage) {
            formData.append('profile_image', profileImage);
        }

        try {
            const response = await apiRequest('POST', '/api/auth/register/', formData);

            if (response.success) {
                showAlert('Registration successful! Please check your email to verify your account.', 'success');
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = "{% static 'user_list' %}";
                }, 3000);
            }
        } catch (error) {
            if (error.errors) {
                displayFormErrors(error.errors);
            } else {
                showAlert(error.message || 'Registration failed. Please try again.', 'error');
            }
        }
    });
}

function validateRegistrationForm() {
    let isValid = true;
    const form = document.getElementById('registerForm');

    // Validate first name
    if (!form.elements.first_name.value.trim()) {
        showError('first_name', 'First name is required');
        isValid = false;
    }

    // Validate last name
    if (!form.elements.last_name.value.trim()) {
        showError('last_name', 'Last name is required');
        isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.elements.email.value)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }

    // Validate password
    if (form.elements.password.value.length < 8) {
        showError('password', 'Password must be at least 8 characters');
        isValid = false;
    }

    // Validate password match
    if (form.elements.password.value !== form.elements.password2.value) {
        showError('password2', 'Passwords do not match');
        isValid = false;
    }

    // Validate terms
    if (!form.elements.terms.checked) {
        showError('terms', 'You must agree to the terms and conditions');
        isValid = false;
    }

    const profileImage = form.elements.profile_image.files[0];
    if (!profileImage) {
        showError('profile_image', 'Please upload a profile image');
        isValid = false;
    }

    return isValid;
}

function setupPasswordResetForm() {
    const form = document.getElementById('passwordResetForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email = form.elements.email.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            showError('email', 'Please enter a valid email address');
            return;
        }

        try {
            const response = await apiRequest('POST', '/api/auth/password/reset/', { email });

            showAlert('Password reset link sent to your email. Please check your inbox.', 'success');
            // Redirect to login after 5 seconds
            setTimeout(() => {
                window.location.href = "/account/login/";
            }, 5000);
        } catch (error) {
            if (error.errors) {
                displayFormErrors(error.errors);
            } else {
                showAlert(error.message || 'Failed to send reset link. Please try again.', 'error');
            }
        }
    });
}

function setupPasswordResetConfirmForm() {
    const form = document.getElementById('passwordResetConfirmForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const newPassword1 = form.elements.new_password1.value;
        const newPassword2 = form.elements.new_password2.value;

        // Validate passwords
        if (newPassword1.length < 8) {
            showError('new_password1', 'Password must be at least 8 characters');
            return;
        }

        if (newPassword1 !== newPassword2) {
            showError('new_password2', 'Passwords do not match');
            return;
        }

        const formData = {
            uid: form.elements.uid.value,
            token: form.elements.token.value,
            new_password1: newPassword1,
            new_password2: newPassword2
        };

        try {
            const response = await apiRequest('POST', '/api/auth/password/reset/confirm/', formData);

            showAlert('Password changed successfully! You can now login with your new password.', 'success');
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = "/account/login/";
            }, 3000);
        } catch (error) {
            if (error.errors) {
                displayFormErrors(error.errors);
            } else {
                showAlert(error.message || 'Failed to reset password. The link may have expired.', 'error');
            }
        }
    });
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}_error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function clearErrors() {
    document.querySelectorAll('[id$="_error"]').forEach(el => {
        el.classList.add('hidden');
    });
}

function displayFormErrors(errors) {
    for (const field in errors) {
        if (errors.hasOwnProperty(field)) {
            showError(field, errors[field].join(' '));
        }
    }
}