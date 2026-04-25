// ========================================
// Form Elements
// ========================================
const form = document.getElementById('signupForm');
const nameInput = document.getElementById('name');
const usernameInput = document.getElementById('username');
const emailOrMobileInput = document.getElementById('emailOrMobile');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const monthSelect = document.getElementById('month');
const daySelect = document.getElementById('day');
const yearSelect = document.getElementById('year');

const nameError = document.getElementById('nameError');
const usernameError = document.getElementById('usernameError');
const emailOrMobileError = document.getElementById('emailOrMobileError');
const passwordError = document.getElementById('passwordError');
const birthdayError = document.getElementById('birthdayError');

// ========================================
// Populate Year Dropdown
// ========================================
function populateYears() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    
    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// ========================================
// Check if Leap Year
// ========================================
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// ========================================
// Get Days in Month
// ========================================
function getDaysInMonth(month, year) {
    const daysInMonth = {
        '01': 31,
        '02': isLeapYear(year) ? 29 : 28,
        '03': 31,
        '04': 30,
        '05': 31,
        '06': 30,
        '07': 31,
        '08': 31,
        '09': 30,
        '10': 31,
        '11': 30,
        '12': 31
    };
    return daysInMonth[month] || 0;
}

// ========================================
// Update Day Dropdown
// ========================================
function updateDayDropdown() {
    const selectedMonth = monthSelect.value;
    const selectedYear = yearSelect.value;
    const currentDay = daySelect.value;

    daySelect.innerHTML = '<option value="">Day</option>';

    if (selectedMonth && selectedYear) {
        const daysInMonth = getDaysInMonth(selectedMonth, parseInt(selectedYear));
        
        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = String(day).padStart(2, '0');
            option.textContent = String(day).padStart(2, '0');
            daySelect.appendChild(option);
        }

        if (currentDay && parseInt(currentDay) <= daysInMonth) {
            daySelect.value = currentDay;
        }
    }
}

// ========================================
// Password Toggle
// ========================================
togglePasswordBtn.addEventListener('click', function (e) {
    e.preventDefault();
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
});

// ========================================
// Month and Year Change Listeners
// ========================================
monthSelect.addEventListener('change', updateDayDropdown);
yearSelect.addEventListener('change', updateDayDropdown);

// ========================================
// Field Validation Functions
// ========================================
function validateName(name) {
    const trimmed = name.trim();
    if (!trimmed) {
        nameError.textContent = 'Name is required';
        nameInput.classList.add('error');
        return false;
    }
    if (trimmed.length < 2) {
        nameError.textContent = 'Name must be at least 2 characters';
        nameInput.classList.add('error');
        return false;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
        nameError.textContent = 'Name can only contain letters, spaces, hyphens, and apostrophes';
        nameInput.classList.add('error');
        return false;
    }
    nameError.textContent = '';
    nameInput.classList.remove('error');
    return true;
}

function validateUsername(username) {
    const trimmed = username.trim();
    if (!trimmed) {
        usernameError.textContent = 'Username is required';
        usernameInput.classList.add('error');
        return false;
    }
    if (trimmed.length < 3) {
        usernameError.textContent = 'Username must be at least 3 characters';
        usernameInput.classList.add('error');
        return false;
    }
    if (trimmed.length > 20) {
        usernameError.textContent = 'Username must be at most 20 characters';
        usernameInput.classList.add('error');
        return false;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
        usernameError.textContent = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
        usernameInput.classList.add('error');
        return false;
    }
    usernameError.textContent = '';
    usernameInput.classList.remove('error');
    return true;
}

function validateEmailOrMobile(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        emailOrMobileError.textContent = 'Email or mobile number is required';
        emailOrMobileInput.classList.add('error');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s+\-()]{10,}$/;

    const isValidEmail = emailRegex.test(trimmed);
    const isValidPhone = phoneRegex.test(trimmed);

    if (!isValidEmail && !isValidPhone) {
        emailOrMobileError.textContent = 'Please enter a valid email address or phone number';
        emailOrMobileInput.classList.add('error');
        return false;
    }

    emailOrMobileError.textContent = '';
    emailOrMobileInput.classList.remove('error');
    return true;
}

function validatePassword(password) {
    if (!password) {
        passwordError.textContent = 'Password is required';
        passwordInput.classList.add('error');
        return false;
    }
    if (password.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters';
        passwordInput.classList.add('error');
        return false;
    }
    passwordError.textContent = '';
    passwordInput.classList.remove('error');
    return true;
}

function validateBirthday(month, day, year) {
    if (!month || !day || !year) {
        birthdayError.textContent = 'Please select a valid date';
        return false;
    }

    const birthDate = new Date(year, parseInt(month) - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 13) {
        birthdayError.textContent = 'You must be at least 13 years old';
        return false;
    }

    birthdayError.textContent = '';
    return true;
}

// ========================================
// Real-time Validation
// ========================================
nameInput.addEventListener('input', function () {
    validateName(this.value);
});

usernameInput.addEventListener('input', function () {
    validateUsername(this.value);
});

emailOrMobileInput.addEventListener('input', function () {
    validateEmailOrMobile(this.value);
});

passwordInput.addEventListener('input', function () {
    validatePassword(this.value);
});

// ========================================
// Success Notification
// ========================================
function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        ${message}
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        z-index: 1000;
        animation: slideDown 0.3s ease-out;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// Add CSS Animations
// ========================================
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
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }

    .success-notification {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .notification-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }
`;
document.head.appendChild(style);

// ========================================
// Form Submission
// ========================================
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = nameInput.value;
    const username = usernameInput.value;
    const emailOrMobile = emailOrMobileInput.value;
    const password = passwordInput.value;
    const month = monthSelect.value;
    const day = daySelect.value;
    const year = yearSelect.value;

    const isNameValid = validateName(name);
    const isUsernameValid = validateUsername(username);
    const isEmailOrMobileValid = validateEmailOrMobile(emailOrMobile);
    const isPasswordValid = validatePassword(password);
    const isBirthdayValid = validateBirthday(month, day, year);

    if (isNameValid && isUsernameValid && isEmailOrMobileValid && isPasswordValid && isBirthdayValid) {
        const signupData = {
            name,
            username,
            emailOrMobile,
            password,
            birthday: `${year}-${month}-${day}`
        };

        localStorage.setItem('suSignupData', JSON.stringify(signupData));
        showSuccessMessage('Account created successfully! Redirecting...');

        setTimeout(() => {
            window.location.href = 'get-started.html';
        }, 2000);
    }
});

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    populateYears();
});
