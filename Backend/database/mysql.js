const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');
const crypto = require('crypto');

const connectionConfig = {
    host: process.env.MYSQL_HOST ,
    user: process.env.MYSQL_USER ,
    password: process.env.MYSQL_PASSWORD ,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT || 3306),
    connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT || 5000),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
};

const serverPool = mysql.createPool({
    host: connectionConfig.host,
    user: connectionConfig.user,
    password: connectionConfig.password,
    port: connectionConfig.port,
    connectTimeout: connectionConfig.connectTimeout,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
    dateStrings: true,
});

const ngoTableSql = `
CREATE TABLE IF NOT EXISTS ngo_users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    org_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    org_type VARCHAR(50) NOT NULL,
    website VARCHAR(255) DEFAULT NULL,
    founded_on DATE DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(64) NOT NULL,
    terms_accepted TINYINT(1) NOT NULL DEFAULT 0,
    posts JSON NOT NULL,
    comments JSON NOT NULL,
    donations JSON NOT NULL,
    followers JSON NOT NULL,
    saved_items JSON NOT NULL,
    upvoted JSON NOT NULL,
    history JSON NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_ngo_email (email),
    UNIQUE KEY unique_ngo_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const singleUserTableSql = `
CREATE TABLE IF NOT EXISTS single_users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email_or_mobile VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(64) NOT NULL,
    profile_picture_path VARCHAR(255) DEFAULT NULL,
    profile_picture_name VARCHAR(255) DEFAULT NULL,
    birthday DATE NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_single_user_username (username),
    UNIQUE KEY unique_single_user_contact (email_or_mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const singleUserPostsTableSql = `
CREATE TABLE IF NOT EXISTS single_user_posts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(160) NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    image_path VARCHAR(255) DEFAULT NULL,
    image_name VARCHAR(255) DEFAULT NULL,
    is_fundraiser TINYINT(1) NOT NULL DEFAULT 0,
    fund_raise_goal DECIMAL(12,2) DEFAULT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_single_user_posts_user_id (user_id, submitted_at),
    CONSTRAINT fk_single_user_posts_user FOREIGN KEY (user_id) REFERENCES single_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

let appPool = null;
let initPromise = null;

function parseJsonArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (!value) {
        return [];
    }

    if (typeof value === 'string') {
        try {
            const parsedValue = JSON.parse(value);
            return Array.isArray(parsedValue) ? parsedValue : [];
        } catch {
            return [];
        }
    }

    return [];
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const passwordHash = crypto.scryptSync(String(password), salt, 64).toString('hex');

    return {
        salt,
        hash: passwordHash,
    };
}

function verifyPassword(password, salt, expectedHash) {
    if (!salt || !expectedHash) {
        return false;
    }

    const { hash } = hashPassword(password, salt);
    return hash === expectedHash;
}

function normalizeNgoRow(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        orgName: row.org_name,
        email: row.email,
        phone: row.phone,
        orgType: row.org_type,
        website: row.website,
        foundedOn: row.founded_on,
        category: row.category || 'community-development',
        profilePictureUrl: row.profile_picture_path,
        profilePictureName: row.profile_picture_name,
        coverPictureUrl: row.cover_picture_path,
        coverPictureName: row.cover_picture_name,
        passwordHash: row.password_hash,
        passwordSalt: row.password_salt,
        termsAccepted: Boolean(row.terms_accepted),
        posts: parseJsonArray(row.posts),
        comments: parseJsonArray(row.comments),
        donations: parseJsonArray(row.donations),
        followers: parseJsonArray(row.followers),
        savedItems: parseJsonArray(row.saved_items),
        upvoted: parseJsonArray(row.upvoted),
        history: parseJsonArray(row.history),
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at,
    };
}

function normalizeSingleUserRow(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        name: row.name,
        username: row.username,
        emailOrMobile: row.email_or_mobile,
        passwordHash: row.password_hash,
        passwordSalt: row.password_salt,
        profilePicturePath: row.profile_picture_path,
        profilePictureUrl: row.profile_picture_path,
        profilePictureName: row.profile_picture_name,
        birthday: row.birthday,
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at,
    };
}

function normalizeSingleUserPostRow(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        body: row.body,
        imagePath: row.image_path,
        imageUrl: row.image_path,
        imageName: row.image_name,
        isFundraiser: Boolean(row.is_fundraiser),
        fundRaiseGoal: row.fund_raise_goal === null || row.fund_raise_goal === undefined
            ? null
            : Number(row.fund_raise_goal),
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at,
    };
}

function normalizeSingleUserFeedPostRow(row) {
    if (!row) {
        return null;
    }

    const post = normalizeSingleUserPostRow(row);

    return {
        ...post,
        authorId: row.user_id,
        authorName: row.user_name,
        authorUsername: row.user_username,
    };
}

async function ensureDatabase() {
    if (!initPromise) {
        initPromise = (async () => {
            await serverPool.query('CREATE DATABASE IF NOT EXISTS `MadadSetu` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

            if (!appPool) {
                appPool = mysql.createPool(connectionConfig);
            }

            await appPool.query(ngoTableSql);
            await appPool.query(singleUserTableSql);
            await appPool.query(singleUserPostsTableSql);

            const [ngoColumnRows] = await appPool.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ngo_users'`,
                [connectionConfig.database]
            );
            const ngoColumns = new Set(ngoColumnRows.map((row) => row.COLUMN_NAME));

            if (!ngoColumns.has('category')) {
                await appPool.query('ALTER TABLE ngo_users ADD COLUMN category VARCHAR(50) DEFAULT \'community-development\' AFTER org_type');
            }

            if (!ngoColumns.has('profile_picture_path')) {
                await appPool.query('ALTER TABLE ngo_users ADD COLUMN profile_picture_path VARCHAR(255) DEFAULT NULL AFTER category');
            }

            if (!ngoColumns.has('profile_picture_name')) {
                await appPool.query('ALTER TABLE ngo_users ADD COLUMN profile_picture_name VARCHAR(255) DEFAULT NULL AFTER profile_picture_path');
            }

            if (!ngoColumns.has('cover_picture_path')) {
                await appPool.query('ALTER TABLE ngo_users ADD COLUMN cover_picture_path VARCHAR(255) DEFAULT NULL AFTER profile_picture_name');
            }

            if (!ngoColumns.has('cover_picture_name')) {
                await appPool.query('ALTER TABLE ngo_users ADD COLUMN cover_picture_name VARCHAR(255) DEFAULT NULL AFTER cover_picture_path');
            }

            // Migrate existing NGOs with NULL or empty category values
            const [ngoWithoutCategory] = await appPool.query(
                'SELECT id FROM ngo_users WHERE category IS NULL OR category = \'\' ORDER BY id'
            );
            
            if (ngoWithoutCategory.length > 0) {
                const categories = ['education', 'healthcare', 'disaster-relief', 'animal-welfare', 'community-development'];
                
                for (let i = 0; i < ngoWithoutCategory.length; i++) {
                    const ngoId = ngoWithoutCategory[i].id;
                    const assignedCategory = categories[i % categories.length];
                    await appPool.query(
                        'UPDATE ngo_users SET category = ? WHERE id = ?',
                        [assignedCategory, ngoId]
                    );
                }
            }

            // Insert demo NGOs if they don't exist (50+ per category)
            // Generate demo NGOs programmatically with unique phone numbers
            const categoryNames = {
                education: ['Education', 'Learning', 'Literacy', 'School', 'Knowledge', 'Scholar', 'Academic', 'Institute', 'Center', 'Hub'],
                healthcare: ['Healthcare', 'Medical', 'Health', 'Clinic', 'Hospital', 'Wellness', 'Care', 'Medicine', 'Doctor', 'Nursing'],
                'disaster-relief': ['Disaster', 'Relief', 'Emergency', 'Rescue', 'Recovery', 'Support', 'Aid', 'Response', 'Crisis', 'Help'],
                'animal-welfare': ['Wildlife', 'Animal', 'Pet', 'Conservation', 'Sanctuary', 'Rescue', 'Protection', 'Care', 'Foundation', 'Trust']
            };

            const actionWords = ['Foundation', 'Initiative', 'Program', 'Network', 'Center', 'Trust', 'Fund', 'Services', 'Organization', 'Society'];
            const locationNames = ['India', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'National'];

            const demoNgos = [];
            let phoneCounter = 9000000000;

            // Generate 50 NGOs per category
            const categoriesToGenerate = ['education', 'healthcare', 'disaster-relief', 'animal-welfare'];
            
            for (const category of categoriesToGenerate) {
                for (let i = 1; i <= 50; i++) {
                    const categoryName = categoryNames[category][i % categoryNames[category].length];
                    const actionWord = actionWords[i % actionWords.length];
                    const location = locationNames[i % locationNames.length];
                    
                    const ngoName = `${categoryName} ${actionWord} ${i}`;
                    const email = `demo_${category}_${i}@ngo.org`;
                    const phone = String(phoneCounter++);
                    
                    demoNgos.push({
                        name: ngoName,
                        email: email,
                        phone: phone,
                        type: category === 'disaster-relief' ? 'emergency' : category === 'animal-welfare' ? 'conservation' : category,
                        category: category,
                        website: `https://${category.replace('-', '')}-${i}.ngo`
                    });
                }
            }

            for (const demoNgo of demoNgos) {
                const [existing] = await appPool.query(
                    'SELECT id FROM ngo_users WHERE email = ? LIMIT 1',
                    [demoNgo.email]
                );

                if (existing.length === 0) {
                    const password = 'demo123456';
                    const { hash, salt } = hashPassword(password);
                    
                    try {
                        await appPool.query(
                            `INSERT INTO ngo_users (org_name, email, phone, org_type, category, website, password_hash, password_salt, terms_accepted, posts, comments, donations, followers, saved_items, upvoted, history) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                demoNgo.name,
                                demoNgo.email,
                                demoNgo.phone,
                                demoNgo.type,
                                demoNgo.category,
                                demoNgo.website,
                                hash,
                                salt,
                                1, // terms_accepted
                                JSON.stringify([]),
                                JSON.stringify([]),
                                JSON.stringify([]),
                                JSON.stringify([]),
                                JSON.stringify([]),
                                JSON.stringify([]),
                                JSON.stringify([])
                            ]
                        );
                        console.log(`✅ Demo NGO created: ${demoNgo.name}`);
                    } catch (insertError) {
                        if (!insertError.message.includes('Duplicate entry')) {
                            console.error(`❌ Error inserting demo NGO ${demoNgo.name}:`, insertError.message);
                        }
                    }
                }
            }

            const [singleUserColumnRows] = await appPool.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'single_users'`,
                [connectionConfig.database]
            );
            const singleUserColumns = new Set(singleUserColumnRows.map((row) => row.COLUMN_NAME));

            if (!singleUserColumns.has('profile_picture_path')) {
                await appPool.query('ALTER TABLE single_users ADD COLUMN profile_picture_path VARCHAR(255) DEFAULT NULL AFTER password_salt');
            }

            if (!singleUserColumns.has('profile_picture_name')) {
                await appPool.query('ALTER TABLE single_users ADD COLUMN profile_picture_name VARCHAR(255) DEFAULT NULL AFTER profile_picture_path');
            }

            const [postColumnRows] = await appPool.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'single_user_posts'`,
                [connectionConfig.database]
            );
            const postColumns = new Set(postColumnRows.map((row) => row.COLUMN_NAME));

            if (!postColumns.has('image_path')) {
                await appPool.query('ALTER TABLE single_user_posts ADD COLUMN image_path VARCHAR(255) DEFAULT NULL AFTER body');
            }

            if (!postColumns.has('image_name')) {
                await appPool.query('ALTER TABLE single_user_posts ADD COLUMN image_name VARCHAR(255) DEFAULT NULL AFTER image_path');
            }

            if (!postColumns.has('is_fundraiser')) {
                await appPool.query('ALTER TABLE single_user_posts ADD COLUMN is_fundraiser TINYINT(1) NOT NULL DEFAULT 0 AFTER image_name');
            }

            if (!postColumns.has('fund_raise_goal')) {
                await appPool.query('ALTER TABLE single_user_posts ADD COLUMN fund_raise_goal DECIMAL(12,2) DEFAULT NULL AFTER is_fundraiser');
            }
        })();
    }

    return initPromise;
}

async function execute(sql, params = []) {
    await ensureDatabase();
    return appPool.execute(sql, params);
}

async function query(sql, params = []) {
    await ensureDatabase();
    return appPool.query(sql, params);
}

async function getNgoById(id) {
    const [rows] = await execute('SELECT * FROM ngo_users WHERE id = ? LIMIT 1', [id]);
    return normalizeNgoRow(rows[0]);
}

async function listNgoAccounts() {
    const [rows] = await query('SELECT * FROM ngo_users ORDER BY submitted_at DESC');
    return rows.map(normalizeNgoRow);
}

async function listNgoAccountsByCategory(category) {
    const categoryValue = String(category || 'community-development').trim().toLowerCase();
    console.log('Querying NGOs for category:', categoryValue);
    const [rows] = await query('SELECT * FROM ngo_users WHERE category = ? ORDER BY submitted_at DESC', [categoryValue]);
    console.log('Found NGOs:', rows?.length || 0, 'for category:', categoryValue);
    return rows.map(normalizeNgoRow);
}

async function createNgoAccount(ngoObject) {
    const orgName = String(ngoObject.orgName || '').trim();
    const email = String(ngoObject.email || '').trim();
    const phone = String(ngoObject.phone || '').trim();
    const orgType = String(ngoObject.orgType || '').trim();
    const website = String(ngoObject.website || '').trim() || null;
    const foundedOn = String(ngoObject.foundedOn || '').trim() || null;
    const password = String(ngoObject.password || '').trim();
    const termsAccepted = Boolean(ngoObject.termsAccepted);

    const [duplicateRows] = await execute('SELECT id FROM ngo_users WHERE email = ? OR phone = ? LIMIT 1', [email, phone]);

    if (duplicateRows.length) {
        const duplicateError = new Error('NGO_ACCOUNT_EXISTS');
        duplicateError.code = 'NGO_ACCOUNT_EXISTS';
        throw duplicateError;
    }

    const { hash, salt } = hashPassword(password);

    const result = await execute(
        `INSERT INTO ngo_users (
            org_name,
            email,
            phone,
            org_type,
            website,
            founded_on,
            password_hash,
            password_salt,
            terms_accepted,
            posts,
            comments,
            donations,
            followers,
            saved_items,
            upvoted,
            history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            orgName,
            email,
            phone,
            orgType,
            website,
            foundedOn,
            hash,
            salt,
            termsAccepted,
            '[]',
            '[]',
            '[]',
            '[]',
            '[]',
            '[]',
            '[]',
        ]
    );

    return getNgoById(result[0].insertId);
}

async function authenticateNgo(emailOrMobile, password) {
    const lookupValue = String(emailOrMobile || '').trim();

    const [rows] = await execute('SELECT * FROM ngo_users WHERE email = ? OR phone = ? LIMIT 1', [lookupValue, lookupValue]);
    const ngo = rows[0];

    if (!ngo || !verifyPassword(password, ngo.password_salt, ngo.password_hash)) {
        return null;
    }

    await execute('UPDATE ngo_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [ngo.id]);
    return normalizeNgoRow(ngo);
}

async function updateNgoProfilePicture(ngoId, profilePicturePath, profilePictureName) {
    const result = await execute(
        'UPDATE ngo_users SET profile_picture_path = ?, profile_picture_name = ? WHERE id = ?',
        [profilePicturePath, profilePictureName, ngoId]
    );
    return result[0].affectedRows > 0;
}

async function updateNgoCoverPicture(ngoId, coverPicturePath, coverPictureName) {
    const result = await execute(
        'UPDATE ngo_users SET cover_picture_path = ?, cover_picture_name = ? WHERE id = ?',
        [coverPicturePath, coverPictureName, ngoId]
    );
    return result[0].affectedRows > 0;
}

async function updateNgoPosts(ngoId, postsArray) {
    const result = await execute(
        'UPDATE ngo_users SET posts = ? WHERE id = ?',
        [JSON.stringify(postsArray), ngoId]
    );
    return result[0].affectedRows > 0;
}

async function getSingleUserById(id) {
    const [rows] = await execute('SELECT * FROM single_users WHERE id = ? LIMIT 1', [id]);
    return normalizeSingleUserRow(rows[0]);
}

async function getSingleUserByUsername(username) {
    const [rows] = await execute('SELECT * FROM single_users WHERE username = ? LIMIT 1', [username]);
    return normalizeSingleUserRow(rows[0]);
}

async function getSingleUserPostById(id) {
    const [rows] = await execute('SELECT * FROM single_user_posts WHERE id = ? LIMIT 1', [id]);
    return normalizeSingleUserPostRow(rows[0]);
}

async function listSingleUsers() {
    const [rows] = await query('SELECT * FROM single_users ORDER BY submitted_at DESC');
    return rows.map(normalizeSingleUserRow);
}

async function listSingleUsersForSearch() {
    const [rows] = await query(
        `SELECT id, name, username, profile_picture_path, submitted_at FROM single_users ORDER BY submitted_at DESC`
    );
    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        username: row.username,
        profilePictureUrl: row.profile_picture_path,
        submittedAt: row.submitted_at,
    }));
}

