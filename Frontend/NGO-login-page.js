/* ========================================
   NGO Log In Form - Script
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('ngoLoginForm');
    const submitButton = document.querySelector('.btn-submit');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Real-time validation
    addRealTimeValidation();

    // Load saved email if "Remember Me" was checked
    loadSavedEmail();

    /**
     * Add real-time validation to form fields
     */
    function addRealTimeValidation() {
        const inputs = form.querySelectorAll('.form-input');

        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                validateField(this);
            });

            input.addEventListener('change', function () {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });

            input.addEventListener('input', function () {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
    }

    /**
     * Validate individual field
     */
    function validateField(field) {
        clearError(field);

        const fieldName = field.name;
        const fieldValue = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'email':
                if (!fieldValue) {
                    errorMessage = 'Email address is required';
                    isValid = false;
                } else if (!isValidEmail(fieldValue)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;

            case 'password':
                if (!fieldValue) {
                    errorMessage = 'Password is required';
                    isValid = false;
                } else if (fieldValue.length < 1) {
                    errorMessage = 'Password cannot be empty';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            showError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Handle form submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        // Clear previous errors
        emailInput.classList.remove('error');
        passwordInput.classList.remove('error');

        // Validate all required fields
        let emailValid = validateField(emailInput);
        let passwordValid = validateField(passwordInput);

        if (!emailValid || !passwordValid) {
            console.log('Form validation failed');
            return;
        }

        // Show loading state
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        // Collect form data
        const formData = {
            email: emailInput.value.trim(),
            password: passwordInput.value,
            rememberMe: rememberMeCheckbox.checked
        };

        // Save email if remember me is checked
        if (formData.rememberMe) {
            localStorage.setItem('helpconnect_ngo_email', formData.email);
            localStorage.setItem('helpconnect_remember_me', 'true');
        } else {
            localStorage.removeItem('helpconnect_ngo_email');
            localStorage.removeItem('helpconnect_remember_me');
        }

        // Log form data (replace with actual API call)
        console.log('Login attempt with data:', {
            email: formData.email,
            rememberMe: formData.rememberMe
        });

        // Simulate API call
        setTimeout(() => {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;

            // Check for successful login (in real app, this comes from API)
            if (isValidCredentials(formData.email, formData.password)) {
                showSuccessMessage();
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                // Show error
                showLoginError();
            }
        }, 1500);
    }

    /**
     * Load saved email from localStorage
     */
    function loadSavedEmail() {
        const savedEmail = localStorage.getItem('helpconnect_ngo_email');
        const rememberMe = localStorage.getItem('helpconnect_remember_me');

        if (savedEmail && rememberMe === 'true') {
            emailInput.value = savedEmail;
            rememberMeCheckbox.checked = true;
        }
    }

    /**
     * Show error for field
     */
    function showError(field, message) {
        field.classList.add('error');

        const errorElement = document.getElementById(field.name + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    /**
     * Clear error for field
     */
    function clearError(field) {
        field.classList.remove('error');

        const errorElement = document.getElementById(field.name + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    /**
     * Show success message
     */
    function showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.textContent = '✓ Login successful! Redirecting...';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #10b981;
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
            font-weight: 600;
        `;

        document.body.appendChild(message);
    }

    /**
     * Show login error message
     */
    function showLoginError() {
        const errorElement = document.getElementById('passwordError');
        if (errorElement) {
            errorElement.textContent = 'Invalid email or password. Please try again.';
            passwordInput.classList.add('error');
        }

        const message = document.createElement('div');
        message.className = 'error-notification';
        message.textContent = '✗ Invalid email or password';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #dc2626;
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
            font-weight: 600;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 4000);
    }

    /* ========================================
       Validation Helper Functions
       ======================================== */

    /**
     * Check if email is valid
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Mock function to check credentials
     * In a real app, this would be replaced with an API call
     */
    function isValidCredentials(email, password) {
        // For demo purposes, accept test credentials
        // In production, validate against backend
        if (email && password && password.length > 0) {
            // Mock successful login for demo
            console.log('Credentials accepted (mock)');
            return true;
        }
        return false;
    }

    // Log initialization
    console.log('NGO Login form initialized');
});

/* ========================================
   Animation for messages
   ======================================== */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(style);
