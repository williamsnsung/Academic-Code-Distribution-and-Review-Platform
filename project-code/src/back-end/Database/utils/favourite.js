import { newConnection, newQuery, selectAll, selectWhere } from '../dbAgent.js';

const TABLE_NAME = 'favourite';

export class Favourite {
    /**
     * A relationship which describes "<post> is a favorite post of <user>"
     * @param {String} user_id
     * @param {String} post_id
     */
    constructor(post_id, user_id) {
        this.post_id = post_id;
        this.user_id = user_id;
    }

    /**
     * Insert the relationship to database.
     * @returns {Promise<void>}
     */
    async insert() {
        let conn = await newConnection();
        await newQuery(conn, favouriteInsertion, this);
        conn.release();
    }

    /**
     * Delete a favourite relationship.
     * @returns {Promise<void>}
     */
    async delete() {
        return await Favourite.delete(this.post_id);
    }

    async favorite() {
        return await Favourite.favorite(this.post_id, this.user_id);
    }

    /**
     * Delete a favourite relationship.
     * @returns {Promise<void>}
     */
    static async delete(post_id) {
        let conn = await newConnection();
        await newQuery(conn, favouriteDeletion,
            `post_id = ${conn.escape(post_id)}`);
        conn.release();
    }

    /**
     * True if the user add the post to favourite.
     * @returns {Promise<boolean>}
     */
    static async favorite(post_id, user_id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME,
            `post_id = ${conn.escape(post_id)} AND user_id = ${conn.escape(user_id)}`);
        conn.release();
        return res.length !== 0;
    }

    /**
     * All favourite posts of a user.
     */
    static async favoriteAll(user_id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, (conn_, res, rej, uid) => {
            let sql = `SELECT post_id
                       FROM ${TABLE_NAME}
                       WHERE user_id = ${conn.escape(uid)}`;
            conn_.query(sql, (err, result) => {
                if (err) rej(err);
                else res(result);
            });
        }, user_id);
        conn.release();
        return JSON.parse(JSON.stringify(res));
    }

    /**
     * All users who are favourite this post.
     */
    static async favoriteUsers(post_id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, (conn_, res, rej, pid) => {
            let sql = `SELECT user_id
                       FROM ${TABLE_NAME}
                       WHERE post_id = ${conn.escape(pid)}`;
            conn_.query(sql, (err, result) => {
                if (err) rej(err);
                else res(result);
            });
        }, post_id);
        conn.release();
        let user_ids = [];
        for (let i = 0, l = res.length; i < l; i++) {
            user_ids.push(res[i].user_id);
        }
        return user_ids;
    }

    /**
     * Export data in the table in form of json.
     * @returns {Promise<json>} Array of satisfied objs.
     */
    static async dataset() {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectAll, TABLE_NAME);
        conn.release();
        res = JSON.parse(JSON.stringify(res));
        return res;
    }
}

/**
 * Create table `favourite` if not exists.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 */
export function createFavourite(connection, resolve, reject) {
    let sql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME}
    (post_id VARCHAR
               (96) NOT NULL, user_id VARCHAR
               (96) NOT NULL, PRIMARY KEY
               (post_id,
                user_id), FOREIGN KEY
               (post_id) REFERENCES posts
               (id), FOREIGN KEY
               (user_id) REFERENCES users
               (id))`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Insert a comment to database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param {Favourite} favourite Favourite relationship.
 */
function favouriteInsertion(connection, resolve, reject, favourite) {
    favourite  = favourite[0];
    let sql    = `INSERT INTO ${TABLE_NAME}
                  SET ? `;
    let values = {
        post_id: favourite.post_id,
        user_id: favourite.user_id
    };
    connection.query(sql, values, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Delete a comment from database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param {condition} condition
 */
function favouriteDeletion(connection, resolve, reject, condition) {
    let sql = `DELETE
               FROM ${TABLE_NAME}
               WHERE ${condition}`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}