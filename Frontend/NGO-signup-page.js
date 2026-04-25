/* ========================================
   NGO Sign Up Form - Script
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('ngoSignupForm');
    const submitButton = document.querySelector('.btn-submit');
    const foundingMonthSelect = document.getElementById('foundingMonth');
    const foundingDaySelect = document.getElementById('foundingDay');
    const foundingYearSelect = document.getElementById('foundingYear');

    // Initialize date selectors
    initializeDateSelectors();

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Real-time validation
    addRealTimeValidation();

    // Populate day dropdown based on month and year selection
    foundingMonthSelect.addEventListener('change', updateDayOptions);
    foundingYearSelect.addEventListener('change', updateDayOptions);

    /**
     * Initialize date selectors with proper options
     */
    function initializeDateSelectors() {
        // Populate year dropdown (current year and 50 years back)
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 100; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            foundingYearSelect.appendChild(option);
        }

        // Initial day population
        updateDayOptions();
    }

    /**
     * Update day options based on selected month and year
     */
    function updateDayOptions() {
        const selectedMonth = parseInt(foundingMonthSelect.value);
        const selectedYear = parseInt(foundingYearSelect.value);
        const currentValue = foundingDaySelect.value;

        // Clear existing options (except first placeholder)
        while (foundingDaySelect.options.length > 1) {
            foundingDaySelect.remove(1);
        }

        // Determine number of days in month
        let daysInMonth = 31;
        if (selectedMonth === 0 || !selectedMonth) {
            // No month selected
            foundingDaySelect.disabled = true;
            return;
        } else if ([4, 6, 9, 11].includes(selectedMonth)) {
            daysInMonth = 30;
        } else if (selectedMonth === 2) {
            // Check for leap year
            const isLeapYear = (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || (selectedYear % 400 === 0);
            daysInMonth = isLeapYear ? 29 : 28;
        }

        // Populate days
        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = String(day).padStart(2, '0');
            option.textContent = day;
            foundingDaySelect.appendChild(option);
        }

        foundingDaySelect.disabled = false;

        // Restore previous selection if valid
        if (currentValue && currentValue <= daysInMonth) {
            foundingDaySelect.value = currentValue;
        }
    }

    /**
     * Add real-time validation to form fields
     */
    function addRealTimeValidation() {
        const inputs = form.querySelectorAll('.form-input, .form-select, .form-select-date');

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

        // Checkbox validation
        const checkbox = form.querySelector('.form-checkbox');
        checkbox.addEventListener('change', function () {
            if (this.classList.contains('error')) {
                validateField(this);
            }
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
            case 'orgName':
                if (!fieldValue) {
                    errorMessage = 'Organization name is required';
                    isValid = false;
                } else if (fieldValue.length < 3) {
                    errorMessage = 'Organization name must be at least 3 characters';
                    isValid = false;
                } else if (fieldValue.length > 100) {
                    errorMessage = 'Organization name must not exceed 100 characters';
                    isValid = false;
                }
                break;

            case 'email':
                if (!fieldValue) {
                    errorMessage = 'Email address is required';
                    isValid = false;
                } else if (!isValidEmail(fieldValue)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;

            case 'phone':
                if (!fieldValue) {
                    errorMessage = 'Phone number is required';
                    isValid = false;
                } else if (!isValidPhone(fieldValue)) {
                    errorMessage = 'Please enter a valid phone number';
                    isValid = false;
                }
                break;

            case 'orgType':
                if (!fieldValue) {
                    errorMessage = 'Please select an organization type';
                    isValid = false;
                }
                break;

            case 'website':
                if (fieldValue && !isValidURL(fieldValue)) {
                    errorMessage = 'Please enter a valid website URL';
                    isValid = false;
                }
                break;

            case 'password':
                if (!fieldValue) {
                    errorMessage = 'Password is required';
                    isValid = false;
                } else if (fieldValue.length < 8) {
                    errorMessage = 'Password must be at least 8 characters';
                    isValid = false;
                } else if (!isStrongPassword(fieldValue)) {
                    errorMessage = 'Password must contain uppercase, lowercase, number, and special character';
                    isValid = false;
                }
                break;

            case 'confirmPassword':
                const password = form.querySelector('[name="password"]').value;
                if (!fieldValue) {
                    errorMessage = 'Please confirm your password';
                    isValid = false;
                } else if (fieldValue !== password) {
                    errorMessage = 'Passwords do not match';
                    isValid = false;
                }
                break;

            case 'foundingMonth':
            case 'foundingDay':
            case 'foundingYear':
                validateDate();
                return;
        }

        if (!isValid) {
            showError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Validate date fields
     */
    function validateDate() {
        const month = foundingMonthSelect.value;
        const day = foundingDaySelect.value;
        const year = foundingYearSelect.value;
        const dateError = document.getElementById('dateError');

        clearError(foundingMonthSelect);
        clearError(foundingDaySelect);
        clearError(foundingYearSelect);
        dateError.textContent = '';

        if (!month || !day || !year) {
            const errorMessage = 'Please select a complete founding date';
            showError(foundingMonthSelect, '');
            dateError.textContent = errorMessage;
            return false;
        }

        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();

        if (selectedDate > today) {
            const errorMessage = 'Founding date cannot be in the future';
            dateError.textContent = errorMessage;
            return false;
        }

        return true;
    }

    /**
     * Handle form submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        // Validate all required fields
        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        // Show loading state
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Log form data (replace with actual API call)
        console.log('Form submitted with data:', data);

        // Simulate API call
        setTimeout(() => {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;

            // Show success message
            showSuccessMessage();

            // Reset form
            form.reset();
            initializeDateSelectors();
        }, 2000);
    }

    /**
     * Validate entire form
     */
    function validateForm() {
        const inputs = form.querySelectorAll('.form-input, .form-select, .form-select-date');
        let isFormValid = true;

        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        // Validate date separately
        if (!validateDate()) {
            isFormValid = false;
        }

        // Validate checkbox
        const checkbox = form.querySelector('.form-checkbox');
        if (!checkbox.checked) {
            showError(checkbox, 'You must agree to the terms to continue');
            isFormValid = false;
        }

        return isFormValid;
    }

    /**
     * Show error for field
     */
    function showError(field, message) {
        field.classList.add('error');

        // Find associated error message element
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
        message.textContent = '✓ NGO account created successfully! Redirecting...';
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
        `;

        document.body.appendChild(message);

        // Remove message after 3 seconds
        setTimeout(() => {
            message.remove();
        }, 3000);
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
     * Check if phone number is valid
     */
    function isValidPhone(phone) {
        // Accept various phone formats
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        const digitsOnly = phone.replace(/\D/g, '');
        return phoneRegex.test(phone) && digitsOnly.length >= 10;
    }

    /**
     * Check if URL is valid
     */
    function isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if password is strong
     */
    function isStrongPassword(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    }

    // Log initialization
    console.log('NGO Sign Up form initialized');
});

/* ========================================
   Animation for success message
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
