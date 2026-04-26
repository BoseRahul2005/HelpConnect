// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const userFeedPosts = Array.isArray(window.__HOME_FEED_POSTS__) ? window.__HOME_FEED_POSTS__ : [];
    const followedNgoStorageKey = 'madadsetu.followedNgos';

    function createNgoProfilePath(name) {
        const cleanedName = String(name || '').trim();

        return cleanedName ? `/ngo/profile/${encodeURIComponent(cleanedName)}` : '#';
    }

    function normalizeNgoKey(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    }

    function loadFollowedNgoKeys() {
        try {
            const parsedKeys = JSON.parse(window.localStorage.getItem(followedNgoStorageKey) || '[]');
            return Array.isArray(parsedKeys) ? parsedKeys : [];
        } catch {
            return [];
        }
    }

    function saveFollowedNgoKeys(keys) {
        window.localStorage.setItem(followedNgoStorageKey, JSON.stringify(keys));
    }

    function isNgoFollowed(name) {
        return loadFollowedNgoKeys().includes(normalizeNgoKey(name));
    }

    function setNgoFollowed(name, shouldFollow) {
        const normalizedName = normalizeNgoKey(name);
        const nextKeys = new Set(loadFollowedNgoKeys());

        if (shouldFollow) {
            nextKeys.add(normalizedName);
        } else {
            nextKeys.delete(normalizedName);
        }

        saveFollowedNgoKeys(Array.from(nextKeys));
        return nextKeys.has(normalizedName);
    }

    // Demo post data array
    const demoPosts = [
        {
            id: 1,
            ngoName: "Heart Care NGO",
            profileUrl: createNgoProfilePath("Heart Care NGO"),
            title: "Help Needed for Child Heart Surgery",
            description: "Young Arjun, age 8, needs urgent heart surgery to save his life. The procedure costs ₹25,000 and every contribution brings us closer to our goal.",
            raisedAmount: 18500,
            goalAmount: 25000,
            upvotes: 342,
            avatarColor: "avatar-green"
        },
        {
            id: 2,
            ngoName: "Education First",
            profileUrl: createNgoProfilePath("Education First"),
            title: "Build a School Library for Rural Children",
            description: "We're creating a library in a remote village school to provide access to quality education resources. Help us inspire young minds through reading.",
            raisedAmount: 12750,
            goalAmount: 20000,
            upvotes: 258,
            avatarColor: "avatar-blue"
        },
        {
            id: 3,
            ngoName: "Disaster Relief Fund",
            profileUrl: createNgoProfilePath("Disaster Relief Fund"),
            title: "Emergency Relief for Flood Victims",
            description: "Recent floods have displaced thousands of families. We urgently need funds for temporary shelter, food, and medical supplies for affected communities.",
            raisedAmount: 45200,
            goalAmount: 50000,
            upvotes: 521,
            avatarColor: "avatar-orange"
        },
        {
            id: 4,
            ngoName: "Wildlife Sanctuary",
            profileUrl: createNgoProfilePath("Wildlife Sanctuary"),
            title: "Protect Endangered Species",
            description: "Our sanctuary is working to preserve the habitats of endangered animals. Support us in protecting these magnificent creatures for future generations.",
            raisedAmount: 8900,
            goalAmount: 15000,
            upvotes: 187,
            avatarColor: "avatar-purple"
        },
        {
            id: 5,
            ngoName: "Healthcare Initiative",
            profileUrl: createNgoProfilePath("Healthcare Initiative"),
            title: "Free Medical Camp in Slums",
            description: "We're organizing a comprehensive medical camp to provide free healthcare checkups and medicines to underprivileged communities.",
            raisedAmount: 22300,
            goalAmount: 30000,
            upvotes: 445,
            avatarColor: "avatar-red"
        }
    ];

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>\"']/g, function(character) {
            const replacements = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };

            return replacements[character] || character;
        });
    }

    function getAvatarColor(seed) {
        const colors = ['avatar-green', 'avatar-blue', 'avatar-orange', 'avatar-purple', 'avatar-red'];
        const source = String(seed || 'community');
        let hash = 0;

        for (let index = 0; index < source.length; index += 1) {
            hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
        }

        return colors[hash % colors.length];
    }

    function normalizeUserPost(post) {
        const displayName = post.authorName || post.authorUsername || 'Community member';
        const fundraiserGoal = Number(post.fundRaiseGoal || 0);
        const hasFundraiserGoal = Boolean(post.isFundraiser) && fundraiserGoal > 0;

        return {
            id: `user-${post.id}`,
            ngoName: displayName,
            title: post.title || 'Community update',
            description: post.body || '',
            raisedAmount: 0,
            goalAmount: hasFundraiserGoal ? fundraiserGoal : 0,
            upvotes: 0,
            avatarColor: getAvatarColor(displayName),
            imageUrl: post.imageUrl || post.imagePath || '',
        };
    }

    function getFeedPosts() {
        return [...userFeedPosts.map(normalizeUserPost), ...demoPosts];
    }

    // Function to get avatar initials
    function getAvatarInitials(name) {
        return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    }

    // Function to format currency
    function formatCurrency(amount) {
        return '$' + Number(amount || 0).toLocaleString();
    }

    // Function to render posts
    function renderPosts() {
        const postsFeed = document.getElementById('postsFeed');
        const posts = getFeedPosts();
        
        postsFeed.innerHTML = posts.map(post => {
            const hasGoal = post.goalAmount > 0;
            const progressPercentage = hasGoal ? Math.min((post.raisedAmount / post.goalAmount) * 100, 100) : 0;
            const initials = getAvatarInitials(post.ngoName);
            const ngoName = escapeHtml(post.ngoName);
            const profileUrl = post.profileUrl ? escapeHtml(post.profileUrl) : '';
            const headerLeftMarkup = post.profileUrl
                ? `
                    <a class="post-author-link" href="${profileUrl}" aria-label="Open ${ngoName} profile">
                        <div class="post-avatar ${post.avatarColor}">
                            ${initials}
                        </div>
                        <span class="post-ngo-name">${ngoName}</span>
                    </a>
                `
                : `
                    <div class="post-avatar ${post.avatarColor}">
                        ${initials}
                    </div>
                    <span class="post-ngo-name">${ngoName}</span>
                `;
            const imageMarkup = post.imageUrl
                ? `
                    <div class="post-media">
                        <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}">
                    </div>
                `
                : '';
            const progressMarkup = hasGoal
                ? `
                    <div class="progress-section">
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${progressPercentage}%;"></div>
                        </div>
                        <div class="progress-metadata">
                            <span class="progress-raised">${formatCurrency(post.raisedAmount)} raised</span>
                            <span class="progress-goal">Goal: ${formatCurrency(post.goalAmount)}</span>
                        </div>
                    </div>
                `
                : '';
            
            return `
                <div class="post-card">
                    <!-- Post Header -->
                    <div class="post-header">
                        <div class="post-header-left">
                            ${headerLeftMarkup}
                        </div>
                        <button class="post-more-btn" aria-label="More options">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                        </button>
                    </div>

                    <!-- Post Body -->
                    <div class="post-body">
                        <h3 class="post-title">${escapeHtml(post.title)}</h3>
                        <p class="post-description">${escapeHtml(post.description)}</p>
                        ${imageMarkup}
                        ${progressMarkup}
                    </div>

                    <!-- Post Actions -->
                    <div class="post-actions">
                        <div class="post-actions-left">
                            <button class="btn-donate" data-post-id="${post.id}">Donate</button>
                            <button class="btn-learn-more" data-post-id="${post.id}">Learn More</button>
                        </div>
                        <button class="post-upvote" data-post-id="${post.id}" data-upvotes="${post.upvotes}">
                            <span class="upvote-icon">⇧</span> ${post.upvotes}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners after rendering
        attachPostEventListeners();
    }

    // Function to attach event listeners to posts
    function attachPostEventListeners() {
        // Donate button handlers
        document.querySelectorAll('.btn-donate').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const postId = this.getAttribute('data-post-id');
                console.log('Donate clicked for post:', postId);
                // Add your donation logic here
                alert(`Opening donation modal for post ${postId}`);
            });
        });

        // Learn More button handlers
        document.querySelectorAll('.btn-learn-more').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const postId = this.getAttribute('data-post-id');
                console.log('Learn More clicked for post:', postId);
                // Add your learn more logic here
                alert(`Opening details for post ${postId}`);
            });
        });

        // More button handlers
        document.querySelectorAll('.post-more-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('More options clicked');
                // Add your more options menu here
            });
        });

        // Upvote button handlers
        document.querySelectorAll('.post-upvote').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const postId = this.getAttribute('data-post-id');
                const isUpvoted = this.classList.contains('upvoted');
                
                if (isUpvoted) {
                    this.classList.remove('upvoted');
                    let count = parseInt(this.getAttribute('data-upvotes'));
                    count--;
                    this.setAttribute('data-upvotes', count);
                    this.innerHTML = `<span class="upvote-icon">⇧</span> ${count}`;
                } else {
                    this.classList.add('upvoted');
                    let count = parseInt(this.getAttribute('data-upvotes'));
                    count++;
                    this.setAttribute('data-upvotes', count);
                    this.innerHTML = `<span class="upvote-icon">⇧</span> ${count}`;
                }
                
                console.log('Upvote toggled for post:', postId);
            });
        });
    }

    // Function to format follower count
    function formatFollowers(count) {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toLocaleString();
    }

    // Right sidebar data
    const ngos = [
        { id: 1, name: 'Save The Children', followers: 12400 },
        { id: 2, name: 'GreenEarth Foundation', followers: 8950 },
        { id: 3, name: 'Helping Hands', followers: 15600 },
        { id: 4, name: 'MedAid Global', followers: 7200 }
    ];

    const urgentCases = [
        { id: 1, title: 'Earthquake Relief — Turkey', daysLeft: 3 },
        { id: 2, title: 'Child Heart Surgery Fund', daysLeft: 5 }
    ];

    // Function to render NGO list widget
    function renderNGOList() {
        const ngoList = document.getElementById('ngoList');
        if (!ngoList) return;

        ngoList.innerHTML = ngos.map(ngo => `
            <li class="ngo-item" data-ngo-name="${escapeHtml(ngo.name)}" data-followers-count="${Number(ngo.followers) || 0}">
                <div class="ngo-info">
                    <a class="ngo-link" href="${createNgoProfilePath(ngo.name)}" aria-label="Open ${escapeHtml(ngo.name)} profile">
                        <span class="ngo-name">${escapeHtml(ngo.name)}</span>
                        <span class="ngo-followers">${formatFollowers(ngo.followers)} followers</span>
                    </a>
                </div>
                <button class="btn-follow" type="button" data-ngo-id="${ngo.id}" data-ngo-name="${escapeHtml(ngo.name)}">Follow</button>
            </li>
        `).join('');

        // Attach follow button listeners
        document.querySelectorAll('.btn-follow').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const ngoName = this.getAttribute('data-ngo-name');
                const ngoItem = this.closest('.ngo-item');
                const isFollowing = this.classList.contains('following');
                const nextFollowing = setNgoFollowed(ngoName, !isFollowing);

                this.classList.toggle('following', nextFollowing);
                this.textContent = nextFollowing ? 'Following' : 'Follow';
                this.setAttribute('aria-pressed', nextFollowing ? 'true' : 'false');

                if (ngoItem) {
                    const followersLabel = ngoItem.querySelector('.ngo-followers');
                    const baseFollowers = Number(ngoItem.dataset.followersCount || 0);
                    const displayedFollowers = baseFollowers + (nextFollowing ? 1 : 0);

                    if (followersLabel) {
                        followersLabel.textContent = `${formatFollowers(displayedFollowers)} followers`;
                    }
                }

                console.log('Follow toggled for NGO:', ngoName);
            });

            const ngoName = btn.getAttribute('data-ngo-name');
            const ngoItem = btn.closest('.ngo-item');
            const isFollowing = isNgoFollowed(ngoName);

            btn.classList.toggle('following', isFollowing);
            btn.textContent = isFollowing ? 'Following' : 'Follow';
            btn.setAttribute('aria-pressed', isFollowing ? 'true' : 'false');

            if (ngoItem) {
                const followersLabel = ngoItem.querySelector('.ngo-followers');
                const baseFollowers = Number(ngoItem.dataset.followersCount || 0);
                const displayedFollowers = baseFollowers + (isFollowing ? 1 : 0);

                if (followersLabel) {
                    followersLabel.textContent = `${formatFollowers(displayedFollowers)} followers`;
                }
            }
        });
    }

    // Function to render urgent cases widget
    function renderUrgentCases() {
        const urgentCasesList = document.getElementById('urgentCasesList');
        if (!urgentCasesList) return;

        urgentCasesList.innerHTML = urgentCases.map(urgentCase => `
            <li class="urgent-case-item">
                <a href="#" class="urgent-case-link">${urgentCase.title}</a>
                <span class="urgent-case-badge">${urgentCase.daysLeft} days left</span>
            </li>
        `).join('');

        // Attach urgent case link listeners
        document.querySelectorAll('.urgent-case-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const caseTitle = this.textContent.trim();
                console.log('Urgent case clicked:', caseTitle);
                // Add your logic to handle urgent case click
                alert(`Opening details for: ${caseTitle}`);
            });
        });
    }

    // Function to attach CTA button listener
    function attachCTAListener() {
        const ctaBtn = document.querySelector('.btn-start-giving');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Start Giving button clicked');
                alert('Redirecting to donation page...');
                // window.location.href = '/donate';
            });
        }
    }

    // Render posts on page load
    renderPosts();
    renderNGOList();
    renderUrgentCases();
    attachCTAListener();

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navContainer = document.querySelector('.nav-container');
    
    // Sidebar elements
    const sidebar = document.querySelector('.sidebar');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sidebarClose = document.querySelector('.sidebar-close');
    const sidebarToggle = document.querySelector('.sidebar-toggle');

    // Sidebar toggle button handler
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            openSidebar();
        });
    }
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            console.log('Sidebar link clicked:', this.textContent.trim());
            // Add your navigation logic here
            
            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Function to open sidebar
    function openSidebar() {
        sidebar.classList.add('active');
    }

    // Function to close sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
    }

    // Sidebar close button handler
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        const isMobileView = window.innerWidth <= 768;
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnNavBar = navContainer.contains(event.target);
        
        if (isMobileView && !isClickInsideSidebar && !isClickOnNavBar && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    // Optional: Add a toggle button for sidebar on mobile (you can add a hamburger icon to navbar)
    // This allows opening sidebar from navbar if needed
    window.toggleSidebar = function() {
        sidebar.classList.toggle('active');
    };

    // Close sidebar on Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

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
        link.addEventListener('click', function(e) {
            // Don't prevent default for link navigation
            if (this.tagName === 'A' && this.getAttribute('href')) {
                // Allow the link to navigate
                return true;
            }
            
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
    const signupBtns = document.querySelectorAll('button.btn-primary');
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
