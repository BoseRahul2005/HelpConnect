// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navContainer = document.querySelector('.nav-container');

    // Toggle mobile menu on button click
    mobileMenuToggle.addEventListener('click', function() {
        mobileMenuToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        
        // Update aria-expanded for accessibility
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navContainer.contains(event.target) || 
                                 mobileMenu.contains(event.target) ||
                                 mobileMenuToggle.contains(event.target);
        
        if (!isClickInsideNav && mobileMenu.classList.contains('active')) {
            mobileMenuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Close mobile menu when a link is clicked
    const mobileMenuLinks = mobileMenu.querySelectorAll('a, button');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Don't close for search input
            if (this.tagName !== 'INPUT') {
                mobileMenuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Handle search functionality
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    console.log('Search query:', query);
                    // Add your search functionality here
                    // Example: window.location.href = `/search?q=${encodeURIComponent(query)}`;
                }
            }
        });
    });

    // Handle notification clicks
    const notificationBtns = document.querySelectorAll('[aria-label="Notifications"]');
    notificationBtns.forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Notifications clicked');
            // Add your notification functionality here
        });
    });

    // Handle profile clicks
    const profileBtns = document.querySelectorAll('[aria-label="User Profile"]');
    profileBtns.forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Profile clicked');
            // Add your profile functionality here
        });
    });

    // Handle Log In button
    const loginBtns = document.querySelectorAll('.btn-outline');
    loginBtns.forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Log In clicked');
            // Add your login functionality here
            // Example: window.location.href = '/login';
        });
    });

    // Handle Sign Up button
    const signupBtns = document.querySelectorAll('.btn-primary');
    signupBtns.forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Sign Up clicked');
            // Add your signup functionality here
            // Example: window.location.href = '/signup';
        });
    });

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Handle keyboard navigation (Escape key to close mobile menu)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
            mobileMenuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    });
});

// Helper function to debounce search input
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Implement live search if needed
const liveSearchHandler = debounce(function(query) {
    if (query.length > 2) {
        console.log('Performing live search for:', query);
        // Add your live search API call here
    }
}, 300);

document.querySelectorAll('.search-input').forEach(input => {
    input.addEventListener('input', function() {
        liveSearchHandler(this.value);
    });
});
