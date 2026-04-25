const express =require ('express');
const fs = require('fs');
const app = express();
const port = 8080;
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const helpConnectDb = require('./database/mysql');

const profilePostUploadDir = path.join(__dirname, 'public', 'uploads', 'profile-posts');

fs.mkdirSync(profilePostUploadDir, { recursive: true });

const allowedProfilePostMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
]);

const profilePostUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, profilePostUploadDir);
        },
        filename: (req, file, callback) => {
            const fileExtension = path.extname(file.originalname).toLowerCase();
            const safeBaseName = path.basename(file.originalname, fileExtension)
                .replace(/[^a-z0-9_-]+/gi, '_')
                .slice(0, 40) || 'image';
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            callback(null, `${Date.now()}-${uniqueSuffix}-${safeBaseName}${fileExtension}`);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
        if (!allowedProfilePostMimeTypes.has(file.mimetype)) {
            callback(new Error('Only image files are allowed.'));
            return;
        }

        callback(null, true);
    },
});

const profilePictureUploadDir = path.join(__dirname, 'public', 'uploads', 'profile-pictures');

fs.mkdirSync(profilePictureUploadDir, { recursive: true });

const profilePictureUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, profilePictureUploadDir);
        },
        filename: (req, file, callback) => {
            const fileExtension = path.extname(file.originalname).toLowerCase();
            const safeBaseName = path.basename(file.originalname, fileExtension)
                .replace(/[^a-z0-9_-]+/gi, '_')
                .slice(0, 40) || 'profile';
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            callback(null, `${Date.now()}-${uniqueSuffix}-${safeBaseName}${fileExtension}`);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
        if (!allowedProfilePostMimeTypes.has(file.mimetype)) {
            callback(new Error('Only image files are allowed.'));
            return;
        }

        callback(null, true);
    },
});

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

function parseCookies(cookieHeader) {
    return cookieHeader
        ? Object.fromEntries(
            cookieHeader.split(';').map((cookiePair) => {
                const [key, ...valueParts] = cookiePair.trim().split('=');
                return [key, decodeURIComponent(valueParts.join('='))];
            }).filter(([key]) => key)
        )
        : {};
}

function buildBirthDate(yearValue, monthValue, dayValue) {
    const year = Number(yearValue);
    const month = Number(monthValue);
    const day = Number(dayValue);

    if (!year || !month || !day) {
        return null;
    }

    const date = new Date(year, month - 1, day);

    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isAtLeastAge(dateString, minimumAge) {
    const birthDate = new Date(dateString);

    if (Number.isNaN(birthDate.getTime())) {
        return false;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
    }

    return age >= minimumAge;
}

function isLikelyEmailOrPhone(value) {
    const trimmedValue = String(value || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s+\-()]{7,}$/;

    return emailRegex.test(trimmedValue) || phoneRegex.test(trimmedValue);
}

async function getLoggedInNgo(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    const ngoId = req.query.id || cookies.ngoAuthId;

    if (!ngoId) {
        return null;
    }

    return helpConnectDb.getNgoById(ngoId);
}

async function getLoggedInUser(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    const userId = cookies.userAuthId;

    if (!userId) {
        return null;
    }

    return helpConnectDb.getSingleUserById(userId);
}

function getNgoInitials(name) {
    const cleanedName = String(name || '').trim();

    if (!cleanedName) {
        return 'NG';
    }

    return cleanedName.slice(0, 2).toUpperCase();
}

function getUserInitials(name) {
    const cleanedName = String(name || '').trim();

    if (!cleanedName) {
        return 'US';
    }

    return cleanedName.slice(0, 2).toUpperCase();
}

function getNgoHandle(name) {
    const slug = String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 18);

    return slug ? `ngo/${slug}` : 'ngo/profile';
}

function normalizeNgoLookupKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

function hashText(value) {
    let hash = 0;
    const source = String(value || 'helpconnect');

    for (let index = 0; index < source.length; index += 1) {
        hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
    }

    return hash;
}

function pickSeededValue(seed, values) {
    return values[seed % values.length];
}

function createSvgDataUri(svgMarkup) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;
}

function normalizeWebsiteUrl(value) {
    const websiteValue = String(value || '').trim();

    if (!websiteValue) {
        return null;
    }

    if (/^https?:\/\//i.test(websiteValue)) {
        return websiteValue;
    }

    return `https://${websiteValue}`;
}

function getNgoTagline(orgType, displayName) {
    const typeKey = String(orgType || '').trim().toLowerCase();
    const taglines = {
        healthcare: 'Bringing life-saving healthcare to communities in need.',
        education: 'Opening doors to learning opportunities for every child.',
        environment: 'Protecting nature and building a greener future.',
        humanitarian: 'Delivering urgent relief with dignity and speed.',
        community: 'Strengthening neighborhoods through local action.',
        women: 'Creating safer spaces and stronger opportunities for women.',
        children: 'Helping children grow, learn, and stay safe.',
        other: 'Supporting communities with care and consistency.',
    };

    return taglines[typeKey] || `Supporting communities through the work of ${displayName}.`;
}

