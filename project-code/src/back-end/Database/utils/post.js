import {
    newConnection,
    newQuery, selectAll,
    selectWhere
}                    from '../dbAgent.js';
import { User }      from './user.js';
import { Comment }   from './comment.js';
import { Favourite } from './favourite.js';
import { Voting }    from './voting.js';
import { Journal }   from './journal.js';
import { History }   from './history.js';
import fs            from 'fs';

const TABLE_NAME = 'posts';
const DB_TRUE    = 1;

/**
 * Post.
 */
export class Post {
    /**
     * Post Constructor.
     * @param {String}  id          Post ID.
     * @param {User}    user        Post author.
     * @param {String}  parent_id   Identify the parent post. It can be used to form the table of content of the parent post of series.
     * @param {String}  title       Post title.
     * @param {String}  meta_title  Original File name.
     * @param {String}  slug        Post slug to form the URL.
     * @param {boolean} published   Identify whether the post is publicly available.
     * @param {Date}    create_date Stores the date and time at which the post is created.
     * @param {Date}    update_date Stores the date and time at which the post is updated.
     * @param {Date}    delete_date Stores the date and time at which the post is deleted.
     * @param {String}  filePath    File path.
     */
    constructor(id, user, parent_id, title,
                meta_title, slug, published, create_date, update_date,
                delete_date, filePath) {
        this.id          = id;
        this.user        = user;
        this.parent_id   = parent_id;
        this.title       = title;
        this.meta_title  = meta_title;
        this.slug        = slug;
        this.published   = published;
        this.create_date = create_date;
        this.update_date = update_date;
        this.delete_date = delete_date;
        this.filePath    = filePath;
    }

    /**
     * Checks if a post has been published.
     * @returns {Promise<Boolean>} True if published.
     */
    async isPublished() {
        let conn = await newConnection();
        let res  = await newQuery(conn, postPublished, this.id);
        conn.release();
        return res;
    }

    /**
     * Insert the post to database.
     * @returns {Promise<void>}
     */
    async insert() {
        let conn = await newConnection();
        await newQuery(conn, postInsertion, this);
        conn.release();
    }

    /**
     * Update a post record which has the same post ID.
     * @returns {Promise<void>}
     */
    async update() {
        let conn = await newConnection();
        await newQuery(conn, postUpdate, this);
        conn.release();
    }

    /**
     * Delete a post record.
     * @returns {Promise<void>}
     */
    async delete() {
        try {
            const children = await Comment.getCommentByPost(this);
            await Favourite.delete(this.id);                    // Delete favourites from db.
            await Voting.delete(this.id);                       // Delete votings from db.
            await Journal.removePost(this.id);                  // Delete post from its journal.
            await History.delete(this.id);                      // Delete history.
            await children.forEach(child => child.delete());    // Delete comments from db.
            await deleteFile(this.filePath);                    // Delete the local file.
        } catch (ignore) {
        }

        let conn = await newConnection();
        await newQuery(conn, postDeletion, this.id);
        conn.release();
    }

    /**
     * Gets the parent post of current post.
     * @returns {Promise<Post[]|undefined>}
     *      An array of matched parent post (Should always contains one element).
     *      Undefined if there is no such parent post.
     */
    async getParent() {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME,
            `id = ${conn.escape(this.parent_id)}`);
        conn.release();
        if (res.length === 0) return undefined;
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Post.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Convert a raw row in SQL RowDataPacket to Post object.
     * @param rowData A raw row in SQL RowDataPacket.
     * @returns {Promise<Post>} Post object.
     */
    static async #fromRaw(rowData) {
        return new Post(
            rowData.id,
            (await User.getUserById_safe(rowData.user_id))[0],
            rowData.parent_id,
            rowData.title,
            rowData.meta_title,
            rowData.slug,
            rowData.published === DB_TRUE,
            rowData.create_date,
            rowData.update_date,
            rowData.delete_date,
            rowData.filePath
        );
    }

    /**
     * Select posts with specified id.
     * @param id Post id.
     * @returns {Promise<Post[]>} Array of satisfied posts.
     */
    static async getPostById(id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME,
            `id = ${conn.escape(id)}`);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Post.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Select posts with specified User.
     * @param user Author.
     * @returns {Promise<Post[]>} Array of satisfied posts.
     */
    static async getPostByUser(user) {
        return await this.getPostByUserId(user.id);
    }

    /**
     * Select posts with specified User id.
     * @param userId Author id.
     * @returns {Promise<Post[]>} Array of satisfied posts.
     */
    static async getPostByUserId(userId) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME,
            `user_id = ${conn.escape(userId)}`);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Post.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Gets random <number> of posts from the table.
     * @param number
     * @returns {Promise<Post[]>}
     */
    static async getRandomPosts(number) {
        let conn = await newConnection();
        let res  = await newQuery(conn, randomPosts, number);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Post.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Fuzzy search in the database.
     * @param {String} str keyword
     * @returns {Promise<*>} Array of satisfied objs.
     */
    static async search(str) {
        let conn = await newConnection();
        let res  = await newQuery(conn, fuzzySearch, str);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Post.#fromRaw(res[i]);
        }
        return res;
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
        for (let i = 0, l = res.length; i < l; i++) {
            let r  = res[i];
            res[i] = {
                post_id   : r.id,
                post_title: r.title
            };
        }
        return res;
    }
}

