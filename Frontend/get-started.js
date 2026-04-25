/* ========================================
   Get Started Page - Interactive Features
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Get all buttons
    const signUpButtons = document.querySelectorAll('.btn-primary');
    const logInButtons = document.querySelectorAll('.btn-outline');
    const selectionCards = document.querySelectorAll('.selection-card');

    // Add click event listeners to Sign Up buttons
    signUpButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const cardType = this.closest('.selection-card').classList.contains('ngo-card') ? 'NGO' : 'User';
            console.log(`Sign Up clicked for ${cardType}`);
            // Navigate to signup page based on type
            // navigateToSignUp(cardType);
        });

        // Add ripple effect on click
        button.addEventListener('click', createRipple);
    });

    // Add click event listeners to Log In buttons
    logInButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const cardType = this.closest('.selection-card').classList.contains('ngo-card') ? 'NGO' : 'User';
            console.log(`Log In clicked for ${cardType}`);
            // Navigate to login page based on type
            // navigateToLogIn(cardType);
        });

        button.addEventListener('click', createRipple);
    });

    // Add keyboard interaction to cards
    selectionCards.forEach(card => {
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                // Optional: Focus the first button in the card
                const firstButton = this.querySelector('.btn');
                if (firstButton) {
                    firstButton.focus();
                }
            }
        });
    });

    // Smooth scroll to selection cards
    function scrollToSelectionCards() {
        const selectionCardsContainer = document.querySelector('.selection-cards');
        selectionCardsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Ripple effect function
    function createRipple(event) {
        const button = event.currentTarget;

        // Create ripple element
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        // Remove previous ripple if exists
        const previousRipple = button.querySelector('.ripple');
        if (previousRipple) {
            previousRipple.remove();
        }

        button.appendChild(ripple);
    }

    // Optional: Add animation to cards on scroll into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    selectionCards.forEach(card => {
        card.style.opacity = '0.9';
        card.style.transform = 'translateY(0)';
        observer.observe(card);
    });

    // Log initialization
    console.log('Get Started page initialized successfully');
});

/* ========================================
   Navigation Functions (Placeholder)
   ======================================== */

/**
 * Navigate to Sign Up page based on user type
 * @param {string} userType - 'NGO' or 'User'
 */
function navigateToSignUp(userType) {
    if (userType === 'NGO') {
        // window.location.href = '/signup/ngo';
        console.log('Navigating to NGO Sign Up');
    } else {
        // window.location.href = '/signup/user';
        console.log('Navigating to User Sign Up');
    }
}

/**
 * Navigate to Log In page based on user type
 * @param {string} userType - 'NGO' or 'User'
 */
function navigateToLogIn(userType) {
    if (userType === 'NGO') {
        // window.location.href = '/login/ngo';
        console.log('Navigating to NGO Log In');
    } else {
        // window.location.href = '/login/user';
        console.log('Navigating to User Log In');
    }
}

/**
 * Handle button click with analytics
 * @param {string} action - Action type (signup/login)
 * @param {string} userType - User type (ngo/user)
 */
function trackButtonClick(action, userType) {
    // This could be integrated with analytics services
    console.log(`Tracking: ${action} - ${userType}`);
    // Example: Send to analytics service
    // analytics.track('button_clicked', { action, userType });
}