function buildNgoArtwork(displayName) {
    const seed = hashText(displayName);
    const coverPalettes = [
        ['#0f766e', '#14b8a6', '#052e16'],
        ['#2f9d62', '#1d7b4a', '#d1fae5'],
        ['#1d4ed8', '#38bdf8', '#dbeafe'],
        ['#a855f7', '#ec4899', '#fae8ff'],
        ['#c2410c', '#f59e0b', '#ffedd5'],
    ];
    const avatarPalettes = [
        ['#2f9d62', '#1d7b4a'],
        ['#2563eb', '#0ea5e9'],
        ['#db2777', '#9333ea'],
        ['#ea580c', '#f59e0b'],
        ['#0f766e', '#22c55e'],
    ];
    const [coverStart, coverMid, coverEnd] = pickSeededValue(seed, coverPalettes);
    const [avatarStart, avatarEnd] = pickSeededValue(seed >> 2, avatarPalettes);
    const initials = getNgoInitials(displayName);
    const coverWaveOffset = 30 + (seed % 70);
    const coverBlobOffset = 50 + ((seed >> 3) % 110);
    const coverSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" fill="none">
            <defs>
                <linearGradient id="coverGradient" x1="0" y1="0" x2="1200" y2="420" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="${coverStart}" />
                    <stop offset="58%" stop-color="${coverMid}" />
                    <stop offset="100%" stop-color="${coverEnd}" />
                </linearGradient>
                <radialGradient id="coverGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(940 60) rotate(90) scale(250 280)">
                    <stop stop-color="#ffffff" stop-opacity="0.22" />
                    <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
                </radialGradient>
            </defs>
            <rect width="1200" height="420" rx="32" fill="url(#coverGradient)" />
            <circle cx="${110 + coverBlobOffset}" cy="${90 + (seed % 45)}" r="112" fill="#ffffff" fill-opacity="0.12" />
            <circle cx="${930 - coverBlobOffset}" cy="${250 - (seed % 50)}" r="160" fill="#ffffff" fill-opacity="0.08" />
            <circle cx="1040" cy="72" r="118" fill="url(#coverGlow)" />
            <path d="M0 ${270 + coverWaveOffset}C140 ${230 + coverWaveOffset} 250 ${330 - coverWaveOffset} 420 ${300 + coverWaveOffset}C560 ${270 + coverWaveOffset} 680 ${190 + coverWaveOffset} 820 ${220 + coverWaveOffset}C980 ${245 + coverWaveOffset} 1080 ${345 - coverWaveOffset} 1200 ${300 + coverWaveOffset}V420H0V${270 + coverWaveOffset}Z" fill="#ffffff" fill-opacity="0.10" />
            <path d="M0 ${300 + coverWaveOffset / 2}C160 ${260 + coverWaveOffset / 2} 280 ${360 - coverWaveOffset / 2} 430 ${332 + coverWaveOffset / 2}C590 ${300 + coverWaveOffset / 2} 720 ${220 + coverWaveOffset / 2} 860 ${246 + coverWaveOffset / 2}C1010 ${272 + coverWaveOffset / 2} 1100 ${360 - coverWaveOffset / 2} 1200 ${324 + coverWaveOffset / 2}V420H0V${300 + coverWaveOffset / 2}Z" fill="#052e16" fill-opacity="0.12" />
        </svg>
    `;
    const avatarSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none">
            <defs>
                <linearGradient id="avatarGradient" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="${avatarStart}" />
                    <stop offset="100%" stop-color="${avatarEnd}" />
                </linearGradient>
            </defs>
            <rect width="256" height="256" rx="128" fill="url(#avatarGradient)" />
            <circle cx="128" cy="96" r="58" fill="#ffffff" fill-opacity="0.12" />
            <circle cx="86" cy="164" r="22" fill="#ffffff" fill-opacity="0.12" />
            <circle cx="172" cy="168" r="28" fill="#ffffff" fill-opacity="0.1" />
            <text x="128" y="145" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="84" font-weight="800" letter-spacing="2" fill="#ffffff">${initials}</text>
        </svg>
    `;

    return {
        coverPhotoUrl: createSvgDataUri(coverSvg),
        profilePhotoUrl: createSvgDataUri(avatarSvg),
        accentColor: coverMid,
        seed,
    };
}

