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

startServer();