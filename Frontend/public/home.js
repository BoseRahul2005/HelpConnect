// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const userFeedPosts = Array.isArray(window.__HOME_FEED_POSTS__) ? window.__HOME_FEED_POSTS__ : [];
    const allFeedPosts = Array.isArray(window.__HOME_ALL_FEED_POSTS__) ? window.__HOME_ALL_FEED_POSTS__ : [];
    const ngoAccounts = Array.isArray(window.__HOME_NGO_ACCOUNTS__) ? window.__HOME_NGO_ACCOUNTS__ : [];
    const singleUsers = Array.isArray(window.__HOME_SINGLE_USERS__) ? window.__HOME_SINGLE_USERS__ : [];
    const demoPostsFromServer = Array.isArray(window.__HOME_DEMO_POSTS__) ? window.__HOME_DEMO_POSTS__ : [];
    const popularNgoFeedProfiles = Array.isArray(window.__HOME_POPULAR_NGO_PROFILES__) ? window.__HOME_POPULAR_NGO_PROFILES__ : [];
    const followedNgoStorageKey = 'madadsetu.followedNgos';
    const postsFeed = document.getElementById('postsFeed');
    const feedTitleNode = document.querySelector('[data-feed-title]');
    const feedBreadcrumbNode = document.querySelector('[data-feed-breadcrumb]');
    const searchInputNodes = Array.from(document.querySelectorAll('.search-input'));
    const searchDropdownNodes = Array.from(document.querySelectorAll('[data-search-dropdown]'));
    const pageMode = window.__PAGE_MODE__ || 'home';
    const isSearchPage = pageMode === 'search';
    const searchPageSize = 8;
    const searchDebounceDelay = 300;
    const searchResultScrollThreshold = 280;
    const searchState = {
        query: String(window.__SEARCH_QUERY__ || '').trim(),
        selected: String(window.__SEARCH_SELECTED__ || '').trim(),
        currentResults: [],
        visibleCount: searchPageSize,
        isLoading: false,
        pendingRequestId: 0,
        correction: '',
        activeInput: null,
        activeFeedMode: 'posts',
        dropdownOpen: false,
        lastRenderedQuery: '',
    };

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

    function formatCompactNumber(count) {
        const numericCount = Number(count || 0);

        if (numericCount >= 1000000) {
            return `${(numericCount / 1000000).toFixed(numericCount >= 10000000 ? 0 : 1)}M`;
        }

        if (numericCount >= 1000) {
            return `${(numericCount / 1000).toFixed(numericCount >= 10000 ? 0 : 1)}K`;
        }

        return numericCount.toLocaleString('en-US');
    }

    // Demo post data array
    const demoPosts = demoPostsFromServer.length ? demoPostsFromServer : [
        {
            id: 'demo-1',
            ngoName: "Heart Care NGO",
            profileUrl: createNgoProfilePath("Heart Care NGO"),
            detailUrl: '/post/demo-1',
            title: "Help Needed for Child Heart Surgery",
            description: "Young Arjun, age 8, needs urgent heart surgery to save his life. The procedure costs ₹25,000 and every contribution brings us closer to our goal.",
            raisedAmount: 18500,
            goalAmount: 25000,
            upvotes: 342,
            avatarColor: "avatar-green",
            paymentAccount: {
                upiId: 'heartcare@upi',
                bankName: 'HDFC Bank',
                accountLast4: '1024',
                ifsc: 'HDFC0001024',
            },
            submittedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
            id: 'demo-2',
            ngoName: "Education First",
            profileUrl: createNgoProfilePath("Education First"),
            detailUrl: '/post/demo-2',
            title: "Build a School Library for Rural Children",
            description: "We're creating a library in a remote village school to provide access to quality education resources. Help us inspire young minds through reading.",
            raisedAmount: 12750,
            goalAmount: 20000,
            upvotes: 258,
            avatarColor: "avatar-blue",
            paymentAccount: {
                upiId: 'educationfirst@upi',
                bankName: 'ICICI Bank',
                accountLast4: '4451',
                ifsc: 'ICIC0004451',
            },
            submittedAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
            id: 'demo-3',
            ngoName: "Disaster Relief Fund",
            profileUrl: createNgoProfilePath("Disaster Relief Fund"),
            detailUrl: '/post/demo-3',
            title: "Emergency Relief for Flood Victims",
            description: "Recent floods have displaced thousands of families. We urgently need funds for temporary shelter, food, and medical supplies for affected communities.",
            raisedAmount: 45200,
            goalAmount: 50000,
            upvotes: 521,
            avatarColor: "avatar-orange",
            paymentAccount: {
                upiId: 'disasterrelief@upi',
                bankName: 'State Bank of India',
                accountLast4: '7612',
                ifsc: 'SBIN0007612',
            },
            submittedAt: new Date(Date.now() - 259200000).toISOString(),
        },
        {
            id: 'demo-4',
            ngoName: "Wildlife Sanctuary",
            profileUrl: createNgoProfilePath("Wildlife Sanctuary"),
            detailUrl: '/post/demo-4',
            title: "Protect Endangered Species",
            description: "Our sanctuary is working to preserve the habitats of endangered animals. Support us in protecting these magnificent creatures for future generations.",
            raisedAmount: 8900,
            goalAmount: 15000,
            upvotes: 187,
            avatarColor: "avatar-purple",
            paymentAccount: {
                upiId: 'wildlife@upi',
                bankName: 'Axis Bank',
                accountLast4: '2309',
                ifsc: 'UTIB0002309',
            },
            submittedAt: new Date(Date.now() - 345600000).toISOString(),
        },
        {
            id: 'demo-5',
            ngoName: "Healthcare Initiative",
            profileUrl: createNgoProfilePath("Healthcare Initiative"),
            detailUrl: '/post/demo-5',
            title: "Free Medical Camp in Slums",
            description: "We're organizing a comprehensive medical camp to provide free healthcare checkups and medicines to underprivileged communities.",
            raisedAmount: 22300,
            goalAmount: 30000,
            upvotes: 445,
            avatarColor: "avatar-red",
            paymentAccount: {
                upiId: 'healthcare@upi',
                bankName: 'Kotak Mahindra Bank',
                accountLast4: '9091',
                ifsc: 'KKBK0009091',
            },
            submittedAt: new Date(Date.now() - 432000000).toISOString(),
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
        const hashtags = Array.from(new Set(
            String([post.title, post.body].filter(Boolean).join(' '))
                .match(/#[\w-]+/g) || []
        ));

        return {
            id: `user-${post.id}`,
            sourcePostId: Number(post.id) || post.id,
            ngoName: displayName,
            authorName: displayName,
            authorUsername: post.authorUsername || '',
            title: post.title || 'Community update',
            description: post.body || '',
            raisedAmount: 0,
            goalAmount: hasFundraiserGoal ? fundraiserGoal : 0,
            upvotes: 0,
            avatarColor: getAvatarColor(displayName),
            imageUrl: post.imageUrl || post.imagePath || '',
            detailUrl: `/post/${post.id}`,
            submittedAt: post.submittedAt || '',
            hashtags,
        };
    }

    function getFeedPosts() {
        return [...userFeedPosts.map(normalizeUserPost), ...demoPosts];
    }

    function hashString(value) {
        const source = String(value || 'madadsetu');
        let hash = 0;

        for (let index = 0; index < source.length; index += 1) {
            hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
        }

        return hash;
    }

    function pickFromList(seed, values) {
        if (!Array.isArray(values) || values.length === 0) {
            return null;
        }

        return values[seed % values.length];
    }

    function buildNgoPaymentProfile(post) {
        const ngoName = String(post.ngoName || post.authorName || 'Community Impact').trim() || 'Community Impact';
        const seed = hashString(ngoName);
        const fallbackUpi = `${normalizeNgoKey(ngoName)}@madadsetu`;
        const bankOptions = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'];
        const bankName = pickFromList(seed, bankOptions) || 'HDFC Bank';
        const accountLast4 = String(1000 + (seed % 9000));

        return {
            ngoName,
            summary: String(post.description || post.title || 'Supporting local communities with urgent care.').trim(),
            avatarColor: post.avatarColor || getAvatarColor(ngoName),
            avatarInitials: getAvatarInitials(ngoName),
            upiId: post.paymentAccount?.upiId || fallbackUpi,
            bankName: post.paymentAccount?.bankName || bankName,
            accountLast4: post.paymentAccount?.accountLast4 || accountLast4,
            ifsc: post.paymentAccount?.ifsc || 'MADAD0001',
        };
    }

    // Function to get avatar initials
    function getAvatarInitials(name) {
        return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    }

    // Function to format currency
    function formatCurrency(amount) {
        return '$' + Number(amount || 0).toLocaleString();
    }

    function normalizePopularNgoProfile(profile, index) {
        const orgName = String(profile.orgName || profile.name || profile.ngoName || '').trim();

        if (!orgName) {
            return null;
        }

        const totalUpvotes = Number(profile.totalUpvotes ?? profile.upvotes ?? 0) || 0;
        const followerCount = Number(profile.followerCount ?? profile.followers ?? profile.supporters ?? 0) || 0;
        const postCount = Number(profile.postCount ?? profile.postsCount ?? profile.activePostCount ?? 0) || 0;
        const highlightTitle = String(profile.highlightTitle || profile.title || 'Community update').trim() || 'Community update';
        const fallbackSummary = 'Leading community action with every update.';
        const highlightSummary = String(profile.highlightSummary || profile.summary || profile.description || fallbackSummary).trim() || fallbackSummary;

        return {
            id: profile.id || `popular-ngo-${index}`,
            orgName,
            profileUrl: profile.profileUrl || createNgoProfilePath(orgName),
            orgTypeLabel: String(profile.orgTypeLabel || profile.orgType || 'Organization').trim() || 'Organization',
            avatarColor: profile.avatarColor || getAvatarColor(orgName),
            avatarInitials: profile.avatarInitials || getAvatarInitials(orgName),
            totalUpvotes,
            followerCount,
            postCount,
            highlightTitle,
            highlightSummary,
            websiteLabel: String(profile.websiteLabel || '').trim(),
            rankLabel: String(profile.rankLabel || '').trim(),
        };
    }

    function buildFallbackPopularNgoProfiles() {
        return demoPosts
            .map((post) => {
                const matchingNgo = ngos.find((ngo) => normalizeNgoKey(ngo.name) === normalizeNgoKey(post.ngoName));

                return {
                    id: `demo-${post.id}`,
                    orgName: post.ngoName,
                    profileUrl: post.profileUrl || createNgoProfilePath(post.ngoName),
                    orgTypeLabel: matchingNgo ? 'Featured NGO' : 'Organization',
                    avatarColor: post.avatarColor || getAvatarColor(post.ngoName),
                    avatarInitials: getAvatarInitials(post.ngoName),
                    totalUpvotes: Number(post.upvotes) || 0,
                    followerCount: matchingNgo ? Number(matchingNgo.followers) || 0 : 0,
                    postCount: 1,
                    highlightTitle: post.title,
                    highlightSummary: post.description,
                    websiteLabel: '',
                };
            })
            .sort((left, right) => Number(right.totalUpvotes || 0) - Number(left.totalUpvotes || 0));
    }

    function getPopularNgoProfiles() {
        const sourceProfiles = popularNgoFeedProfiles.length ? popularNgoFeedProfiles : buildFallbackPopularNgoProfiles();

        return sourceProfiles
            .map(normalizePopularNgoProfile)
            .filter(Boolean)
            .sort((left, right) => {
                const upvoteDiff = Number(right.totalUpvotes || 0) - Number(left.totalUpvotes || 0);

                if (upvoteDiff !== 0) {
                    return upvoteDiff;
                }

                const followerDiff = Number(right.followerCount || 0) - Number(left.followerCount || 0);

                if (followerDiff !== 0) {
                    return followerDiff;
                }

                return String(left.orgName).localeCompare(String(right.orgName));
            })
            .map((profile, index) => ({
                ...profile,
                rank: index + 1,
                rankLabel: `#${index + 1}`,
            }));
    }

    const searchCauseCatalog = [
        {
            key: 'education',
            label: 'Education',
            description: 'School access, literacy drives, scholarships, and learning support.',
            aliases: ['school', 'learning', 'literacy', 'students', 'books', 'classroom', 'tuition'],
            trendScore: 220,
        },
        {
            key: 'healthcare',
            label: 'Healthcare',
            description: 'Medical camps, treatment, medicine, and health support.',
            aliases: ['health', 'medical', 'clinic', 'hospital', 'medicine', 'surgery', 'care'],
            trendScore: 250,
        },
        {
            key: 'environment',
            label: 'Environment',
            description: 'Climate action, tree planting, sustainability, and conservation.',
            aliases: ['green', 'climate', 'trees', 'nature', 'wildlife', 'sustainability', 'conservation'],
            trendScore: 210,
        },
        {
            key: 'animal-welfare',
            label: 'Animal Welfare',
            description: 'Animal rescue, shelters, veterinary care, and wildlife protection.',
            aliases: ['animal', 'animals', 'pets', 'rescue', 'sanctuary', 'species', 'wildlife'],
            trendScore: 185,
        },
        {
            key: 'disaster-relief',
            label: 'Disaster Relief',
            description: 'Flood, earthquake, emergency, and crisis response support.',
            aliases: ['disaster', 'relief', 'emergency', 'flood', 'earthquake', 'storm', 'cyclone'],
            trendScore: 240,
        },
        {
            key: 'community-development',
            label: 'Community Development',
            description: 'Local infrastructure, neighborhood action, and rural support.',
            aliases: ['community', 'local', 'neighborhood', 'village', 'villages', 'rural', 'development'],
            trendScore: 165,
        },
        {
            key: 'women-empowerment',
            label: 'Women Empowerment',
            description: 'Safety, opportunity, and support for women and girls.',
            aliases: ['women', 'woman', 'girls', 'safety', 'rights', 'empowerment'],
            trendScore: 190,
        },
        {
            key: 'children-welfare',
            label: 'Children Welfare',
            description: 'Child protection, nutrition, education, and wellbeing.',
            aliases: ['children', 'child', 'kids', 'youth', 'nutrition'],
            trendScore: 175,
        },
        {
            key: 'humanitarian-aid',
            label: 'Humanitarian Aid',
            description: 'Urgent support for displacement, crises, and recovery.',
            aliases: ['humanitarian', 'aid', 'support', 'help', 'volunteer', 'relief'],
            trendScore: 235,
        },
    ];

    const searchSynonyms = {
        aid: ['help', 'support', 'donation'],
        donation: ['support', 'help', 'aid', 'contribution'],
        help: ['support', 'aid', 'donation'],
        support: ['help', 'aid', 'donation'],
        school: ['education', 'learning', 'students'],
        medical: ['healthcare', 'clinic', 'hospital'],
        health: ['healthcare', 'medical', 'clinic'],
        green: ['environment', 'tree', 'nature'],
        animal: ['animals', 'wildlife', 'rescue'],
        flood: ['disaster', 'relief', 'emergency'],
        earthquake: ['disaster', 'relief', 'emergency'],
    };

    const searchCityPool = [
        'Mumbai, India',
        'Delhi, India',
        'Bengaluru, India',
        'Chennai, India',
        'Hyderabad, India',
        'Pune, India',
        'Kolkata, India',
        'Ahmedabad, India',
    ];

    const searchNgoTypeLabels = {
        education: 'Education',
        healthcare: 'Healthcare',
        environment: 'Environment',
        humanitarian: 'Humanitarian Aid',
        community: 'Community Development',
        women: 'Women Empowerment',
        children: 'Children Welfare',
        other: 'Organization',
    };

    let searchCatalogCache = null;

    function normalizeSearchText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function escapeRegExp(value) {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function tokenizeSearchText(value) {
        const normalizedValue = normalizeSearchText(value);

        if (!normalizedValue) {
            return [];
        }

        return normalizedValue.split(' ').filter(Boolean);
    }

    function hashSearchText(value) {
        const source = String(value || 'madadsetu');
        let hash = 0;

        for (let index = 0; index < source.length; index += 1) {
            hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
        }

        return hash;
    }

    function getSearchLocationLabel(seedValue) {
        const normalizedSeed = hashSearchText(seedValue) % searchCityPool.length;

        return searchCityPool[normalizedSeed] || searchCityPool[0];
    }

    function getSearchNgoTypeLabel(orgType) {
        return searchNgoTypeLabels[String(orgType || '').trim().toLowerCase()] || 'Organization';
    }

    function getSearchCauseKeyFromOrgType(orgType) {
        const normalizedType = String(orgType || '').trim().toLowerCase();
        const typeToCauseKey = {
            education: 'education',
            healthcare: 'healthcare',
            environment: 'environment',
            humanitarian: 'disaster-relief',
            community: 'community-development',
            women: 'women-empowerment',
            children: 'children-welfare',
            other: 'community-development',
        };

        return typeToCauseKey[normalizedType] || '';
    }

    function getCauseKeyForText(value) {
        const normalizedText = normalizeSearchText(value);

        if (!normalizedText) {
            return [];
        }

        const matchedKeys = [];

        searchCauseCatalog.forEach((cause) => {
            const causeTokens = [cause.label, cause.key, ...(cause.aliases || [])]
                .map((term) => normalizeSearchText(term))
                .filter(Boolean);

            if (causeTokens.some((term) => normalizedText.includes(term))) {
                matchedKeys.push(cause.key);
            }
        });

        return Array.from(new Set(matchedKeys));
    }

    function getSearchTopPost(posts) {
        const normalizedPosts = Array.isArray(posts) ? posts : [];

        return normalizedPosts
            .map((post, index) => {
                const title = String(post.title || post.heading || '').trim();
                const body = String(post.body || post.description || '').trim();
                const submittedAtValue = new Date(post.submittedAt || post.createdAt || post.date || Date.now() - index * 86400000).getTime();
                const upvoteValue = Number(post.upvoteCount || post.upvotes || post.votes || 0) || 0;

                return {
                    title,
                    body,
                    submittedAtValue,
                    upvoteValue,
                };
            })
            .sort((left, right) => (right.upvoteValue - left.upvoteValue) || (right.submittedAtValue - left.submittedAtValue))[0] || null;
    }

    function normalizeSearchNgoSource(source) {
        if (!source) {
            return null;
        }

        const orgName = String(source.orgName || source.name || source.org_name || source.org || '').trim();

        if (!orgName) {
            return null;
        }

        const posts = Array.isArray(source.posts) ? source.posts : [];
        const followers = Array.isArray(source.followers) ? source.followers : [];
        const upvoted = Array.isArray(source.upvoted) ? source.upvoted : [];
        const topPost = getSearchTopPost(posts);
        const orgType = String(source.orgType || source.org_type || source.category || source.type || 'other').trim().toLowerCase();
        const typeLabel = getSearchNgoTypeLabel(orgType);
        const locationLabel = String(source.location || source.city || source.address || '').trim() || getSearchLocationLabel(orgName);
        const website = String(source.website || '').trim();
        const followerCount = Number(source.followerCount || followers.length || 0) || 0;
        const postCount = Number(source.postCount || source.activePostCount || posts.length || 0) || 0;
        const totalUpvotes = Number(source.totalUpvotes || (topPost ? topPost.upvoteValue : 0) || upvoted.length || 0) || 0;
        const recentAt = new Date(source.updatedAt || source.submittedAt || topPost?.submittedAt || Date.now()).getTime();
        const summary = String(source.highlightSummary || topPost?.body || source.description || `Supporting communities through ${typeLabel.toLowerCase()}.`).trim();
        const title = orgName;
        const subtitle = [typeLabel, locationLabel].filter(Boolean).join(' · ');
        const keywords = [
            orgName,
            orgType,
            typeLabel,
            locationLabel,
            website,
            summary,
            topPost?.title || '',
            ...(Array.isArray(source.searchKeywords) ? source.searchKeywords : []),
        ].filter(Boolean);

        return {
            id: `ngo:${normalizeNgoKey(orgName)}`,
            type: 'ngo',
            typeLabel: 'NGO',
            title,
            subtitle,
            excerpt: summary,
            detailUrl: source.profileUrl || createNgoProfilePath(orgName),
            avatarColor: source.avatarColor || getAvatarColor(orgName),
            avatarInitials: source.avatarInitials || getAvatarInitials(orgName),
            popularityScore: totalUpvotes * 4 + followerCount * 2 + postCount * 8,
            recencyScore: Math.max(0, 5000 - Math.floor(Math.max(0, Date.now() - recentAt) / 86400000) * 160),
            recentAt,
            causeKeys: Array.from(new Set([
                getSearchCauseKeyFromOrgType(orgType),
                ...getCauseKeyForText(keywords.join(' ')),
            ].filter(Boolean))),
            searchText: normalizeSearchText(keywords.join(' ')),
            keywords: Array.from(new Set(keywords.map((value) => normalizeSearchText(value)).filter(Boolean))),
            metaLabel: `${formatCompactNumber(followerCount)} followers`,
            activityLabel: topPost ? 'Recently active' : 'Trending NGO',
            sourceLabel: 'ngo',
        };
    }

    function normalizeSearchUserSource(source, index) {
        if (!source) {
            return null;
        }

        const userName = String(source.name || '').trim();
        const userUsername = String(source.username || '').trim();

        if (!userName && !userUsername) {
            return null;
        }

        const displayName = userName;
        const submittedAt = source.submittedAt || new Date(Date.now() - index * 86400000).toISOString();
        const submittedAtValue = new Date(submittedAt).getTime();
        const profilePictureUrl = source.profilePictureUrl || null;
        const nameTokens = displayName ? displayName.split(/\s+/).filter(Boolean) : [];

        return {
            id: `user:${userUsername}`,
            type: 'user',
            typeLabel: 'User',
            title: displayName,
            subtitle: userUsername ? `@${userUsername}` : 'Community member',
            excerpt: `${displayName}${userUsername ? ` (@${userUsername})` : ''} is an active community member`,
            detailUrl: `/user/profile/${encodeURIComponent(userUsername)}`,
            imageUrl: profilePictureUrl,
            avatarColor: getAvatarColor(displayName),
            avatarInitials: getAvatarInitials(displayName),
            popularityScore: 50,
            recencyScore: Math.max(0, 3000 - Math.floor(Math.max(0, Date.now() - submittedAtValue) / 86400000) * 100),
            recentAt: submittedAtValue,
            causeKeys: [],
            searchText: normalizeSearchText([displayName, userUsername].filter(Boolean).join(' ')),
            keywords: Array.from(new Set([displayName, userUsername, ...nameTokens].filter(Boolean).map((value) => normalizeSearchText(value)))),
            metaLabel: 'Community member',
            activityLabel: 'User profile',
            sourceLabel: 'user',
        };
    }

    function normalizeSearchPostSource(source, index) {
        if (!source) {
            return null;
        }

        const rawTitle = String(source.title || source.heading || '').trim();
        const rawBody = String(source.body || source.description || source.caption || '').trim();
        const title = rawTitle || 'Community update';
        const body = rawBody || 'No details available yet.';
        const authorName = String(source.authorName || source.authorUsername || source.ngoName || source.displayName || 'Community member').trim() || 'Community member';
        const authorUsername = String(source.authorUsername || '').trim();
        const postId = source.sourcePostId || source.id || `demo-${index}`;
        const numericPostId = Number(postId);
        const isNumericPostId = Number.isInteger(numericPostId) && numericPostId > 0;
        const detailUrl = String(source.detailUrl || (isNumericPostId ? `/post/${numericPostId}` : `/post/${postId}`)).trim();
        const imageUrl = source.imageUrl || source.imagePath || null;
        const rawTags = Array.isArray(source.tags) ? source.tags : Array.from(new Set((String([title, body].join(' ')).match(/#[\w-]+/g) || [])));
        const searchText = normalizeSearchText([title, body, authorName, authorUsername, rawTags.join(' ')].filter(Boolean).join(' '));
        const submittedAt = source.submittedAt || source.createdAt || source.date || new Date(Date.now() - index * 86400000).toISOString();
        const submittedAtValue = new Date(submittedAt).getTime();
        const upvoteCount = Number(source.upvotes || source.upvoteCount || source.votes || 0) || 0;
        const goalAmount = Number(source.goalAmount || source.fundRaiseGoal || 0) || 0;
        const causeKeys = Array.from(new Set(getCauseKeyForText(searchText)));
        const hashtags = rawTags.filter(Boolean);

        return {
            id: `post:${postId}`,
            type: 'post',
            typeLabel: 'Post',
            title,
            subtitle: authorUsername ? `@${authorUsername}` : authorName,
            excerpt: body,
            detailUrl,
            imageUrl,
            popularityScore: upvoteCount * 10 + (goalAmount > 0 ? 30 : 0) + (imageUrl ? 20 : 0),
            recencyScore: Math.max(0, 7000 - Math.floor(Math.max(0, Date.now() - submittedAtValue) / 86400000) * 200),
            recentAt: submittedAtValue,
            causeKeys,
            searchText,
            keywords: Array.from(new Set([title, body, authorName, authorUsername, ...hashtags].map((value) => normalizeSearchText(value)).filter(Boolean))),
            metaLabel: upvoteCount > 0 ? `${formatCompactNumber(upvoteCount)} upvotes` : 'Recent post',
            activityLabel: goalAmount > 0 ? 'Fundraiser' : 'Community update',
            sourceLabel: source.id && String(source.id).startsWith('demo-') ? 'demo-post' : 'post',
            hashtags,
        };
    }

    function normalizeSearchCauseSource(cause, index) {
        if (!cause) {
            return null;
        }

        const key = String(cause.key || cause.label || '').trim().toLowerCase();
        const matchedCause = searchCauseCatalog.find((item) => item.key === key) || cause;
        const title = String(matchedCause.label || cause.label || '').trim();
        const description = String(matchedCause.description || cause.description || '').trim();

        if (!key || !title) {
            return null;
        }

        const detailUrl = `/search?q=${encodeURIComponent(title)}&selected=cause:${encodeURIComponent(key)}`;

        return {
            id: `cause:${key}`,
            type: 'cause',
            typeLabel: 'Cause',
            title,
            subtitle: description,
            excerpt: description,
            detailUrl,
            popularityScore: Number(matchedCause.trendScore || 0) + Math.max(0, 200 - index * 10),
            recencyScore: 0,
            recentAt: 0,
            causeKeys: [key],
            searchText: normalizeSearchText([title, description, ...(matchedCause.aliases || [])].join(' ')),
            keywords: Array.from(new Set([title, description, ...(matchedCause.aliases || [])].map((value) => normalizeSearchText(value)).filter(Boolean))),
            metaLabel: 'Cause feed',
            activityLabel: 'Feed filter',
            sourceLabel: 'cause',
            causeKey: key,
        };
    }

    function getSearchCatalog() {
        if (searchCatalogCache) {
            return searchCatalogCache;
        }

        const entries = [];
        const seenIds = new Set();

        function addEntry(entry) {
            if (!entry || !entry.id || seenIds.has(entry.id)) {
                return;
            }

            seenIds.add(entry.id);
            entries.push(entry);
        }

        const ngoSources = ngoAccounts.length
            ? ngoAccounts
            : popularNgoFeedProfiles.length
                ? popularNgoFeedProfiles
                : ngos.map((ngo) => ({
                    orgName: ngo.name,
                    followers: [],
                    posts: [],
                    orgType: 'other',
                    profileUrl: createNgoProfilePath(ngo.name),
                }));

        ngoSources.forEach((ngo, index) => addEntry(normalizeSearchNgoSource(ngo, index)));
        popularNgoFeedProfiles.forEach((profile, index) => addEntry(normalizeSearchNgoSource(profile, index + ngoSources.length)));

        const postSources = [...allFeedPosts, ...demoPosts];
        postSources.forEach((post, index) => addEntry(normalizeSearchPostSource(post, index + 1)));

        singleUsers.forEach((user, index) => addEntry(normalizeSearchUserSource(user, index + 1)));

        searchCauseCatalog.forEach((cause, index) => addEntry(normalizeSearchCauseSource(cause, index + 1)));

        const vocabulary = Array.from(new Set(
            entries.flatMap((entry) => [
                ...(entry.keywords || []),
                ...tokenizeSearchText(entry.title),
                ...tokenizeSearchText(entry.subtitle),
                ...tokenizeSearchText(entry.excerpt),
                ...(entry.hashtags || []).map((tag) => normalizeSearchText(tag)),
            ]).filter(Boolean))
        );

        searchCatalogCache = {
            entries,
            vocabulary,
        };

        return searchCatalogCache;
    }

    function parseSearchSelection(value) {
        const normalizedValue = String(value || '').trim();

        if (!normalizedValue) {
            return {
                type: '',
                key: '',
                label: '',
            };
        }

        const separatorIndex = normalizedValue.indexOf(':');
        const normalizedSelectionValue = normalizeSearchText(normalizedValue);

        if (separatorIndex === -1) {
            const matchedCause = searchCauseCatalog.find((cause) => normalizeSearchText(cause.label) === normalizedSelectionValue || cause.key === normalizedSelectionValue.replace(/\s+/g, '-')) || null;

            return {
                type: 'cause',
                key: (matchedCause ? matchedCause.key : normalizedSelectionValue).replace(/\s+/g, '-'),
                label: matchedCause ? matchedCause.label : normalizedValue,
            };
        }

        const selectionType = normalizeSearchText(normalizedValue.slice(0, separatorIndex));
        const selectionKey = normalizeSearchText(normalizedValue.slice(separatorIndex + 1)).replace(/\s+/g, '-');
        const matchedCause = selectionType === 'cause'
            ? searchCauseCatalog.find((cause) => cause.key === selectionKey || normalizeSearchText(cause.label) === selectionKey.replace(/-/g, ' ')) || null
            : null;

        return {
            type: selectionType,
            key: selectionKey,
            label: matchedCause ? matchedCause.label : normalizedValue,
        };
    }

    function buildSearchQueryContext(query) {
        const normalizedQuery = normalizeSearchText(query);
        const tokens = tokenizeSearchText(query);
        const catalog = getSearchCatalog();
        const vocabulary = catalog.vocabulary;
        const expandedTokens = [];
        const correctedTokens = [];
        const selection = parseSearchSelection(searchState.selected);

        tokens.forEach((token) => {
            const synonyms = searchSynonyms[token] || [];
            synonyms.forEach((synonym) => {
                if (!expandedTokens.includes(synonym)) {
                    expandedTokens.push(synonym);
                }
            });

            let bestCandidate = token;
            let bestDistance = Number.POSITIVE_INFINITY;

            vocabulary.forEach((candidate) => {
                if (!candidate || candidate.length < 3) {
                    return;
                }

                const distance = levenshteinDistance(token, candidate);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestCandidate = candidate;
                }
            });

            if (bestCandidate !== token && bestDistance <= 2) {
                correctedTokens.push(bestCandidate);
            } else {
                correctedTokens.push(token);
            }
        });

        const searchTerms = Array.from(new Set([
            ...tokens,
            ...expandedTokens,
            ...correctedTokens,
        ].filter(Boolean)));
        const correctedQuery = normalizeSearchText(correctedTokens.join(' '));

        return {
            normalizedQuery,
            tokens,
            expandedTokens,
            correctedTokens,
            correctedQuery,
            highlightTerms: searchTerms,
            selection,
            hasCorrection: Boolean(correctedQuery && correctedQuery !== normalizedQuery),
            searchTerms,
            vocabulary,
        };
    }

    function levenshteinDistance(leftValue, rightValue) {
        const leftText = String(leftValue || '');
        const rightText = String(rightValue || '');
        const leftLength = leftText.length;
        const rightLength = rightText.length;

        if (!leftLength) {
            return rightLength;
        }

        if (!rightLength) {
            return leftLength;
        }

        const matrix = Array.from({ length: leftLength + 1 }, () => Array(rightLength + 1).fill(0));

        for (let leftIndex = 0; leftIndex <= leftLength; leftIndex += 1) {
            matrix[leftIndex][0] = leftIndex;
        }

        for (let rightIndex = 0; rightIndex <= rightLength; rightIndex += 1) {
            matrix[0][rightIndex] = rightIndex;
        }

        for (let leftIndex = 1; leftIndex <= leftLength; leftIndex += 1) {
            for (let rightIndex = 1; rightIndex <= rightLength; rightIndex += 1) {
                const substitutionCost = leftText[leftIndex - 1] === rightText[rightIndex - 1] ? 0 : 1;
                matrix[leftIndex][rightIndex] = Math.min(
                    matrix[leftIndex - 1][rightIndex] + 1,
                    matrix[leftIndex][rightIndex - 1] + 1,
                    matrix[leftIndex - 1][rightIndex - 1] + substitutionCost,
                );
            }
        }

        return matrix[leftLength][rightLength];
    }

    function scoreSearchEntry(entry, queryContext) {
        const selection = queryContext.selection;
        const queryText = queryContext.normalizedQuery;
        const searchableText = entry.searchText || '';
        const titleText = normalizeSearchText(entry.title);
        const selectionMatches = !selection.key || (selection.type === 'cause' && entry.causeKeys.includes(selection.key)) || (selection.type === 'ngo' && entry.type === 'ngo' && titleText.includes(selection.key)) || (selection.type === 'post' && entry.type === 'post' && normalizeSearchText(entry.id).includes(selection.key)) || (selection.type === 'user' && entry.type === 'user' && titleText.includes(selection.key));

        if (!selectionMatches) {
            return null;
        }

        if (!queryText && selection.key) {
            const rankingScore = (entry.popularityScore || 0) + (entry.recencyScore || 0) + (selection.type === 'cause' && entry.causeKeys.includes(selection.key) ? 200 : 0);

            return {
                ...entry,
                matchTier: entry.type === 'cause' ? 1 : 2,
                rankingScore,
                matchedTerms: queryContext.highlightTerms,
            };
        }

        if (!queryText && !selection.key) {
            const rankingScore = (entry.popularityScore || 0) + (entry.recencyScore || 0);
            return {
                ...entry,
                matchTier: 4,
                rankingScore,
                matchedTerms: [],
            };
        }

        const exactMatch = queryText && (titleText === queryText || searchableText === queryText || titleText.startsWith(queryText));
        const phraseMatch = queryText && searchableText.includes(queryText);
        const directHits = Array.from(new Set([
            ...queryContext.tokens,
            ...queryContext.expandedTokens,
            ...queryContext.correctedTokens,
        ].filter((token) => token && searchableText.includes(token))));

        let fuzzyMatch = false;

        if (!exactMatch && !phraseMatch && !directHits.length && queryText) {
            fuzzyMatch = queryContext.vocabulary.some((candidate) => queryContext.tokens.some((token) => levenshteinDistance(token, candidate) <= 2));
        }

        let matchTier = 5;

        if (exactMatch) {
            matchTier = 0;
        } else if (phraseMatch || titleText.startsWith(queryText)) {
            matchTier = 1;
        } else if (directHits.length) {
            matchTier = 2;
        } else if (fuzzyMatch) {
            matchTier = 3;
        } else {
            return null;
        }

        const selectionBoost = (selection.type === 'cause' && entry.causeKeys.includes(selection.key)) || (selection.type === 'user' && entry.type === 'user') ? 200 : 0;
        const matchBoost = directHits.length * 20 + (exactMatch ? 120 : phraseMatch ? 60 : 0);
        const rankingScore = (entry.popularityScore || 0) + (entry.recencyScore || 0) + matchBoost + selectionBoost;

        return {
            ...entry,
            matchTier,
            rankingScore,
            matchedTerms: directHits.length ? directHits : queryContext.highlightTerms,
        };
    }

    function runSearchCatalog(query, options = {}) {
        const queryContext = buildSearchQueryContext(query);
        const catalogEntries = getSearchCatalog().entries;
        const filteredEntries = catalogEntries
            .map((entry) => scoreSearchEntry(entry, queryContext))
            .filter(Boolean)
            .sort((left, right) => (
                (left.matchTier - right.matchTier)
                || (right.rankingScore - left.rankingScore)
                || (right.recentAt - left.recentAt)
                || String(left.title).localeCompare(String(right.title))
            ));

        const offset = Math.max(0, Number(options.offset || 0));
        const limit = Math.max(1, Number(options.limit || searchPageSize));
        const pagedEntries = filteredEntries.slice(offset, offset + limit);

        return {
            queryContext,
            totalCount: filteredEntries.length,
            hasMore: offset + limit < filteredEntries.length,
            nextOffset: offset + pagedEntries.length,
            results: pagedEntries,
        };
    }

    function updateFeedHeader(mode) {
        if (feedTitleNode) {
            feedTitleNode.textContent = mode === 'popular-ngos' ? 'Popular NGOs' : 'Feed';
        }

        if (feedBreadcrumbNode) {
            feedBreadcrumbNode.textContent = mode === 'popular-ngos'
                ? '• Ranked by total post upvotes'
                : '• Trending causes near you';
        }
    }

    function getSearchStateModeLabel() {
        return isSearchPage ? 'Search results' : 'Search preview';
    }

    function highlightSearchMarkup(value, terms) {
        const sourceText = String(value || '');
        const highlightTerms = Array.from(new Set((terms || [])
            .map((term) => String(term || '').trim())
            .filter(Boolean)))
            .sort((left, right) => right.length - left.length);

        if (!highlightTerms.length) {
            return escapeHtml(sourceText);
        }

        let highlightedText = escapeHtml(sourceText);

        highlightTerms.forEach((term) => {
            const escapedTerm = escapeRegExp(term);
            if (!escapedTerm) {
                return;
            }

            highlightedText = highlightedText.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<mark class="search-highlight">$1</mark>');
        });

        return highlightedText;
    }

    function buildSearchHeaderText(queryContext, totalCount) {
        if (queryContext.selection.type === 'cause' && queryContext.selection.label) {
            return {
                title: queryContext.selection.label,
                breadcrumb: `• ${totalCount} matches for ${queryContext.selection.label}`,
            };
        }

        if (queryContext.normalizedQuery) {
            return {
                title: getSearchStateModeLabel(),
                breadcrumb: queryContext.hasCorrection
                    ? `• ${totalCount} matches · did you mean "${queryContext.correctedQuery}"?`
                    : `• ${totalCount} matches for "${queryContext.normalizedQuery}"`,
            };
        }

        return {
            title: isSearchPage ? 'Discover' : 'Feed',
            breadcrumb: '• Trending causes, NGOs, and posts',
        };
    }

    function syncSearchInputValues(value) {
        searchInputNodes.forEach((inputNode) => {
            if (inputNode.value !== value) {
                inputNode.value = value;
            }
        });
    }

    function setSearchDropdownVisibility(shouldShow) {
        searchState.dropdownOpen = Boolean(shouldShow);

        searchDropdownNodes.forEach((dropdownNode) => {
            if (!dropdownNode) {
                return;
            }

            dropdownNode.hidden = false;
            dropdownNode.classList.toggle('is-open', shouldShow);
            dropdownNode.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        });
    }

    function closeSearchDropdown() {
        window.clearTimeout(searchState.debounceTimer);
        setSearchDropdownVisibility(false);

        if (searchState.activeInput && typeof searchState.activeInput.blur === 'function') {
            searchState.activeInput.blur();
        }

        searchState.activeInput = null;
        searchState.isLoading = false;
    }

    function isSearchInteraction(event) {
        const eventPath = typeof event.composedPath === 'function' ? event.composedPath() : [];

        if (!eventPath.length) {
            return Boolean(event.target.closest('.nav-search, .mobile-search, [data-search-dropdown]'));
        }

        return eventPath.some((node) => {
            if (!node || !node.matches) {
                return false;
            }

            return node.matches('.nav-search, .mobile-search, [data-search-dropdown]');
        });
    }

    function renderSearchDropdown(results, queryContext) {
        const normalizedQuery = queryContext.normalizedQuery;

        if (!normalizedQuery) {
            searchDropdownNodes.forEach((dropdownNode) => {
                if (dropdownNode) {
                    dropdownNode.innerHTML = '';
                }
            });

            setSearchDropdownVisibility(false);

            return;
        }

        const dropdownResults = results.slice(0, searchPageSize);
        setSearchDropdownVisibility(true);

        searchDropdownNodes.forEach((dropdownNode) => {
            if (!dropdownNode) {
                return;
            }

            if (!dropdownResults.length) {
                dropdownNode.innerHTML = `
                    <div class="search-dropdown-empty">
                        <strong>No results found</strong>
                        <span>Try education, healthcare, support, or relief.</span>
                    </div>
                `;
                return;
            }

            dropdownNode.innerHTML = dropdownResults.map((result) => {
                const titleMarkup = highlightSearchMarkup(result.title, queryContext.highlightTerms);
                const subtitleMarkup = highlightSearchMarkup(result.subtitle, queryContext.highlightTerms);
                const metaLabel = escapeHtml(result.metaLabel || result.activityLabel || '');
                const actionLabel = result.type === 'ngo'
                    ? 'Open NGO profile'
                    : result.type === 'user'
                        ? 'View user profile'
                        : result.type === 'cause'
                            ? 'Filter feed'
                            : 'Open post';

                return `
                    <a class="search-dropdown-item search-dropdown-item-${escapeHtml(result.type)}" href="${escapeHtml(result.detailUrl)}" aria-label="${escapeHtml(actionLabel)} for ${escapeHtml(result.title)}">
                        <span class="search-dropdown-icon ${result.type === 'user' && result.imageUrl ? 'search-icon-user-image' : escapeHtml(result.avatarColor || `search-icon-${result.type}`)}" aria-hidden="true" ${result.type === 'user' && result.imageUrl ? `style="background-image: url('${escapeHtml(result.imageUrl)}'); background-size: cover; background-position: center;"` : ''}>
                            ${result.type === 'user' && result.imageUrl ? '' : result.type === 'ngo' ? escapeHtml(result.avatarInitials || getAvatarInitials(result.title)) : result.type === 'cause' ? '◌' : '↗'}
                        </span>
                        <span class="search-dropdown-copy">
                            <strong>${titleMarkup}</strong>
                            <span>${subtitleMarkup}</span>
                        </span>
                        <span class="search-dropdown-meta">${metaLabel}</span>
                    </a>
                `;
            }).join('');

        });
    }

    function renderSearchLoadingState(message) {
        if (!postsFeed) {
            return;
        }

        postsFeed.innerHTML = `
            <article class="post-card search-loading-card">
                <div class="search-loading-spinner" aria-hidden="true"></div>
                <div class="search-loading-copy">
                    <h3 class="post-title">${escapeHtml(message || 'Searching...')}</h3>
                    <p class="post-description">Matching NGOs, causes, and posts are loading.</p>
                </div>
            </article>
        `;
    }

    function renderSearchEmptyState(queryContext) {
        if (!postsFeed) {
            return;
        }

        const quickLinks = searchCauseCatalog.slice(0, 3).map((cause) => `
            <a class="search-empty-chip" href="/search?q=${encodeURIComponent(cause.label)}&selected=cause:${encodeURIComponent(cause.key)}">${escapeHtml(cause.label)}</a>
        `).join('');

        postsFeed.innerHTML = `
            <article class="post-card search-empty-card">
                <div class="search-empty-copy">
                    <h3 class="post-title">No results found</h3>
                    <p class="post-description">
                        ${queryContext.normalizedQuery ? `We could not match <strong>${escapeHtml(queryContext.normalizedQuery)}</strong>.` : 'No matching results were found.'}
                    </p>
                    <div class="search-empty-actions">
                        ${quickLinks}
                    </div>
                </div>
            </article>
        `;
    }

    function renderSearchResultCard(result, queryContext) {
        const titleMarkup = highlightSearchMarkup(result.title, queryContext.highlightTerms);
        const subtitleMarkup = highlightSearchMarkup(result.subtitle, queryContext.highlightTerms);
        const excerptMarkup = highlightSearchMarkup(result.excerpt, queryContext.highlightTerms);
        const actionLabel = result.type === 'ngo'
            ? 'Open NGO profile'
            : result.type === 'user'
                ? 'View user profile'
                : result.type === 'cause'
                    ? 'Filter feed'
                    : 'Open post';
        const badgeClass = `search-result-badge-${result.type}`;
        const avatarMarkup = result.type === 'user' && result.imageUrl
            ? `<div class="search-result-avatar search-result-avatar-image"><img src="${escapeHtml(result.imageUrl)}" alt="${escapeHtml(result.title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 14px;"></div>`
            : result.type === 'ngo' || result.type === 'user'
                ? `<div class="search-result-avatar ${escapeHtml(result.avatarColor || 'avatar-green')}">${escapeHtml(result.avatarInitials || getAvatarInitials(result.title))}</div>`
                : `<div class="search-result-avatar search-result-avatar-${escapeHtml(result.type)}" aria-hidden="true">${result.type === 'cause' ? '◌' : '↗'}</div>`;
        const mediaMarkup = result.type === 'post' && result.imageUrl
            ? `
                <div class="post-media search-result-media">
                    <img src="${escapeHtml(result.imageUrl)}" alt="${escapeHtml(result.title)}">
                </div>
            `
            : '';
        const chipMarkup = result.causeKeys && result.causeKeys.length
            ? `<span class="search-result-chip">${escapeHtml(result.causeKeys[0].replace(/-/g, ' '))}</span>`
            : '';

        return `
            <a class="post-card search-result-card search-result-${escapeHtml(result.type)}" href="${escapeHtml(result.detailUrl)}" data-search-result-type="${escapeHtml(result.type)}" aria-label="${escapeHtml(actionLabel)} for ${escapeHtml(result.title)}">
                <div class="post-header search-result-header">
                    <div class="search-result-header-left">
                        ${avatarMarkup}
                        <div class="search-result-copy">
                            <span class="search-result-badge ${badgeClass}">${escapeHtml(result.typeLabel)}</span>
                            <h3 class="post-title">${titleMarkup}</h3>
                            <p class="search-result-subtitle">${subtitleMarkup}</p>
                        </div>
                    </div>
                    <div class="search-result-meta" aria-label="${escapeHtml(result.metaLabel || result.activityLabel || '')}">
                        <span class="search-result-meta-value">${escapeHtml(result.metaLabel || result.activityLabel || '')}</span>
                        ${chipMarkup}
                    </div>
                </div>
                <div class="post-body">
                    <p class="post-description">${excerptMarkup}</p>
                    ${mediaMarkup}
                    <div class="search-result-footer">
                        <span class="search-result-action">${escapeHtml(actionLabel)}</span>
                        <span class="search-result-hint">${escapeHtml(result.activityLabel || 'Search result')}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function renderSearchResultsIntoFeed(results, queryContext, options = {}) {
        if (!postsFeed) {
            return;
        }

        const shouldReplace = options.replace !== false;

        if (shouldReplace) {
            postsFeed.innerHTML = '';
            searchState.visibleCount = 0;
        }

        const startIndex = searchState.visibleCount;
        const nextBatch = results.slice(startIndex, startIndex + searchPageSize);

        if (!nextBatch.length) {
            if (shouldReplace) {
                renderSearchEmptyState(queryContext);
            }

            return;
        }

        const existingSentinel = postsFeed.querySelector('[data-search-sentinel]');

        if (existingSentinel) {
            existingSentinel.remove();
        }

        postsFeed.insertAdjacentHTML('beforeend', nextBatch.map((result) => renderSearchResultCard(result, queryContext)).join(''));
        searchState.visibleCount += nextBatch.length;

        if (options.showSentinel && searchState.visibleCount < results.length) {
            postsFeed.insertAdjacentHTML('beforeend', `
                <div class="search-sentinel" data-search-sentinel>
                    <span class="search-loading-spinner" aria-hidden="true"></span>
                    <span>Loading more results</span>
                </div>
            `);
        }
    }

    function renderSearchResults(query, options = {}) {
        const normalizedQuery = String(query || '').trim();
        const searchResult = runSearchCatalog(normalizedQuery, {
            limit: getSearchCatalog().entries.length || 1,
            offset: 0,
        });

        searchState.query = normalizedQuery;
        searchState.selected = options.selected !== undefined ? String(options.selected || '').trim() : searchState.selected;
        searchState.currentResults = searchResult.results;
        searchState.currentQueryContext = searchResult.queryContext;
        searchState.correction = searchResult.queryContext.correctedQuery;
        searchState.isLoading = false;

        const headerText = buildSearchHeaderText(searchResult.queryContext, searchResult.totalCount);

        if (feedTitleNode) {
            feedTitleNode.textContent = headerText.title;
        }

        if (feedBreadcrumbNode) {
            feedBreadcrumbNode.textContent = headerText.breadcrumb;
        }

        renderSearchDropdown(searchResult.results, searchResult.queryContext);

        if (!searchResult.results.length) {
            renderSearchEmptyState(searchResult.queryContext);
            return;
        }

        renderSearchResultsIntoFeed(searchResult.results, searchResult.queryContext, {
            replace: true,
            showSentinel: isSearchPage,
        });
    }

    function openSearchFromInput(inputValue, selectedValue, forceReplace = false) {
        const trimmedValue = String(inputValue || '').trim();

        searchState.selected = String(selectedValue || '').trim();
        syncSearchInputValues(trimmedValue);

        if (!trimmedValue && !searchState.selected) {
            if (!isSearchPage) {
                hideSearchUI();
                setFeedMode(searchState.activeFeedMode || 'posts');
                return;
            }

            renderSearchResults('', {
                selected: searchState.selected,
            });
            return;
        }

        renderSearchLoadingState('Searching...');

        window.clearTimeout(searchState.debounceTimer);
        searchState.debounceTimer = window.setTimeout(() => {
            const normalizedValue = String(trimmedValue || '').trim();

            if (!normalizedValue && !searchState.selected && !isSearchPage) {
                setFeedMode(searchState.activeFeedMode || 'posts');
                hideSearchUI();
                return;
            }

            if (forceReplace && isSearchPage) {
                const searchUrl = buildSearchUrl(normalizedValue, searchState.selected);
                window.history.replaceState({}, '', searchUrl);
            }

            renderSearchResults(normalizedValue, {
                selected: searchState.selected,
            });
        }, searchDebounceDelay);
    }

    function hideSearchUI() {
        searchState.currentResults = [];
        searchState.visibleCount = searchPageSize;
        searchState.correction = '';
        setSearchDropdownVisibility(false);
    }

    function buildSearchUrl(queryValue, selectedValue) {
        const searchParams = new URLSearchParams();

        if (queryValue) {
            searchParams.set('q', queryValue);
        }

        if (selectedValue) {
            searchParams.set('selected', selectedValue);
        }

        const queryString = searchParams.toString();

        return queryString ? `/search?${queryString}` : '/search';
    }

    function handleSearchInput(event) {
        const nextValue = String(event.target.value || '');

        searchState.selected = '';
        searchState.activeInput = event.target;
        syncSearchInputValues(nextValue);
        openSearchFromInput(nextValue, '', false);
    }

    function handleSearchKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();

            const currentValue = String(event.target.value || '').trim();
            const searchUrl = buildSearchUrl(currentValue, searchState.selected);

            if (isSearchPage) {
                window.history.replaceState({}, '', searchUrl);
                renderSearchResults(currentValue, {
                    selected: searchState.selected,
                });
                return;
            }

            window.location.href = searchUrl;
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();

            if (searchState.dropdownOpen) {
                closeSearchDropdown();
                return;
            }

            if (isSearchPage) {
                window.location.href = '/';
                return;
            }

            syncSearchInputValues('');
            hideSearchUI();
            setFeedMode(searchState.activeFeedMode || 'posts');
        }
    }

    function attachSearchListeners() {
        if (!searchInputNodes.length) {
            return;
        }

        searchDropdownNodes.forEach((dropdownNode) => {
            if (!dropdownNode) {
                return;
            }

            dropdownNode.addEventListener('click', function(event) {
                const interactiveItem = event.target.closest('.search-dropdown-item, .search-empty-chip');

                if (interactiveItem) {
                    closeSearchDropdown();
                }
            });
        });

        searchInputNodes.forEach((inputNode) => {
            inputNode.addEventListener('input', handleSearchInput);
            inputNode.addEventListener('keydown', handleSearchKeydown);
            inputNode.addEventListener('focus', function() {
                searchState.activeInput = this;

                if (String(this.value || '').trim()) {
                    openSearchFromInput(this.value, searchState.selected, false);
                }
            });

            // Toggle has-value on parent search container to show/hide clear button
            const searchContainer = inputNode.closest('.nav-search, .mobile-search');
            if (searchContainer) {
                function updateHasValue() {
                    searchContainer.classList.toggle('has-value', inputNode.value.length > 0);
                }

                inputNode.addEventListener('input', updateHasValue);

                // Handle clear button click
                const clearBtn = searchContainer.querySelector('.search-clear-btn');
                if (clearBtn) {
                    clearBtn.addEventListener('click', function() {
                        inputNode.value = '';
                        searchContainer.classList.remove('has-value');
                        syncSearchInputValues('');
                        searchState.selected = '';
                        inputNode.focus();

                        if (!isSearchPage) {
                            hideSearchUI();
                            setFeedMode(searchState.activeFeedMode || 'posts');
                        } else {
                            renderSearchResults('', { selected: '' });
                        }
                    });
                }
            }
        });

        function handleOutsideSearchInteraction(event) {
            if (!isSearchInteraction(event)) {
                closeSearchDropdown();
            }
        }

        document.addEventListener('pointerdown', handleOutsideSearchInteraction, true);
        document.addEventListener('mousedown', handleOutsideSearchInteraction, true);
        document.addEventListener('touchstart', handleOutsideSearchInteraction, true);
        document.addEventListener('focusin', handleOutsideSearchInteraction);

        document.addEventListener('keydown', function(event) {
            if (event.key !== 'Escape') {
                return;
            }

            if (searchState.dropdownOpen) {
                closeSearchDropdown();
                return;
            }

            if (isSearchPage) {
                window.location.href = '/';
            }
        });

        if (searchState.query || searchState.selected) {
            syncSearchInputValues(searchState.query);
            renderSearchResults(searchState.query, {
                selected: searchState.selected,
            });
        }
    }

    function handleSearchScroll() {
        if (!isSearchPage || !searchState.currentResults.length || searchState.visibleCount >= searchState.currentResults.length) {
            return;
        }

        const sentinelNode = postsFeed ? postsFeed.querySelector('[data-search-sentinel]') : null;

        if (!sentinelNode) {
            return;
        }

        const sentinelTop = sentinelNode.getBoundingClientRect().top;

        if (sentinelTop - window.innerHeight < searchResultScrollThreshold) {
            renderSearchResultsIntoFeed(searchState.currentResults, searchState.currentQueryContext, {
                replace: false,
                showSentinel: true,
            });
        }
    }

    // Function to render posts
    function renderPosts() {
        if (!postsFeed) return;

        updateFeedHeader('posts');
        const posts = getFeedPosts();
        currentFeedPosts = posts;
        
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
                        <button class="post-more-btn" aria-label="Important">
                            !!
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

    function renderPopularNgoProfiles() {
        if (!postsFeed) return;

        const profiles = getPopularNgoProfiles();
        updateFeedHeader('popular-ngos');

        if (!profiles.length) {
            postsFeed.innerHTML = `
                <article class="post-card ngo-profile-card">
                    <div class="post-body">
                        <h3 class="post-title">No NGO profiles available yet</h3>
                        <p class="post-description">Popular NGOs will appear here once their posts collect upvotes.</p>
                    </div>
                </article>
            `;
            return;
        }

        postsFeed.innerHTML = profiles.map((profile) => {
            const ngoName = escapeHtml(profile.orgName);
            const profileUrl = escapeHtml(profile.profileUrl);
            const initials = escapeHtml(profile.avatarInitials);
            const following = isNgoFollowed(profile.orgName);
            const scoreLabel = `${formatCompactNumber(profile.totalUpvotes)} upvotes`;
            const followerLabel = `${formatCompactNumber(profile.followerCount)} supporters`;
            const postCountLabel = `${formatCompactNumber(profile.postCount)} posts`;
            const websiteLabel = profile.websiteLabel ? `<span class="ngo-profile-stat">${escapeHtml(profile.websiteLabel)}</span>` : '';
            const rankLabel = escapeHtml(profile.rankLabel || '');

            return `
                <article class="post-card ngo-profile-card" data-ngo-profile-card="${ngoName}" data-ngo-profile-card-url="${profileUrl}" tabindex="0" role="link" aria-label="Open ${ngoName} profile">
                    <div class="post-header ngo-profile-header">
                        <div class="ngo-profile-header-left">
                            <a class="post-author-link ngo-profile-link" href="${profileUrl}" aria-label="Open ${ngoName} profile">
                                <div class="post-avatar ${profile.avatarColor}">${initials}</div>
                                <span class="ngo-profile-link-copy">
                                    <span class="post-ngo-name">${ngoName}</span>
                                    <span class="ngo-profile-subtitle">${escapeHtml(profile.orgTypeLabel)}</span>
                                </span>
                            </a>
                            <button class="btn-follow ngo-profile-follow-btn${following ? ' following' : ''}" type="button" data-ngo-profile-follow="${ngoName}" aria-pressed="${following ? 'true' : 'false'}">${following ? 'Following' : 'Follow'}</button>
                        </div>
                        <div class="ngo-profile-header-right">
                            <button class="btn-learn-more ngo-profile-view-btn" type="button" data-ngo-profile-view="${profileUrl}">View Profile</button>
                            <div class="ngo-profile-score" aria-label="${scoreLabel}">
                                <span class="ngo-profile-score-value">${formatCompactNumber(profile.totalUpvotes)}</span>
                                <span class="ngo-profile-score-label">upvotes</span>
                            </div>
                        </div>
                    </div>

                    
                </article>
            `;
        }).join('');

        attachPopularNgoProfileListeners();
    }

    // Function to attach event listeners to posts
    function attachPostEventListeners() {
        // Donate button handlers
        document.querySelectorAll('.btn-donate').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const postId = this.getAttribute('data-post-id');
                openDonationModal(postId);
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

    function attachPopularNgoProfileListeners() {
        document.querySelectorAll('[data-ngo-profile-card-url]').forEach(card => {
            card.addEventListener('click', function(event) {
                const interactiveTarget = event.target.closest('a, button');

                if (interactiveTarget) {
                    return;
                }

                const profileUrl = this.getAttribute('data-ngo-profile-card-url');

                if (profileUrl) {
                    window.location.href = profileUrl;
                }
            });

            card.addEventListener('keydown', function(event) {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();

                const profileUrl = this.getAttribute('data-ngo-profile-card-url');

                if (profileUrl) {
                    window.location.href = profileUrl;
                }
            });
        });

        document.querySelectorAll('[data-ngo-profile-view]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();

                const profileUrl = this.getAttribute('data-ngo-profile-view');
                if (profileUrl) {
                    window.location.href = profileUrl;
                }
            });
        });

        document.querySelectorAll('[data-ngo-profile-follow]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();

                const ngoName = this.getAttribute('data-ngo-profile-follow');
                const isFollowing = this.classList.contains('following');
                const nextFollowing = setNgoFollowed(ngoName, !isFollowing);

                this.classList.toggle('following', nextFollowing);
                this.textContent = nextFollowing ? 'Following' : 'Follow';
                this.setAttribute('aria-pressed', nextFollowing ? 'true' : 'false');
            });

            const ngoName = btn.getAttribute('data-ngo-profile-follow');
            const isFollowing = isNgoFollowed(ngoName);

            btn.classList.toggle('following', isFollowing);
            btn.textContent = isFollowing ? 'Following' : 'Follow';
            btn.setAttribute('aria-pressed', isFollowing ? 'true' : 'false');
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
                const posts = currentFeedPosts.length ? currentFeedPosts : getFeedPosts();
                const firstPost = posts[0];
                if (firstPost) {
                    openDonationModal(firstPost.id);
                }
            });
        }
    }

    const donationModal = document.getElementById('donationModal');
    const donationModalCloseButtons = Array.from(document.querySelectorAll('[data-donation-close]'));
    const donationLogo = donationModal ? donationModal.querySelector('[data-donation-logo]') : null;
    const donationName = donationModal ? donationModal.querySelector('[data-donation-name]') : null;
    const donationSummary = donationModal ? donationModal.querySelector('[data-donation-summary]') : null;
    const donationDestination = donationModal ? donationModal.querySelector('[data-donation-destination]') : null;
    const donationAmountInput = donationModal ? donationModal.querySelector('[data-donation-amount-input]') : null;
    const donationAmountError = donationModal ? donationModal.querySelector('[data-donation-amount-error]') : null;
    const donationMethodError = donationModal ? donationModal.querySelector('[data-donation-method-error]') : null;
    const donationTotal = donationModal ? donationModal.querySelector('[data-donation-total]') : null;
    const donationAccount = donationModal ? donationModal.querySelector('[data-donation-account]') : null;
    const donationSubmit = donationModal ? donationModal.querySelector('[data-donation-submit]') : null;
    const donationSuccess = donationModal ? donationModal.querySelector('[data-donation-success]') : null;
    const donationPresets = donationModal ? Array.from(donationModal.querySelectorAll('[data-amount]')) : [];
    const donationTabs = donationModal ? Array.from(donationModal.querySelectorAll('[data-payment-method]')) : [];
    const donationPanels = donationModal ? Array.from(donationModal.querySelectorAll('[data-payment-panel]')) : [];
    const donationNgoUpi = donationModal ? donationModal.querySelector('[data-ngo-upi]') : null;
    const donationUpiId = donationModal ? donationModal.querySelector('[data-upi-id]') : null;
    const donationNetbankingBank = donationModal ? donationModal.querySelector('[data-netbanking-bank]') : null;
    const donationNetbankingName = donationModal ? donationModal.querySelector('[data-netbanking-name]') : null;
    const donationCardNumber = donationModal ? donationModal.querySelector('[data-card-number]') : null;
    const donationCardName = donationModal ? donationModal.querySelector('[data-card-name]') : null;
    const donationCardExpiry = donationModal ? donationModal.querySelector('[data-card-expiry]') : null;
    const donationCardCvv = donationModal ? donationModal.querySelector('[data-card-cvv]') : null;
    const donationDebitNumber = donationModal ? donationModal.querySelector('[data-debit-number]') : null;
    const donationDebitName = donationModal ? donationModal.querySelector('[data-debit-name]') : null;
    const donationDebitExpiry = donationModal ? donationModal.querySelector('[data-debit-expiry]') : null;
    const donationDebitCvv = donationModal ? donationModal.querySelector('[data-debit-cvv]') : null;

    let currentFeedPosts = [];
    const donationState = {
        isOpen: false,
        selectedPost: null,
        selectedAmount: 0,
        selectedMethod: 'upi',
    };

    function formatInr(amount) {
        const numericAmount = Number(amount || 0);
        return `INR ${numericAmount.toLocaleString('en-IN')}`;
    }

    function resetDonationErrors() {
        if (donationAmountError) {
            donationAmountError.textContent = '';
        }
        if (donationMethodError) {
            donationMethodError.textContent = '';
        }
    }

    function setSelectedAmount(amount) {
        const numericAmount = Number(amount || 0);
        donationState.selectedAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
        donationPresets.forEach(preset => {
            const presetAmount = Number(preset.getAttribute('data-amount') || 0);
            preset.classList.toggle('is-active', presetAmount === donationState.selectedAmount);
        });
        if (donationAmountInput) {
            donationAmountInput.value = donationState.selectedAmount ? String(donationState.selectedAmount) : '';
        }
        if (donationTotal) {
            donationTotal.textContent = formatInr(donationState.selectedAmount);
        }
        if (donationSubmit) {
            donationSubmit.textContent = donationState.selectedAmount
                ? `Pay ${formatInr(donationState.selectedAmount)}`
                : 'Pay securely';
        }
    }

    function setPaymentMethod(methodKey) {
        donationState.selectedMethod = methodKey;
        donationTabs.forEach(tab => {
            const isActive = tab.getAttribute('data-payment-method') === methodKey;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        donationPanels.forEach(panel => {
            const isActive = panel.getAttribute('data-payment-panel') === methodKey;
            panel.classList.toggle('is-active', isActive);
        });
    }

    function setDonationProfile(post) {
        const profile = buildNgoPaymentProfile(post || {});
        donationState.selectedPost = post || null;

        if (donationLogo) {
            donationLogo.textContent = profile.avatarInitials;
            donationLogo.className = `donation-ngo-logo ${profile.avatarColor}`;
        }
        if (donationName) {
            donationName.textContent = profile.ngoName;
        }
        if (donationSummary) {
            donationSummary.textContent = profile.summary;
        }
        if (donationDestination) {
            donationDestination.textContent = `Funds go directly to ${profile.ngoName}'s payment account.`;
        }
        if (donationAccount) {
            donationAccount.textContent = `${profile.bankName} · A/C •••• ${profile.accountLast4}`;
        }
        if (donationNgoUpi) {
            donationNgoUpi.value = profile.upiId;
        }
    }

    function openDonationModal(postId) {
        if (!donationModal) {
            return;
        }

        const posts = currentFeedPosts.length ? currentFeedPosts : getFeedPosts();
        const post = posts.find(item => String(item.id) === String(postId));
        if (!post) {
            return;
        }

        setDonationProfile(post);
        setSelectedAmount(0);
        setPaymentMethod('upi');
        resetDonationErrors();

        if (donationSuccess) {
            donationSuccess.hidden = true;
        }

        donationModal.classList.add('is-open');
        donationModal.setAttribute('aria-hidden', 'false');
        donationState.isOpen = true;

        if (donationAmountInput) {
            donationAmountInput.focus();
        }
    }

    function closeDonationModal() {
        if (!donationModal) {
            return;
        }

        donationModal.classList.remove('is-open');
        donationModal.setAttribute('aria-hidden', 'true');
        donationState.isOpen = false;
    }

    function validateDonation() {
        resetDonationErrors();

        if (!donationState.selectedAmount || donationState.selectedAmount <= 0) {
            if (donationAmountError) {
                donationAmountError.textContent = 'Enter a valid donation amount.';
            }
            return false;
        }

        if (donationState.selectedMethod === 'upi') {
            const upiValue = String(donationUpiId?.value || '').trim();
            if (!upiValue || !upiValue.includes('@')) {
                if (donationMethodError) {
                    donationMethodError.textContent = 'Enter a valid UPI ID.';
                }
                return false;
            }
        }

        if (donationState.selectedMethod === 'netbanking') {
            const bankValue = String(donationNetbankingBank?.value || '').trim();
            const nameValue = String(donationNetbankingName?.value || '').trim();
            if (!bankValue || !nameValue) {
                if (donationMethodError) {
                    donationMethodError.textContent = 'Select a bank and enter the account holder name.';
                }
                return false;
            }
        }

        if (donationState.selectedMethod === 'credit') {
            const cardNumber = String(donationCardNumber?.value || '').replace(/\s+/g, '');
            const cardName = String(donationCardName?.value || '').trim();
            const expiry = String(donationCardExpiry?.value || '').trim();
            const cvv = String(donationCardCvv?.value || '').trim();
            if (cardNumber.length < 13 || !cardName || !/\d{2}\/\d{2}/.test(expiry) || cvv.length < 3) {
                if (donationMethodError) {
                    donationMethodError.textContent = 'Enter valid credit card details.';
                }
                return false;
            }
        }

        if (donationState.selectedMethod === 'debit') {
            const cardNumber = String(donationDebitNumber?.value || '').replace(/\s+/g, '');
            const cardName = String(donationDebitName?.value || '').trim();
            const expiry = String(donationDebitExpiry?.value || '').trim();
            const cvv = String(donationDebitCvv?.value || '').trim();
            if (cardNumber.length < 13 || !cardName || !/\d{2}\/\d{2}/.test(expiry) || cvv.length < 3) {
                if (donationMethodError) {
                    donationMethodError.textContent = 'Enter valid debit card details.';
                }
                return false;
            }
        }

        return true;
    }

    function handleDonationSubmit() {
        if (!validateDonation()) {
            return;
        }

        if (donationSuccess) {
            donationSuccess.hidden = false;
        }
    }

    if (donationModal) {
        donationModalCloseButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                closeDonationModal();
            });
        });

        donationPresets.forEach(preset => {
            preset.addEventListener('click', function() {
                const amount = Number(this.getAttribute('data-amount') || 0);
                setSelectedAmount(amount);
                resetDonationErrors();
            });
        });

        if (donationAmountInput) {
            donationAmountInput.addEventListener('input', function() {
                const amountValue = Number(this.value || 0);
                setSelectedAmount(amountValue);
                resetDonationErrors();
            });
        }

        donationTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const methodKey = this.getAttribute('data-payment-method');
                if (methodKey) {
                    setPaymentMethod(methodKey);
                    resetDonationErrors();
                }
            });
        });

        if (donationSubmit) {
            donationSubmit.addEventListener('click', function() {
                handleDonationSubmit();
            });
        }

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && donationState.isOpen) {
                closeDonationModal();
            }
        });
    }

    function setFeedMode(feedMode) {
        if (feedMode !== 'search') {
            searchState.activeFeedMode = feedMode;
        }

        if (feedMode === 'popular-ngos') {
            renderPopularNgoProfiles();
            return;
        }

        renderPosts();
    }

    function getCategoryLabel(categoryKey) {
        const catalog = searchCauseCatalog.find(c => c.key === categoryKey);
        return catalog ? catalog.label : categoryKey;
    }

    function renderCategoryFeed(categoryKey) {
        if (!postsFeed) return;

        const categoryLabel = getCategoryLabel(categoryKey);
        
        // Update feed header
        if (feedTitleNode) {
            feedTitleNode.textContent = 'Category';
        }

        if (feedBreadcrumbNode) {
            feedBreadcrumbNode.textContent = `• ${categoryLabel} NGOs`;
        }

        // Show loading state
        postsFeed.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Loading...</div>';

        // Fetch category data from server
        fetch(`/category/${encodeURIComponent(categoryKey)}`)
            .then(response => {
                console.log('Category API response status:', response.status, response.statusText);
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Error response body:', text);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Category data received:', data);
                const categoryNgos = Array.isArray(data.ngoAccounts) ? data.ngoAccounts : [];
                const categoryFeedPosts = Array.isArray(data.allFeedPosts) ? data.allFeedPosts : [];

                console.log('Category NGOs:', categoryNgos.length, 'Feed Posts:', categoryFeedPosts.length);

                if (categoryNgos.length === 0 && categoryFeedPosts.length === 0) {
                    // Show empty state
                    postsFeed.innerHTML = `
                        <div style="text-align: center; padding: 2rem; color: #666;">
                            <p>No NGOs found in this category yet.</p>
                            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Check back later or explore other categories.</p>
                        </div>
                    `;
                    return;
                }

                // Build category posts from NGOs
                const categoryPosts = categoryNgos.map(ngo => ({
                    id: `ngo-${ngo.id}`,
                    ngoName: ngo.orgName,
                    profileUrl: `/ngo/profile/${encodeURIComponent(ngo.orgName)}`,
                    detailUrl: `/ngo/profile/${encodeURIComponent(ngo.orgName)}`,
                    title: `${ngo.orgName} - NGO Profile`,
                    description: `${ngo.orgName} is active in the ${categoryLabel} category`,
                    raisedAmount: 0,
                    goalAmount: 0,
                    upvotes: 0,
                    avatarColor: getAvatarColor(ngo.orgName),
                    imageUrl: '',
                    submittedAt: ngo.submittedAt || new Date().toISOString(),
                }));

                // Render posts with fade/slide transition
                postsFeed.style.opacity = '0';
                postsFeed.style.transition = 'opacity 0.3s ease-in-out';

                postsFeed.innerHTML = categoryPosts.map(post => {
                    const initials = getAvatarInitials(post.ngoName);
                    const ngoName = escapeHtml(post.ngoName);
                    const profileUrl = escapeHtml(post.profileUrl);
                    
                    const headerLeftMarkup = `
                        <a class="post-author-link" href="${profileUrl}" aria-label="Open ${ngoName} profile">
                            <div class="post-avatar ${post.avatarColor}">
                                ${initials}
                            </div>
                            <span class="post-ngo-name">${ngoName}</span>
                        </a>
                    `;

                    return `
                        <div class="feed-item" style="animation: slideIn 0.3s ease-out;">
                            <div class="post">
                                <div class="post-header">
                                    ${headerLeftMarkup}
                                    <div class="post-meta">
                                        <span class="post-time">NGO Profile</span>
                                    </div>
                                </div>
                                
                                <div class="post-footer">
                                    <a href="${profileUrl}" class="view-ngo-link">View Profile →</a>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                // Fade in
                setTimeout(() => {
                    postsFeed.style.opacity = '1';
                }, 0);
            })
            .catch(error => {
                console.error('Error fetching category data:', error);
                postsFeed.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #d32f2f;">
                        <p>Failed to load category data.</p>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Please try again later.</p>
                    </div>
                `;
            });
    }

    // Render the initial feed/search state on page load.
    attachSearchListeners();

    if (isSearchPage || searchState.query || searchState.selected) {
        renderSearchResults(searchState.query, {
            selected: searchState.selected,
        });
    } else {
        setFeedMode('posts');
    }

    if (isSearchPage) {
        window.addEventListener('scroll', handleSearchScroll, { passive: true });
    }

    window.__setHomeFeedMode = setFeedMode;
    window.__renderHomePosts = renderPosts;
    window.__renderPopularNgoProfiles = renderPopularNgoProfiles;
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
            const feedMode = this.getAttribute('data-feed-mode');
            const categoryKey = this.getAttribute('data-category');
            const href = this.getAttribute('href');

            // If this link has a real destination (not "#") and is not a feed/category action,
            // allow the browser to navigate normally.
            if (!feedMode && !categoryKey && href && href !== '#') {
                return; // let the browser handle navigation
            }

            event.preventDefault();

            // Remove active class from all sidebar links
            sidebarLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            if (categoryKey) {
                // Category link clicked
                renderCategoryFeed(categoryKey);
            } else if (feedMode === 'popular-ngos' || feedMode === 'posts') {
                setFeedMode(feedMode);
            }

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