function normalizeNgoPublicPost(post, index) {
    const source = typeof post === 'object' && post !== null ? post : { body: String(post || '') };
    const title = String(source.title || source.heading || '').trim() || 'Community update';
    const body = String(source.body || source.description || '').trim() || 'No details available yet.';
    const goalValue = source.fundRaiseGoal ?? source.goal ?? source.target ?? null;
    const parsedGoal = goalValue === null || goalValue === undefined || goalValue === ''
        ? null
        : Number(goalValue);
    const parsedRaisedAmount = Number(
        source.raisedAmount ?? source.amountRaised ?? source.progressRaised ?? source.currentAmount ?? (parsedGoal ? Math.round(parsedGoal * 0.72) : 0)
    );
    const submittedAt = source.submittedAt || source.createdAt || source.date || new Date(Date.now() - index * 86400000).toISOString();
    const imageUrl = source.imageUrl || source.imagePath || null;

    return {
        id: source.id ?? `post-${index}`,
        title,
        body,
        imageUrl,
        imageName: source.imageName || null,
        isFundraiser: Boolean(source.isFundraiser) || parsedGoal !== null,
        fundRaiseGoal: parsedGoal,
        fundRaiseGoalLabel: parsedGoal !== null ? formatDollarAmount(parsedGoal) : null,
        raisedAmount: Number.isFinite(parsedRaisedAmount) ? parsedRaisedAmount : 0,
        raisedAmountLabel: formatDollarAmount(Number.isFinite(parsedRaisedAmount) ? parsedRaisedAmount : 0),
        submittedAt,
        submittedAtLabel: formatDateTime(submittedAt),
        progressPercent: parsedGoal ? Math.min(((Number.isFinite(parsedRaisedAmount) ? parsedRaisedAmount : 0) / parsedGoal) * 100, 100) : 0,
    };
}

function normalizeNgoPublicDonation(donation, index) {
    const source = typeof donation === 'object' && donation !== null ? donation : { note: String(donation || '') };
    const parsedAmount = Number(source.amount ?? source.value ?? source.total ?? 0);
    const submittedAt = source.submittedAt || source.createdAt || source.date || new Date(Date.now() - index * 172800000).toISOString();
    const donorName = String(source.donorName || source.name || source.donor || 'Anonymous supporter').trim() || 'Anonymous supporter';

    return {
        id: source.id ?? `donation-${index}`,
        donorName,
        amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
        amountLabel: formatDollarAmount(Number.isFinite(parsedAmount) ? parsedAmount : 0),
        note: String(source.note || source.message || source.body || '').trim(),
        submittedAt,
        submittedAtLabel: formatDateTime(submittedAt),
    };
}

function buildFallbackNgoProfileData(displayName, orgType) {
    const seed = hashText(displayName);
    const cityOptions = [
        'Mumbai, India',
        'Delhi, India',
        'Bengaluru, India',
        'Chennai, India',
        'Hyderabad, India',
        'Pune, India',
    ];
    const inferredType = orgType || pickSeededValue(seed, ['healthcare', 'education', 'community', 'humanitarian', 'children', 'women', 'environment']);
    const baseWebsiteSlug = String(displayName || 'ngo')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
    const totalRaised = 125000 + (seed % 60000);
    const donationAmounts = [
        Math.round(totalRaised * 0.41),
        Math.round(totalRaised * 0.27),
        Math.round(totalRaised * 0.18),
    ];
    donationAmounts.push(Math.max(totalRaised - donationAmounts.reduce((sum, amount) => sum + amount, 0), 5000));

    const posts = [
        normalizeNgoPublicPost({
            id: `${seed}-post-1`,
            title: 'Help Needed for Child Heart Surgery',
            body: `${displayName} is rallying support for an urgent heart surgery case. Every contribution closes the gap faster.`,
            isFundraiser: true,
            fundRaiseGoal: 25000,
            raisedAmount: 18500,
            submittedAt: new Date(Date.now() - 172800000).toISOString(),
        }, 1),
        normalizeNgoPublicPost({
            id: `${seed}-post-2`,
            title: 'Community impact update',
            body: `${displayName} shared food, medical support, and volunteer help with families in need this week.`,
            submittedAt: new Date(Date.now() - 432000000).toISOString(),
        }, 2),
        normalizeNgoPublicPost({
            id: `${seed}-post-3`,
            title: 'Volunteer drive this weekend',
            body: 'Join the next volunteer drive to help expand our on-ground support and outreach programs.',
            submittedAt: new Date(Date.now() - 864000000).toISOString(),
        }, 3),
    ];

    const donations = donationAmounts.map((amount, index) => normalizeNgoPublicDonation({
        id: `${seed}-donation-${index + 1}`,
        donorName: ['Anonymous donor', 'Priya Sharma', 'Amit Verma', 'Rohan Patel'][index] || `Supporter ${index + 1}`,
        amount,
        note: ['For urgent care support', 'Keep up the good work', 'Community relief drive', 'Monthly giving'][index] || '',
        submittedAt: new Date(Date.now() - (index + 1) * 259200000).toISOString(),
    }, index + 1));

    const followers = Array.from({ length: 4 }, (_, index) => ({
        id: `${seed}-follower-${index + 1}`,
        name: ['Nandini', 'Kabir', 'Saanvi', 'Arjun'][index] || `Follower ${index + 1}`,
    }));

    return {
        orgType: inferredType,
        website: `${baseWebsiteSlug || 'helpconnect'}.org`,
        location: pickSeededValue(seed >> 1, cityOptions),
        foundedLabel: `Founded ${2010 + (seed % 13)}`,
        profileStatusLabel: 'Demo profile preview',
        followerCount: 12000 + (seed % 6000),
        donorCount: donations.length,
        totalRaised,
        activePostCount: posts.length,
        posts,
        donations,
        followers,
    };
}

