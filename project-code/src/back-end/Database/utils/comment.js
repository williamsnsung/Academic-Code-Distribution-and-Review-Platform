import {
    newConnection,
    newQuery,
    selectWhere
}               from '../dbAgent.js';
import { User } from './user.js';
import { Post } from './post.js';

const TABLE_NAME = 'comments';
const DB_TRUE    = 1;

export class Comment {
    /**
     * Comment Constructor.
     * @param {String}  id          Comment ID.
     * @param {Post}    post        Post.
     * @param {User}    user        Author.
     * @param {String}  parent_id   Parent comment id.
     * @param {String}  title       Title.
     * @param {boolean} published   Identify whether the comment is publicly available.
     * @param {Date}    create_date Stores the date and time at which the comment is created.
     * @param {Date}    update_date Stores the date and time at which the comment is updated.
     * @param {Date}    delete_date Stores the date and time at which the comment is deleted.
     * @param {String}  body        Comment content.
     */
    constructor(id, post, user,
                parent_id, title, published,
                create_date, update_date, delete_date,
                body
    ) {
        this.id          = id;
        this.post        = post;
        this.user        = user;
        this.parent_id   = parent_id;
        this.title       = title;
        this.published   = published;
        this.create_date = create_date;
        this.update_date = update_date;
        this.delete_date = delete_date;
        this.body        = body;
    }

    /**
     * Checks if a comment has been published.
     * @returns {Promise<Boolean>} True if published.
     */
    async isPublished() {
        let conn = await newConnection();
        let res  = await newQuery(conn, commentPublished, this.id);
        conn.release();
        return res;
    }

    /**
     * Insert the comment to database.
     * @returns {Promise<void>}
     */
    async insert() {
        let conn = await newConnection();
        await newQuery(conn, commentInsertion, this);
        conn.release();
    }

    /**
     * Delete a comment record.
     * @returns {Promise<void>}
     */
    async delete() {
        let conn = await newConnection();
        await newQuery(conn, commentDeletion, this.id);
        conn.release();
    }

    /**
     * Update a comment record which has the same post ID.
     * @returns {Promise<void>}
     */
    async update() {
        let conn = await newConnection();
        await newQuery(conn, commentUpdate, this);
        conn.release();
    }

    /**
     * Gets the parent post of current post.
     * @returns {Promise<Comment[]|undefined>}
     *      An array of matched parent post (Should always contains one element).
     *      Undefined if there is no such parent post.
     */
    async getParent() {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME, `id = ${conn.escape(this.parent_id)}`);
        conn.release();
        if (res.length === 0) return undefined;
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Comment.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Convert a raw row in SQL RowDataPacket to Comment object.
     * @param rowData A raw row in SQL RowDataPacket.
     * @returns {Promise<Comment>} Comment object.
     */
    static async #fromRaw(rowData) {
        return new Comment(
            rowData.id,
            (await Post.getPostById(rowData.post_id))[0],
            (await User.getUserByID(rowData.user_id))[0],
            rowData.parent_id,
            rowData.title,
            rowData.published === DB_TRUE,
            rowData.create_date,
            rowData.update_date,
            rowData.delete_date,
            rowData.body
        );
    }

    /**
     * Select comments with specified id.
     * @param id Comment id.
     * @returns {Promise<Comment[]>} Array of satisfied comments.
     */
    static async getCommentById(id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME, `id = ${conn.escape(id)} ORDER BY update_date`);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Comment.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Select comments with specified User.
     * @param user Author.
     * @returns {Promise<Comment[]>} Array of satisfied comments.
     */
    static async getCommentByUser(user) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME, `user_id = ${conn.escape(user.id)}`);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Comment.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Select comments with specified User id.
     * @param userid Author id.
     * @returns {Promise<Comment[]>} Array of satisfied comments.
     */
    static async getCommentByUserId(userid) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME, `user_id = ${conn.escape(userid)}`);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Comment.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Select comments with specified Post.
     * @param post Post.
     * @returns {Promise<Comment[]>} Array of satisfied comments.
     */
    static async getCommentByPost(post) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME, `post_id = ${conn.escape(post.id)}`);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Comment.#fromRaw(res[i]);
        }
        return res;
    }
}

/*
 *  Query SDL Functions for newQuery().
 */

export function createComments(connection, resolve, reject) {
    let sql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME}
    (id VARCHAR
               (96) NOT NULL PRIMARY KEY, post_id VARCHAR
               (96) NOT NULL, user_id VARCHAR
               (96) NOT NULL, parent_id VARCHAR
               (96), title NVARCHAR
               (128) NOT NULL, published BOOLEAN NOT NULL DEFAULT FALSE, create_date DATETIME NOT NULL, update_date DATETIME, delete_date DATETIME, body TEXT NOT NULL, FOREIGN KEY
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
 * Checks if a comment has been published.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param id Comment id.
 */
function commentPublished(connection, resolve, reject, id) {
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
 * Insert a comment to database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param comment Comment.
 */
function commentInsertion(connection, resolve, reject, comment) {
    comment    = comment[0];
    let sql    = `INSERT INTO ${TABLE_NAME}
                  SET ? `;
    let values = {
        id         : comment.id,
        post_id    : comment.post.id,
        user_id    : comment.user.id,
        parent_id  : comment.parent_id,
        title      : comment.title,
        published  : comment.published,
        create_date: comment.create_date,
        update_date: comment.update_date,
        delete_date: comment.delete_date,
        body       : comment.body
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
 * @param id Comment id.
 */
function commentDeletion(connection, resolve, reject, id) {
    let sql = `DELETE
               FROM ${TABLE_NAME}
               WHERE id = ${connection.escape(id)}`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Update a comment in the database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param comment Comment.
 */
function commentUpdate(connection, resolve, reject, comment) {
    comment = comment[0];
    let sql = 'UPDATE ' + TABLE_NAME + ' SET ' +
        'post_id = ?, user_id = ?, parent_id = ?, ' +
        'title = ?, published = ?, ' +
        'create_date = ?, update_date = ?, delete_date = ?, ' +
        'body = ? ' +
        'WHERE id = ? ';
    connection.query(sql, [
        comment.post.id, comment.user.id, comment.parent_id,
        comment.title, comment.published,
        comment.create_date, comment.update_date, comment.delete_date,
        comment.body,
        comment.id
    ], err => {
        if (err) reject(err);
        else resolve();
    });
}