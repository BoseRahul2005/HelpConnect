const mysql = require('mysql2/promise');
const crypto = require('crypto');

const connectionConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'DevBose2005@@',
    database: process.env.MYSQL_DATABASE || 'HelpConnect',
    port: Number(process.env.MYSQL_PORT || 3306),
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
    birthday DATE NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_single_user_username (username),
    UNIQUE KEY unique_single_user_contact (email_or_mobile)
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
        birthday: row.birthday,
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at,
    };
}

async function ensureDatabase() {
    if (!initPromise) {
        initPromise = (async () => {
            await serverPool.query('CREATE DATABASE IF NOT EXISTS `HelpConnect` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

            if (!appPool) {
                appPool = mysql.createPool(connectionConfig);
            }

            await appPool.query(ngoTableSql);
            await appPool.query(singleUserTableSql);
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

async function createNgoAccount(ngoObject) {
    const orgName = String(ngoObject.orgName || '').trim();
    const email = String(ngoObject.email || '').trim();
    const phone = String(ngoObject.phone || '').trim();
    const orgType = String(ngoObject.orgType || '').trim();
    const website = String(ngoObject.website || '').trim() || null;
    const foundedOn = String(ngoObject.foundedOn || '').trim() || null;
    const password = String(ngoObject.password || '').trim();
    const termsAccepted = Boolean(ngoObject.termsAccepted);

    const [duplicates] = await execute('SELECT id FROM ngo_users WHERE email = ? OR phone = ? LIMIT 1', [email, phone]);

    if (duplicates.length) {
        const duplicateError = new Error('NGO_ACCOUNT_EXISTS');
        duplicateError.code = 'NGO_ACCOUNT_EXISTS';
        throw duplicateError;
    }

    const { hash, salt } = hashPassword(password);

    const [result] = await execute(
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
            termsAccepted ? 1 : 0,
            JSON.stringify([]),
            JSON.stringify([]),
            JSON.stringify([]),
            JSON.stringify([]),
            JSON.stringify([]),
            JSON.stringify([]),
            JSON.stringify([]),
        ]
    );

    return getNgoById(result.insertId);
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

async function getSingleUserById(id) {
    const [rows] = await execute('SELECT * FROM single_users WHERE id = ? LIMIT 1', [id]);
    return normalizeSingleUserRow(rows[0]);
}

async function listSingleUsers() {
    const [rows] = await query('SELECT * FROM single_users ORDER BY submitted_at DESC');
    return rows.map(normalizeSingleUserRow);
}

async function createSingleUserAccount(userObject) {
    const name = String(userObject.name || '').trim();
    const username = String(userObject.username || '').trim();
    const emailOrMobile = String(userObject.emailOrMobile || '').trim();
    const password = String(userObject.password || '').trim();
    const birthday = String(userObject.birthday || '').trim();

    const [duplicates] = await execute(
        'SELECT id FROM single_users WHERE username = ? OR email_or_mobile = ? LIMIT 1',
        [username, emailOrMobile]
    );

    if (duplicates.length) {
        const duplicateError = new Error('SINGLE_USER_EXISTS');
        duplicateError.code = 'SINGLE_USER_EXISTS';
        throw duplicateError;
    }

    const { hash, salt } = hashPassword(password);

    const [result] = await execute(
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

    return getSingleUserById(result.insertId);
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
    createNgoAccount,
    authenticateNgo,
    getSingleUserById,
    listSingleUsers,
    createSingleUserAccount,
    authenticateSingleUser,
};