function buildPublicNgoProfileViewModel(ngo, requestedName) {
    const displayName = String((ngo && ngo.orgName) || requestedName || 'NGO Profile').trim() || 'NGO Profile';
    const seed = hashText(displayName);
    const artwork = buildNgoArtwork(displayName);
    const hasRealRecord = Boolean(ngo);
    const orgType = (ngo && ngo.orgType) || null;
    const fallbackData = buildFallbackNgoProfileData(displayName, orgType);
    const website = normalizeWebsiteUrl((ngo && ngo.website) || null);
    const profileLocation = pickSeededValue(seed >> 1, [
        'Mumbai, India',
        'Delhi, India',
        'Bengaluru, India',
        'Chennai, India',
        'Hyderabad, India',
        'Pune, India',
    ]);
    const profileFoundedLabel = ngo && ngo.foundedOn
        ? `Founded ${new Date(ngo.foundedOn).getFullYear()}`
        : `Founded ${2010 + (seed % 13)}`;
    const profileSubtitle = getNgoTagline(orgType || fallbackData.orgType, displayName);
    const rawPosts = hasRealRecord ? getNgoCollection(ngo.posts) : [];
    const rawDonations = hasRealRecord ? getNgoCollection(ngo.donations) : [];
    const rawFollowers = hasRealRecord ? getNgoCollection(ngo.followers) : [];
    const rawHistory = hasRealRecord ? getNgoCollection(ngo.history) : [];
    const normalizedPosts = rawPosts.length
        ? rawPosts.map((post, index) => normalizeNgoPublicPost(post, index + 1))
        : fallbackData.posts;
    const normalizedDonations = rawDonations.length
        ? rawDonations.map((donation, index) => normalizeNgoPublicDonation(donation, index + 1))
        : fallbackData.donations;
    const normalizedFollowers = rawFollowers.length
        ? rawFollowers
        : fallbackData.followers;
    const followerCount = rawFollowers.length || fallbackData.followerCount;
    const donorCount = normalizedDonations.length;
    const activePostCount = normalizedPosts.length;
    const totalRaised = normalizedDonations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0) || fallbackData.totalRaised;
    const fundraisingPosts = normalizedPosts.filter((post) => post.isFundraiser || post.fundRaiseGoal);
    const recentPosts = normalizedPosts.slice(0, 3);
    const recentDonations = normalizedDonations.slice(0, 4);
    const recentHistory = rawHistory.length ? rawHistory.slice(0, 4) : [];

    return {
        profileDisplayName: displayName,
        profileSubtitle,
        profileCoverPhotoUrl: artwork.coverPhotoUrl,
        profileAvatarPhotoUrl: artwork.profilePhotoUrl,
        profileInitials: getNgoInitials(displayName),
        profileLocation,
        profileWebsiteLabel: website ? website.replace(/^https?:\/\//i, '') : fallbackData.website,
        profileWebsiteUrl: website || `https://${fallbackData.website}`,
        profileFoundedLabel,
        profileStatusLabel: hasRealRecord ? 'Showing live NGO content' : fallbackData.profileStatusLabel,
        profileStats: [
            {
                label: 'Followers',
                value: followerCount.toLocaleString('en-US'),
            },
            {
                label: 'Donors',
                value: donorCount.toLocaleString('en-US'),
            },
            {
                label: 'Fund Raised',
                value: formatDollarAmount(totalRaised),
            },
            {
                label: 'Active Posts',
                value: activePostCount.toLocaleString('en-US'),
            },
        ],
        profilePosts: normalizedPosts,
        profileDonations: normalizedDonations,
        profileFundraisers: fundraisingPosts,
        profileOverviewPosts: recentPosts,
        profileOverviewDonations: recentDonations,
        profileAboutItems: [
            {
                label: 'Organization Type',
                value: getNgoTypeLabel(orgType || fallbackData.orgType),
            },
            {
                label: 'Location',
                value: profileLocation,
            },
            {
                label: 'Website',
                value: website ? website.replace(/^https?:\/\//i, '') : fallbackData.website,
                href: website || `https://${fallbackData.website}`,
            },
            {
                label: 'Founded',
                value: profileFoundedLabel,
            },
            {
                label: 'Supporters',
                value: followerCount.toLocaleString('en-US'),
            },
            {
                label: 'Donations',
                value: donorCount.toLocaleString('en-US'),
            },
        ],
        profileHistory: recentHistory,
        profileEmptyTitle: 'Nothing published yet',
        profileEmptyCopy: [
            'This NGO has no published posts yet.',
            'Once they start sharing updates or donations, they will appear here.',
        ],
        profileDataSeed: seed,
        profileOrgType: orgType || fallbackData.orgType,
        profileHasLiveRecord: hasRealRecord,
        profileNormalizedFollowers: normalizedFollowers,
    };
}

function getNgoTypeLabel(orgType) {
    const labels = {
        education: 'Education',
        healthcare: 'Healthcare',
        environment: 'Environment',
        humanitarian: 'Humanitarian Aid',
        community: 'Community Development',
        women: 'Women Empowerment',
        children: 'Children Welfare',
        other: 'Organization',
    };

    return labels[orgType] || 'Organization';
}

function formatNgoJoinedDate(dateValue) {
    const joinedDate = new Date(dateValue);

    if (Number.isNaN(joinedDate.getTime())) {
        return 'Recently';
    }

    return joinedDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
    });
}