async function listSingleUserPosts(userId) {
    const [rows] = await execute(
        'SELECT * FROM single_user_posts WHERE user_id = ? ORDER BY submitted_at DESC, id DESC',
        [userId]
    );

    return rows.map(normalizeSingleUserPostRow);
}

async function updateSingleUserProfilePicture(userId, profilePicturePath, profilePictureName) {
    const normalizedUserId = Number(userId);
    const normalizedProfilePicturePath = String(profilePicturePath || '').trim() || null;
    const normalizedProfilePictureName = String(profilePictureName || '').trim() || null;

    if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
        return false;
    }

    const result = await execute(
        'UPDATE single_users SET profile_picture_path = ?, profile_picture_name = ? WHERE id = ?',
        [normalizedProfilePicturePath, normalizedProfilePictureName, normalizedUserId]
    );

    return result[0].affectedRows > 0;
}

async function listRecentSingleUserFeedPosts(limit = 12) {
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 12;

    const [rows] = await execute(
        `SELECT
            p.*,
            u.name AS user_name,
            u.username AS user_username
        FROM single_user_posts p
        INNER JOIN single_users u ON u.id = p.user_id
        ORDER BY p.submitted_at DESC, p.id DESC
        LIMIT ?`,
        [normalizedLimit]
    );

    return rows.map(normalizeSingleUserFeedPostRow);
}