/*
 *  Query SDL Functions for newQuery().
 */

/**
 * Create table `Posts` if not exists.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 */
export function createPosts(connection, resolve, reject) {
    let sql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME}
    (id VARCHAR
               (96) NOT NULL PRIMARY KEY , user_id VARCHAR
               (96) NOT NULL , parent_id VARCHAR
               (96) , title NVARCHAR
               (128) NOT NULL , meta_title NVARCHAR
               (128) NOT NULL , slug TEXT , published BOOLEAN NOT NULL DEFAULT FALSE, create_date DATETIME NOT NULL , update_date DATETIME , delete_date DATETIME , filePath TEXT NOT NULL , FOREIGN KEY
               (user_id) REFERENCES users
               (id) )`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Checks if a post has been published.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param id Post id.
 */
function postPublished(connection, resolve, reject, id) {
    let sql = `SELECT *
               FROM ${TABLE_NAME}
               WHERE id = ${connection.escape(id)}
                 AND published = 1`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res.length !== 0);
    });
}

/**
 * Insert a post to database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param post Post.
 */
function postInsertion(connection, resolve, reject, post) {
    post       = post[0];
    let sql    = `INSERT INTO ${TABLE_NAME}
                  SET ? `;
    let values = {
        id         : post.id,
        user_id    : post.user.id,
        parent_id  : post.parent_id,
        title      : post.title,
        meta_title : post.meta_title,
        slug       : post.slug,
        published  : post.published,
        create_date: post.create_date,
        update_date: post.update_date,
        delete_date: post.delete_date,
        filePath   : post.filePath
    };
    connection.query(sql, values, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Delete a post from database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param id Post id.
 */
function postDeletion(connection, resolve, reject, id) {
    let sql = `DELETE
               FROM ${TABLE_NAME}
               WHERE id = ${connection.escape(id)}`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Update a post in the database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param post Post.
 */
function postUpdate(connection, resolve, reject, post) {
    post    = post[0];
    let sql = `UPDATE ${TABLE_NAME}
               SET user_id     = ?,
                   parent_id   = ?,
                   title       = ?,
                   meta_title  = ?,
                   slug        = ?,
                   published   = ?,
                   create_date = ?,
                   update_date = ?,
                   delete_date = ?,
                   filePath    = ?
               WHERE id = ?`;
    connection.query(sql, [
        post.user.id, post.parent_id, post.title,
        post.meta_title, post.slug, post.published,
        post.create_date, post.update_date, post.delete_date,
        post.filePath,
        post.id
    ], err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Select random <number> of posts from the table.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param number
 */
function randomPosts(connection, resolve, reject, number) {
    let sql = `SELECT *
               FROM ${TABLE_NAME}
               ORDER BY RAND() LIMIT ${number}`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

function fuzzySearch(connection, resolve, reject, str) {
    str     = str.toString();
    let sql = `SELECT *
               FROM ${TABLE_NAME}
               WHERE LOWER(title) LIKE '%${str.toLowerCase()}%'
                  OR LOWER(slug) LIKE '%${str.toLowerCase()}%'`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

function deleteFile(filepath) {
    return new Promise((res, rej) => {
        fs.unlink(filepath, (err) => {
            if (err) rej(err); else res();
        });
    });
}