function getNgoCollection(value) {
    return Array.isArray(value) ? value : [];
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatDollarAmount(value) {
    return `$${Number(value || 0).toLocaleString('en-US')}`;
}

function formatDateTime(value) {
    const dateValue = new Date(value);

    if (Number.isNaN(dateValue.getTime())) {
        return 'Recently';
    }

    return dateValue.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatProfilePostDate(value) {
    const dateValue = new Date(value);

    if (Number.isNaN(dateValue.getTime())) {
        return 'Recently';
    }

    return dateValue.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function serializeForInlineScript(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

function parseFundRaiseGoal(value) {
    const normalizedValue = String(value || '').trim();

    if (!normalizedValue) {
        return null;
    }

    const parsedValue = Number(normalizedValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        return null;
    }

    return parsedValue;
}

function getProfilePostImageUrl(file) {
    if (!file) {
        return null;
    }

    return `/uploads/profile-posts/${file.filename}`;
}

function getProfilePictureUrl(file) {
    if (!file) {
        return null;
    }

    return `/uploads/profile-pictures/${file.filename}`;
}

function buildNgoProfileViewModel(ngo) {
    const posts = getNgoCollection(ngo.posts);
    const comments = getNgoCollection(ngo.comments);
    const donations = getNgoCollection(ngo.donations);
    const followers = getNgoCollection(ngo.followers);
    const savedItems = getNgoCollection(ngo.savedItems);
    const upvoted = getNgoCollection(ngo.upvoted);
    const history = getNgoCollection(ngo.history);
    const followerCount = followers.length;
    const donationCount = donations.length;

    const totalRaised = donations.reduce((sum, donation) => {
        const donationAmount = Number(donation.amount || donation.value || 0);
        return sum + donationAmount;
    }, 0);

    const recentHistory = history.length ? history : [{
        type: 'signup',
        title: 'Account created',
        description: `${ngo.orgName} joined HelpConnect`,
        date: ngo.submittedAt,
    }];

    return {
        ngo,
        ngoInitials: getNgoInitials(ngo.orgName),
        ngoHandle: getNgoHandle(ngo.orgName),
        ngoTypeLabel: getNgoTypeLabel(ngo.orgType),
        ngoJoinedLabel: formatNgoJoinedDate(ngo.submittedAt),
        ngoJoinedAt: formatDateTime(ngo.submittedAt),
        ngoStatusLabel: ngo.termsAccepted ? 'Verified NGO' : 'Pending Verification',
        ngoContactEmail: ngo.email,
        ngoContactPhone: ngo.phone,
        ngoId: ngo.id,
        campaignCount: posts.length,
        commentCount: comments.length,
        donationCount: donations.length,
        followerCount: followers.length,
        savedCount: savedItems.length,
        upvotedCount: upvoted.length,
        totalRaisedLabel: formatCurrency(totalRaised),
        recentPosts: posts.slice(0, 4),
        recentComments: comments.slice(0, 4),
        recentDonations: donations.slice(0, 4),
        recentFollowers: followers.slice(0, 4),
        recentSavedItems: savedItems.slice(0, 4),
        recentUpvoted: upvoted.slice(0, 4),
        recentHistory,
        formatCurrency,
        profileDisplayName: ngo.orgName,
        profileSubtitle: ngoHandle,
        profileStats: [
            {
                label: 'Followers',
                value: String(followerCount),
            },
            {
                label: 'Following',
                value: '0',
            },
            {
                label: 'Donations',
                value: String(donationCount),
            },
            {
                label: 'Fund Raised',
                value: formatDollarAmount(totalRaised),
            },
        ],
        profileStatusLabel: 'Showing all content',
        profileEmptyTitle: "You haven't supported any cause yet",
        profileEmptyCopy: [
            "Once you donate or post in a community, it'll show up here.",
            "You can also adjust what's visible from your settings.",
        ],
    };
}

function buildUserProfileViewModel(user, posts = []) {
    const displayName = String(user.username || '').trim() || 'Profile';
    const fullName = String(user.name || '').trim() || displayName;
    const profilePosts = posts.map((post) => ({
        id: post.id,
        title: String(post.title || '').trim(),
        body: String(post.body || '').trim(),
        imageUrl: post.imageUrl,
        imageName: post.imageName,
        isFundraiser: Boolean(post.isFundraiser),
        fundRaiseGoal: post.fundRaiseGoal,
        fundRaiseGoalLabel: post.fundRaiseGoal !== null && post.fundRaiseGoal !== undefined
            ? formatDollarAmount(post.fundRaiseGoal)
            : null,
        submittedAtLabel: formatProfilePostDate(post.submittedAt),
    }));

    return {
        profileDisplayName: displayName,
        profileSubtitle: fullName,
        profilePictureUrl: user.profilePictureUrl || null,
        profilePictureName: user.profilePictureName || null,
        profilePosts,
        profilePostCount: profilePosts.length,
        profileStats: [
            {
                label: 'Followers',
                value: '0',
            },
            {
                label: 'Following',
                value: '0',
            },
            {
                label: 'Donations',
                value: '0',
            },
            {
                label: 'Fund Raised',
                value: formatDollarAmount(0),
            },
        ],
        profileStatusLabel: 'Showing all content',
        profileEmptyTitle: "You haven't supported any cause yet",
        profileEmptyCopy: [
            "Once you donate or post in a community, it'll show up here.",
            "You can also adjust what's visible from your settings.",
        ],
    };
}

function sanitizeNgoRecord(ngo) {
    if (!ngo) {
        return ngo;
    }

    const { passwordHash, passwordSalt, ...safeNgo } = ngo;
    return safeNgo;
}

async function renderHomePage(req, res) {
    const [loggedInNgo, loggedInUser] = await Promise.all([
        getLoggedInNgo(req),
        getLoggedInUser(req),
    ]);

    const homeFeedPosts = await helpConnectDb.listRecentSingleUserFeedPosts(12);

    return res.render('home', {
        loggedInNgo: loggedInNgo ? sanitizeNgoRecord(loggedInNgo) : null,
        loggedInUser: loggedInUser ? {
            id: loggedInUser.id,
            name: loggedInUser.name,
            profilePictureUrl: loggedInUser.profilePictureUrl || null,
        } : null,
        ngoInitials: loggedInNgo ? getNgoInitials(loggedInNgo.orgName) : null,
        userInitials: loggedInUser ? getUserInitials(loggedInUser.name) : null,
        homeFeedPostsJson: serializeForInlineScript(homeFeedPosts),
    });
}

async function renderNgoProfilePage(req, res) {
    const ngo = await getLoggedInNgo(req);

    if (!ngo) {
        return res.redirect('/ngo/login');
    }

    return res.render('profile-page', buildNgoProfileViewModel(ngo));
}

async function renderPublicNgoProfilePage(req, res) {
    const requestedName = String(req.params.ngoName || '').trim();
    const ngoAccounts = await helpConnectDb.listNgoAccounts();
    const matchedNgo = ngoAccounts.find((account) => normalizeNgoLookupKey(account.orgName) === normalizeNgoLookupKey(requestedName)) || null;

    return res.render('ngo-profile', buildPublicNgoProfileViewModel(matchedNgo ? sanitizeNgoRecord(matchedNgo) : null, requestedName));
}

async function renderUserProfilePage(req, res) {
    const user = await getLoggedInUser(req);

    if (!user) {
        return res.redirect('/user/login');
    }

    const posts = await helpConnectDb.listSingleUserPosts(user.id);

    return res.render('profile-page', buildUserProfileViewModel(user, posts));
}

function handleProfilePictureUpload(req, res, next) {
    profilePictureUpload.single('profilePicture')(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Profile picture must be 5MB or smaller.' });
        }

        return res.status(400).json({ error: error.message || 'Unable to upload the profile picture.' });
    });
}

function handleProfilePostUpload(req, res, next) {
    profilePostUpload.single('image')(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Image must be 5MB or smaller.' });
        }

        return res.status(400).json({ error: error.message || 'Unable to upload the image.' });
    });
}

