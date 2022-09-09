import { newConnection, newQuery, selectAll, selectWhere } from '../dbAgent.js';
import { Voting }                                          from './voting.js';
import { Favourite }                                       from './favourite.js';
import { Post }                                            from './post.js';

const TABLE_NAME = 'users';

/**
 * User profile.
 */
export class User {
    /**
     * Constructor of User.
     * @param {String} id         User ID.
     * @param {String} fn         First Name.
     * @param {String} ln         Last Name.
     * @param gender
     * @param {String} email      Email address.
     * @param {String} phone      Phone number.
     * @param {String} psw        Password.
     * @param {String} status     Role.
     * @param {Date}   regis_date Registration Date.
     * @param {String} token      Token.
     */
    constructor(id, fn, ln, gender,
                email, phone, psw, status, regis_date, token) {
        this.id         = id;
        this.fn         = fn;
        this.ln         = ln;
        this.gender     = gender;
        this.email      = email;
        this.phone      = phone;
        this.psw        = psw;
        this.regis_date = regis_date;
        this.token      = token;
        this.status     = status;
    }

    /**
     * Convert raw query record in SQL RowDataPacket to User.
     * @param rowData A raw row in SQL RowDataPacket.
     * @returns {User} User.
     */
    static #fromRaw(rowData) {
        return new User(
            rowData.id, rowData.firstname, rowData.lastname, rowData.gender, rowData.email,
            rowData.phone, rowData.password, User.fromStatus(rowData.status), rowData.regis_date,
            rowData.token
        );
    }

    /**
     * Convert raw query record in SQL RowDataPacket to User.
     * Confidential filed is erased.
     * @param rowData A raw row in SQL RowDataPacket.
     * @returns {User} User.
     */
    static #fromRaw_safe(rowData) {
        return new User(
            rowData.id, rowData.firstname, rowData.lastname, rowData.gender, rowData.email,
            rowData.phone, null, User.fromStatus(rowData.status), rowData.regis_date,
            null
        );
    }

    /**
     * Checks if this user is registered.
     * WARNING: This function only checks if the id of this user is existing.
     * @returns {Promise<Boolean>} True if the user is registered.
     */
    async isRegistered() {
        let conn = await newConnection();
        let res  = await newQuery(conn, userRegistered, this);
        conn.release();
        return res;
    }

    /**
     * Try to insert this user record to the table.
     * WARNING: If the user id is registered, use `updateUser()`.
     * @returns {Promise<Boolean>} True if the user is registered.
     */
    async insert() {
        let conn = await newConnection();
        await newQuery(conn, userInsertion, this);
        conn.release();
    }

    /**
     * Delete the user record which has the same user ID.
     * @returns {Promise<void>}
     */
    async delete() {
        let conn = await newConnection();
        await newQuery(conn, userDeletion, this.id);
        conn.release();
    }

    /**
     * Update the user record which has the same user ID.
     * @returns {Promise<void>}
     */
    async update() {
        let conn = await newConnection();
        await newQuery(conn, userUpdate, this);
        conn.release();
    }

    /**
     * Select users from Users table with specified id.
     * @param {String} id User id.
     * @returns {Promise<User[]>} Array of satisfied users.
     */
    static async getUserByID(id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME, `id = ${conn.escape(id)}`);
        conn.release();
        res.forEach((part, index, arr) => arr[index] = User.#fromRaw(arr[index]));
        return res;
    }

    /**
     * Select users from Users table with specified token.
     * @param {String} token token
     * @returns {Promise<User[]>} Array of satisfied users.
     */
    static async getUserByToken(token) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME, `token = ${conn.escape(token)}`);
        conn.release();
        res.forEach((part, index, arr) => arr[index] = User.#fromRaw(arr[index]));
        return res;
    }

    /**
     * Select users from Users table by specified email and name.
     * Confidential filed is erased.
     * @param {String} id
     * @returns {Promise<User[]>} Array of satisfied users.
     */
    static async getUserById_safe(id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME, `id = ${conn.escape(id)}`);
        conn.release();
        res.forEach((part, index, arr) => arr[index] = User.#fromRaw_safe(arr[index]));
        return res;
    }

    /**
     * Select users from Users table by specified email and name.
     * @param email Email address.
     * @param fn First name.
     * @param ln Last name.
     * @returns {Promise<User[]>} Array of satisfied users.
     */
    static async getUserByEmailName(email, fn, ln) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME,
            `email = ${conn.escape(email)} AND firstname = ${conn.escape(fn)} AND lastname = ${conn.escape(ln)}`);
        conn.release();
        res.forEach((part, index, theArray) => theArray[index] = User.#fromRaw(theArray[index]));
        return res;
    }

    /**
     * Fuzzy search user in the database.
     * @param {String} str keyword
     * @returns {Promise<*>} Array of satisfied users.
     */
    static async search(str) {
        let conn = await newConnection();
        let res  = await newQuery(conn, fuzzySearch, str);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await User.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Export data in the table in form of json.
     * @returns {Promise<json>} Array of satisfied users.
     */
    static async dataset() {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectAll, TABLE_NAME);
        conn.release();
        res = JSON.parse(JSON.stringify(res));
        for (let i = 0, l = res.length; i < l; i++) {
            let r  = res[i];
            res[i] = {
                user_id   : r.id,
                regis_date: r.regis_date,
                gender    : r.gender,
                status    : r.status
            };
        }
        return res;
    }

    /**
     * Get statistics data of a user.
     * @param {String} user_id
     * @returns {Promise<{user_favourite: any, user_posts: {}, user_voting: any}>}
     */
    static async getStatistics(user_id) {
        const user_posts = await Post.getPostByUserId(user_id);
        let result       = {
            user_voting   : await Voting.queryAll(user_id),
            user_favourite: await Favourite.favoriteAll(user_id),
            user_posts    : {}
        };
        for (let i = 0, l = user_posts.length; i < l; i++) {
            let p                   = user_posts[i];
            result.user_posts[p.id] = {
                post_info           : p,
                post_score          : await Voting.score(p.id),
                post_favourite_users: await Favourite.favoriteUsers(p.id),
                post_upvote_users   : await Voting.upvoteUsers(p.id),
                post_downvote_users : await Voting.downvoteUsers(p.id)
            };
        }
        return result;
    }

    static toStatus(role) {
        if (role === 'author') return 0;
        if (role === 'viewer') return 1;
        if (role === 'reviewer') return 2;
        return role;
    }

    static fromStatus(status) {
        if (status === 0) return 'author';
        if (status === 1) return 'viewer';
        if (status === 2) return 'reviewer';
        return status;
    }

    /**
     * @param {String} status
     * @returns {Promise<*>}
     */
    static async getUsersByStatus(status) {
        const s = this.toStatus(status);
        if (s == null) return [];
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME, `status = ${conn.escape(status)}`);
        conn.release();
        res.forEach((part, index, theArray) => {
            theArray[index] = User.#fromRaw(theArray[index]);
        });
        return res;
    }
}