async function listAllSingleUserFeedPosts() {
    const [rows] = await execute(
        `SELECT
            p.*,
            u.name AS user_name,
            u.username AS user_username
        FROM single_user_posts p
        INNER JOIN single_users u ON u.id = p.user_id
        ORDER BY p.submitted_at DESC, p.id DESC`
    );

    return rows.map(normalizeSingleUserFeedPostRow);
}

async function getSingleUserFeedPostById(id) {
    const [rows] = await execute(
        `SELECT
            p.*,
            u.name AS user_name,
            u.username AS user_username
        FROM single_user_posts p
        INNER JOIN single_users u ON u.id = p.user_id
        WHERE p.id = ?
        LIMIT 1`,
        [id]
    );

    return normalizeSingleUserFeedPostRow(rows[0]);
}

async function createSingleUserPost(postObject) {
    const userId = Number(postObject.userId);
    const title = String(postObject.title || '').trim().slice(0, 160);
    const body = String(postObject.body || '').trim();
    const imagePath = String(postObject.imagePath || '').trim() || null;
    const imageName = String(postObject.imageName || '').trim() || null;
    const fundRaiseGoal = postObject.fundRaiseGoal === null || postObject.fundRaiseGoal === undefined || postObject.fundRaiseGoal === ''
        ? null
        : Number(postObject.fundRaiseGoal);
    const isFundraiser = Boolean(postObject.isFundraiser) || fundRaiseGoal !== null;

    if (!Number.isInteger(userId) || userId <= 0) {
        const invalidUserError = new Error('POST_INVALID_USER');
        invalidUserError.code = 'POST_INVALID_USER';
        throw invalidUserError;
    }

    if (!body) {
        const missingBodyError = new Error('POST_BODY_REQUIRED');
        missingBodyError.code = 'POST_BODY_REQUIRED';
        throw missingBodyError;
    }

    if (isFundraiser && (fundRaiseGoal === null || Number.isNaN(fundRaiseGoal) || fundRaiseGoal <= 0)) {
        const invalidGoalError = new Error('POST_GOAL_REQUIRED');
        invalidGoalError.code = 'POST_GOAL_REQUIRED';
        throw invalidGoalError;
    }

    const result = await execute(
        `INSERT INTO single_user_posts (
            user_id,
            title,
            body,
            image_path,
            image_name,
            is_fundraiser,
            fund_raise_goal
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            title,
            body,
            imagePath,
            imageName,
            isFundraiser,
            isFundraiser ? fundRaiseGoal : null,
        ]
    );

    return getSingleUserPostById(result[0].insertId);
}

async function deleteSingleUserPost(userId, postId) {
    const normalizedUserId = Number(userId);
    const normalizedPostId = Number(postId);

    if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
        return false;
    }

    if (!Number.isInteger(normalizedPostId) || normalizedPostId <= 0) {
        return false;
    }

    const result = await execute(
        'DELETE FROM single_user_posts WHERE id = ? AND user_id = ?',
        [normalizedPostId, normalizedUserId]
    );

    return result[0].affectedRows > 0;
}

async function deleteNgoAccount(ngoId) {
    const normalizedNgoId = Number(ngoId);

    if (!Number.isInteger(normalizedNgoId) || normalizedNgoId <= 0) {
        return false;
    }

    const result = await execute('DELETE FROM ngo_users WHERE id = ?', [normalizedNgoId]);

    return result[0].affectedRows > 0;
}

async function deleteSingleUserAccount(userId) {
    const normalizedUserId = Number(userId);

    if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
        return false;
    }

    const result = await execute('DELETE FROM single_users WHERE id = ?', [normalizedUserId]);

    return result[0].affectedRows > 0;
}

async function createSingleUserAccount(userObject) {
    const name = String(userObject.name || '').trim();
    const username = String(userObject.username || '').trim();
    const emailOrMobile = String(userObject.emailOrMobile || '').trim();
    const password = String(userObject.password || '').trim();
    const birthday = String(userObject.birthday || '').trim();

    const [duplicateRows] = await execute(
        'SELECT id FROM single_users WHERE username = ? OR email_or_mobile = ? LIMIT 1',
        [username, emailOrMobile]
    );

    if (duplicateRows.length) {
        const duplicateError = new Error('SINGLE_USER_EXISTS');
        duplicateError.code = 'SINGLE_USER_EXISTS';
        throw duplicateError;
    }

    const { hash, salt } = hashPassword(password);

    const result = await execute(
        `INSERT INTO single_users (
            name,
            username,
            email_or_mobile,
            password_hash,
            password_salt,
            birthday
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, username, emailOrMobile, hash, salt, birthday]
    );

    return getSingleUserById(result[0].insertId);
}

async function authenticateSingleUser(emailOrMobile, password) {
    const lookupValue = String(emailOrMobile || '').trim();

    const [rows] = await execute(
        'SELECT * FROM single_users WHERE email_or_mobile = ? OR username = ? LIMIT 1',
        [lookupValue, lookupValue]
    );
    const user = rows[0];

    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
        return null;
    }

    await execute('UPDATE single_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    return normalizeSingleUserRow(user);
}

module.exports = {
    ensureDatabase,
    getNgoById,
    listNgoAccounts,
    listNgoAccountsByCategory,
    createNgoAccount,
    authenticateNgo,
    getSingleUserById,
    getSingleUserByUsername,
    listSingleUsers,
    listSingleUsersForSearch,
    getSingleUserPostById,
    listSingleUserPosts,
    getSingleUserFeedPostById,
    updateSingleUserProfilePicture,
    listRecentSingleUserFeedPosts,
    listAllSingleUserFeedPosts,
    createSingleUserPost,
    deleteSingleUserPost,
    deleteNgoAccount,
    deleteSingleUserAccount,
    createSingleUserAccount,
    authenticateSingleUser,
};