async function removeUploadedProfilePostImage(filePath) {
    if (!filePath) {
        return;
    }

    const resolvedPath = path.join(__dirname, 'public', filePath.replace(/^\//, ''));

    try {
        await fs.promises.unlink(resolvedPath);
    } catch {
        // Ignore missing files so deletes remain resilient.
    }
}

async function removeUploadedProfilePicture(filePath) {
    if (!filePath) {
        return;
    }

    const resolvedPath = path.join(__dirname, 'public', filePath.replace(/^\//, ''));

    try {
        await fs.promises.unlink(resolvedPath);
    } catch {
        // Ignore missing files so updates remain resilient.
    }
}

// Routes
app.get('/', async (req, res) => {
    await renderHomePage(req, res);
});

app.get('/home', async (req, res) => {
    await renderHomePage(req, res);
});

app.get('/profile', async (req, res) => {
    await renderUserProfilePage(req, res);
});

app.get('/user/profile', async (req, res) => {
    await renderUserProfilePage(req, res);
});

app.get('/dashboard', async (req, res) => {
    await renderHomePage(req, res);
});

app.get('/get-started', (req, res) => {
    res.render('get-started');
});

app.get('/dashboard/get-started', (req, res) => {
    res.render('get-started');
});

app.get('/ngo/profile', async (req, res) => {
    await renderNgoProfilePage(req, res);
});

app.get('/ngo/profile/:ngoName', async (req, res) => {
    await renderPublicNgoProfilePage(req, res);
});

app.post('/profile/picture', handleProfilePictureUpload, async (req, res) => {
    const user = await getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({ error: 'Please log in again to update your profile picture.' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'Please choose an image file.' });
    }

    const profilePictureUrl = getProfilePictureUrl(req.file);

    try {
        const updated = await helpConnectDb.updateSingleUserProfilePicture(user.id, profilePictureUrl, req.file.originalname);

        if (!updated) {
            await removeUploadedProfilePicture(profilePictureUrl);
            return res.status(404).json({ error: 'Profile not found.' });
        }

        if (user.profilePictureUrl && user.profilePictureUrl !== profilePictureUrl) {
            await removeUploadedProfilePicture(user.profilePictureUrl);
        }

        return res.json({
            success: true,
            profilePictureUrl,
            profilePictureName: req.file.originalname,
        });
    } catch (error) {
        await removeUploadedProfilePicture(profilePictureUrl);
        console.error('Failed to update profile picture:', error);
        return res.status(500).json({ error: 'Unable to update your profile picture right now.' });
    }
});

// NGO Routes
app.get('/ngo/signup', (req, res) => {
    res.render('ngo-signup', { errorMessage: null });
});

app.post('/ngo/signup', async (req, res) => {
    const {
        orgName,
        email,
        phone,
        orgType,
        password,
        confirmPassword,
        website,
        foundedOn,
        terms,
    } = req.body;

    if (!orgName || !email || !phone || !orgType || !password) {
        return res.status(400).render('ngo-signup', {
            errorMessage: 'Please complete every required NGO field.',
        });
    }

    if (!email.includes('@')) {
        return res.status(400).render('ngo-signup', {
            errorMessage: 'Please enter a valid NGO email address.',
        });
    }

    if (!phone.trim()) {
        return res.status(400).render('ngo-signup', {
            errorMessage: 'Please enter a valid NGO phone number.',
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).render('ngo-signup', {
            errorMessage: 'Password and confirm password do not match.',
        });
    }

    try {
        await helpConnectDb.createNgoAccount({
            orgName,
            email,
            phone,
            orgType,
            website,
            foundedOn,
            password,
            termsAccepted: terms === 'on',
        });

        return res.redirect('/ngo/login');
    } catch (error) {
        if (error.code === 'NGO_ACCOUNT_EXISTS') {
            return res.status(409).render('ngo-signup', {
                errorMessage: 'An NGO account already exists for that email or phone number.',
            });
        }

        console.error('Failed to create NGO account:', error);
        return res.status(500).render('ngo-signup', {
            errorMessage: 'Unable to create the NGO account right now.',
        });
    }
});

app.get('/ngo/data', async (req, res) => {
    const records = await helpConnectDb.listNgoAccounts();

    res.json({
        count: records.length,
        records: records.map(sanitizeNgoRecord),
    });
});

app.get('/ngo/login', (req, res) => {
    res.render('ngo-login', { errorMessage: null });
});

app.post('/ngo/login', async (req, res) => {
    const { emailOrMobile, password } = req.body;
    const authenticatedNgo = await helpConnectDb.authenticateNgo(emailOrMobile, password);

    if (!authenticatedNgo) {
        return res.status(401).render('ngo-login', {
            errorMessage: 'Invalid email/mobile number or password.',
        });
    }

    res.cookie('ngoAuthId', authenticatedNgo.id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect('/');
});

app.get('/ngo/dashboard', async (req, res) => {
    const ngo = await getLoggedInNgo(req);

    if (!ngo) {
        return res.redirect('/ngo/login');
    }

    return res.render('ngo-dashboard', { ngo });
});

app.get('/ngo/logout', (req, res) => {
    res.clearCookie('ngoAuthId', { path: '/' });
    return res.redirect('/');
});

// Single User Routes
app.get('/user/signup', (req, res) => {
    res.render('user-signup', { errorMessage: null });
});

app.post('/user/signup', async (req, res) => {
    const {
        name,
        username,
        emailOrMobile,
        password,
        month,
        day,
        year,
    } = req.body;

    if (!name || !username || !emailOrMobile || !password || !month || !day || !year) {
        return res.status(400).render('user-signup', {
            errorMessage: 'Please complete every required user field.',
        });
    }

    if (!isLikelyEmailOrPhone(emailOrMobile)) {
        return res.status(400).render('user-signup', {
            errorMessage: 'Please enter a valid email address or mobile number.',
        });
    }

    const birthday = buildBirthDate(year, month, day);

    if (!birthday) {
        return res.status(400).render('user-signup', {
            errorMessage: 'Please choose a valid birthday.',
        });
    }

    if (!isAtLeastAge(birthday, 13)) {
        return res.status(400).render('user-signup', {
            errorMessage: 'You must be at least 13 years old to sign up.',
        });
    }

    try {
        const createdUser = await helpConnectDb.createSingleUserAccount({
            name,
            username,
            emailOrMobile,
            password,
            birthday,
        });

        res.cookie('userAuthId', createdUser.id, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.redirect('/home');
    } catch (error) {
        if (error.code === 'SINGLE_USER_EXISTS') {
            return res.status(409).render('user-signup', {
                errorMessage: 'A user account already exists for that username or contact.',
            });
        }

        console.error('Failed to create single user account:', error);
        return res.status(500).render('user-signup', {
            errorMessage: 'Unable to create the user account right now.',
        });
    }
});

app.get('/user/login', (req, res) => {
    res.render('user-login', { errorMessage: null });
});

app.post('/user/login', async (req, res) => {
    const { emailOrMobile, password, rememberMe } = req.body;

    if (!emailOrMobile || !password) {
        return res.status(400).render('user-login', {
            errorMessage: 'Please enter your email/mobile number and password.',
        });
    }

    const authenticatedUser = await helpConnectDb.authenticateSingleUser(emailOrMobile, password);

    if (!authenticatedUser) {
        return res.status(401).render('user-login', {
            errorMessage: 'Invalid email/mobile number or password.',
        });
    }

    const cookieOptions = {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
    };

    if (rememberMe === 'on') {
        cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
    }

    res.cookie('userAuthId', authenticatedUser.id, cookieOptions);

    return res.redirect('/home');
});

app.post('/profile/posts', handleProfilePostUpload, async (req, res) => {
    const user = await getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({ error: 'Please log in again to create posts.' });
    }

    const { title, body } = req.body;
    const imageUrl = getProfilePostImageUrl(req.file);
    const imageName = req.file ? req.file.originalname : null;
    const fundRaiseGoal = parseFundRaiseGoal(req.body.fundRaiseGoal);
    const isFundraiser = String(req.body.isFundraiser || '').trim() === '1' || fundRaiseGoal !== null;

    if (String(req.body.isFundraiser || '').trim() === '1' && fundRaiseGoal === null) {
        await removeUploadedProfilePostImage(imageUrl);
        return res.status(400).json({ error: 'Please enter a valid fundraiser goal.' });
    }

    try {
        const createdPost = await helpConnectDb.createSingleUserPost({
            userId: user.id,
            title,
            body,
            imagePath: imageUrl,
            imageName,
            isFundraiser,
            fundRaiseGoal,
        });

        return res.status(201).json({
            post: {
                ...createdPost,
                submittedAtLabel: formatProfilePostDate(createdPost.submittedAt),
            },
        });
    } catch (error) {
        if (req.file) {
            await removeUploadedProfilePostImage(imageUrl);
        }

        if (error.code === 'POST_BODY_REQUIRED') {
            return res.status(400).json({ error: 'Post body is required.' });
        }

        if (error.code === 'POST_INVALID_USER') {
            return res.status(400).json({ error: 'Invalid user session.' });
        }

        if (error.code === 'POST_GOAL_REQUIRED') {
            return res.status(400).json({ error: 'Please enter a valid fundraiser goal.' });
        }

        console.error('Failed to create single user post:', error);
        return res.status(500).json({ error: 'Unable to create the post right now.' });
    }
});

app.delete('/profile/posts/:postId', async (req, res) => {
    const user = await getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({ error: 'Please log in again to delete posts.' });
    }

    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId) || postId <= 0) {
        return res.status(400).json({ error: 'Invalid post id.' });
    }

    const post = await helpConnectDb.getSingleUserPostById(postId);

    if (!post || Number(post.userId) !== Number(user.id)) {
        return res.status(404).json({ error: 'Post not found.' });
    }

    const deleted = await helpConnectDb.deleteSingleUserPost(user.id, postId);

    if (!deleted) {
        return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.imageUrl) {
        await removeUploadedProfilePostImage(post.imageUrl);
    }

    return res.json({ success: true });
});

async function startServer() {
    try {
        await helpConnectDb.ensureDatabase();

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to initialize the HelpConnect database:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;