/*
 *  Query SDL Functions for newQuery().
 */

/**
 * Create table `Users` if not exists.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 */
export function createUsers(connection, resolve, reject) {
    let sql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME}
    (id VARCHAR
               (96) NOT NULL PRIMARY KEY , email VARCHAR
               (96) NOT NULL , firstname VARCHAR
               (32) NOT NULL , lastname VARCHAR
               (32) NOT NULL , gender VARCHAR
               (32) NOT NULL , phone VARCHAR
               (32) NOT NULL , password VARCHAR
               (40) NOT NULL , status TINYINT NOT NULL , regis_date DATETIME NOT NULL , token VARCHAR
               (500) )`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * SQL of querying if a user record is exist in the table.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param {User} user User id.
 */
function userRegistered(connection, resolve, reject, user) {
    user    = user[0];
    let sql = `SELECT id
               FROM ${TABLE_NAME}
               WHERE firstname = '${user.fn}'
                 AND lastname = '${user.ln}'
                 AND email = '${user.email}'`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res.length !== 0);
    });
}

/**
 * Insert a user record to the table.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param user User.
 */
function userInsertion(connection, resolve, reject, user) {
    user       = user[0];
    let sql    = `INSERT INTO ${TABLE_NAME}
                  SET ? `;
    let values = {
        id        : user.id,
        firstname : user.fn,
        lastname  : user.ln,
        gender    : user.gender,
        email     : user.email,
        phone     : user.phone,
        password  : user.psw,
        status    : User.toStatus(user.status),
        regis_date: user.regis_date,
        token     : user.token
    };
    connection.query(sql, values, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Delete a user record indicated by id.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param id User id.
 */
function userDeletion(connection, resolve, reject, id) {
    let sql = `DELETE
               FROM ${TABLE_NAME}
               WHERE id = '${id}'`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Update a user record indicated by id.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param user
 */
function userUpdate(connection, resolve, reject, user) {
    user    = user[0];
    let sql = `UPDATE ${TABLE_NAME}
               SET firstname  = ?,
                   lastname   = ?,
                   gender     = ?,
                   email      = ?,
                   phone      = ?,
                   password   = ?,
                   status     = ?,
                   regis_date = ?,
                   token      = ?
               WHERE id = ?`;
    connection.query(sql,
        [user.fn, user.ln, user.gender, user.email, user.phone, user.psw, User.toStatus(user.status), user.regis_date, user.token, user.id],
        err => {
            if (err) reject(err);
            else resolve();
        });
}

/**
 * Fuzzy search sql connection handler.
 */
function fuzzySearch(connection, resolve, reject, str) {
    str     = str.toString();
    let sql = `SELECT *
               FROM ${TABLE_NAME}
               WHERE id LIKE '%${str.toLowerCase()}%'
                  OR LOWER(email) LIKE '%${str.toLowerCase()}%'
                  OR LOWER(firstname) LIKE '%${str.toLowerCase()}%'
                  OR LOWER(lastname) LIKE '%${str.toLowerCase()}%'`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

