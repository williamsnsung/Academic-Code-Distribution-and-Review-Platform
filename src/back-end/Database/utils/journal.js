import {
    newConnection,
    newQuery,
    selectWhere
}               from '../dbAgent.js';
import { User } from './user.js';
import { Post } from './post.js';
import { Tag }  from './tag.js';
import post     from '../../Server/routes/api/post.js';

const TABLE_NAME              = 'journals';
const TABLE_NAME_RELATIONSHIP = 'journals_posts';
const TABLE_NAME_POSTS        = 'posts';

/**
 * Journal.
 */
export class Journal {
    constructor(id, user, title, description, location, create_date, update_date,
                delete_date, tags) {
        this.id          = id;
        this.user        = user;
        this.title       = title;
        this.description = description;
        this.location    = location;
        this.create_date = create_date;
        this.update_date = update_date;
        this.delete_date = delete_date;
        this.tags        = tags;
    }

    /**
     * Insert the journal to database.
     * @returns {Promise<void>}
     */
    async insert() {
        let conn = await newConnection();
        await newQuery(conn, journalInsertion, this);
        conn.release();
        for (let i = 0; i < this.tags.length; i++) {
            await new Tag(this.tags[i], this.id).insert();
        }
    }

    /**
     * Update a journal record which has the same journal ID.
     * @returns {Promise<void>}
     */
    async update() {
        let conn = await newConnection();
        await newQuery(conn, journalUpdate, this);
        conn.release();
        for (let t in this.tags) {
            await Tag.deleteAllByJournalId(this.id);
            await new Tag(t, this.id).insert();
        }
    }

    /**
     * Delete a journal record.
     * @returns {Promise<void>}
     */
    async delete() {
        try {
            const posts = await Journal.getPostsInJournal(this.id);
            for (let p in posts) {
                let post = (await Post.getPostById(posts[p].post_id))[0];
                await post.delete();
            }

            for (let t in this.tags) {
                await Tag.deleteAllByJournalId(this.id);
            }
        } catch (ignore) {
        }

        let conn = await newConnection();
        await newQuery(conn, journalDeletion, this.id);
        conn.release();
    }

    /**
     * Remove a post from this journal.
     * @returns {Promise<void>}
     */
    static async removePost(post_id) {
        let conn = await newConnection();
        await newQuery(conn, removePostFromJournal, post_id);
        conn.release();
    }

    /**
     * Add a post to current journal.
     * @param {Post} post
     * @returns {Promise<void>}
     */
    async addPost(post) {
        await post.insert();
        let conn = await newConnection();
        await journalAddPost(conn, this, post);
        conn.release();
    }

    /**
     * Convert a raw row in SQL RowDataPacket to Journal object.
     * @param rowData A raw row in SQL RowDataPacket.
     * @returns {Promise<Journal>} Post object.
     */
    static async #fromRaw(rowData) {
        return new Journal(
            rowData.id,
            (await User.getUserById_safe(rowData.user_id))[0],
            rowData.title,
            rowData.description,
            rowData.location,
            rowData.create_date,
            rowData.update_date,
            rowData.delete_date,
            (await Tag.getTags(rowData.id))
        );
    }

    /**
     * Select journal with specified id.
     * @param id Post id.
     * @returns {Promise<Journal[]>} Array of satisfied journals.
     */
    static async getJournalById(id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME,
            `id = ${conn.escape(id)}`);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Journal.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Select random journals.
     * @param {number} number
     * @returns {Promise<*>}
     */
    static async getRandomJournals(number) {
        let conn = await newConnection();
        let res  = await newQuery(conn, randomJournals, number);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Journal.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Select journals with specified User.
     * @param user Author.
     * @returns {Promise<Journal[]>} Array of satisfied journals.
     */
    static async getJournalByUser(user) {
        return await this.getJournalById(user.id);
    }

    /**
     * Select Journals with specified User id.
     * @param userId Author id.
     * @returns {Promise<Journal[]>} Array of satisfied Journals.
     */
    static async getJournalByUserId(userId) {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectWhere, TABLE_NAME,
            `user_id = ${conn.escape(userId)}`);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Journal.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Get posts by journal id
     * @param journalId
     * @returns {Promise<*>}
     */
    static async getPostsInJournal(journalId) {
        let conn = await newConnection();
        let res  = await newQuery(conn, postsInJournal, journalId);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await this.#fromRaw_post(res[i]);
        }
        return res;
    }

    /**
     * Get journal by post id.
     * @param post_id
     * @returns {Promise<*>}
     */
    static async getJournalByPostId(post_id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, parentJournal, post_id);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = await Journal.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Convert a raw row in SQL RowDataPacket to Journal object.
     */
    static async #fromRaw_post(rowData) {
        const author = (await User.getUserByID(rowData.user_id))[0];
        return {
            post_id    : rowData.post_id,
            title      : rowData.title,
            author     : `${author.fn} ${author.ln}`,
            description: rowData.slug
        };
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
            res[i] = await Journal.#fromRaw(res[i]);
        }
        return res;
    }

    /**
     * Export data in the table in form of json.
     * @returns {Promise<json>} Array of satisfied objs.
     */
    static async dataset() {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectAll_jrnl);
        conn.release();
        res = JSON.parse(JSON.stringify(res));
        for (let i = 0, l = res.length; i < l; i++) {
            let r  = res[i];
            res[i] = {
                post_id      : r.post_id,
                journal_id   : r.id,
                journal_title: r.title
            };
        }
        return res;
    }
}

/**
 * Create table `journals_posts` if not exists: <journal> has <post>.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 */
export function createJournalPost(connection, resolve, reject) {
    let sql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME_RELATIONSHIP}
    (journal_id VARCHAR
               (96) NOT NULL, post_id VARCHAR
               (96) NOT NULL, PRIMARY KEY
               (journal_id,
                post_id), FOREIGN KEY
               (journal_id) REFERENCES ${TABLE_NAME}
               (id), FOREIGN KEY
               (post_id) REFERENCES posts
               (id))`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Create table `journal` if not exists.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 */
export function createJournal(connection, resolve, reject) {
    let sql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME}
    (id VARCHAR
               (96) NOT NULL PRIMARY KEY , user_id VARCHAR
               (96) NOT NULL , title NVARCHAR
               (128) NOT NULL , description TEXT NOT NULL , location TEXT NOT NULL , create_date DATETIME NOT NULL , update_date DATETIME , delete_date DATETIME , FOREIGN KEY
               (user_id) REFERENCES users
               (id) )`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Insert a journal to database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param journal journal.
 */
function journalInsertion(connection, resolve, reject, journal) {
    journal    = journal[0];
    let sql    = `INSERT INTO ${TABLE_NAME}
                  SET ? `;
    let values = {
        id         : journal.id,
        user_id    : journal.user.id,
        title      : journal.title,
        description: journal.description,
        location   : journal.location,
        create_date: journal.create_date,
        update_date: journal.update_date,
        delete_date: journal.delete_date
    };
    connection.query(sql, values, err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Update a journal in the database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param journal journal.
 */
function journalUpdate(connection, resolve, reject, journal) {
    journal = journal[0];
    let sql = `UPDATE ${TABLE_NAME}
               SET user_id     = ?,
                   title       = ?,
                   location    = ?,
                   create_date = ?,
                   update_date = ?,
                   delete_date = ?
               WHERE id = ?`;
    connection.query(sql, [
        journal.user.id, journal.title, journal.location,
        journal.create_date, journal.update_date, journal.delete_date,
        journal.id
    ], err => {
        if (err) reject(err);
        else resolve();
    });
}

/**
 * Delete a Journal from database.
 * @param connection Available MySQL connection.
 * @param resolve Connection Promise resolve.
 * @param reject Connection Promise reject.
 * @param id Journal id.
 */
function journalDeletion(connection, resolve, reject, id) {
    let sql = `DELETE
               FROM ${TABLE_NAME}
               WHERE id = ${connection.escape(id)}`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

function journalAddPost(connection, journal, post) {
    return new Promise((resolve, reject) => {
        let sql    = `INSERT INTO ${TABLE_NAME_RELATIONSHIP}
                      SET ? `;
        let values = {
            journal_id: journal.id,
            post_id   : post.id
        };
        connection.query(sql, values, err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function randomJournals(connection, resolve, reject, number) {
    let sql = `SELECT *
               FROM ${TABLE_NAME}
               ORDER BY RAND() LIMIT ${number}`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

function postsInJournal(connection, resolve, reject, journalId) {
    let sql = `SELECT post_id, title, user_id, slug
               FROM ${TABLE_NAME_RELATIONSHIP},
                    ${TABLE_NAME_POSTS}
               WHERE journal_id = ${connection.escape(journalId)}
                 AND post_id = id`;
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
                  OR LOWER(description) LIKE '%${str.toLowerCase()}%'`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

function removePostFromJournal(connection, resolve, reject, post_id) {
    let sql = `DELETE
               FROM ${TABLE_NAME_RELATIONSHIP}
               WHERE post_id = ${connection.escape(post_id)}`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

function selectAll_jrnl(connection, resolve, reject) {
    let sql = `SELECT *
               FROM ${TABLE_NAME}
                        INNER JOIN ${TABLE_NAME_RELATIONSHIP}
                                   ON ${TABLE_NAME}.id = ${TABLE_NAME_RELATIONSHIP}.journal_id`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

function parentJournal(connection, resolve, reject, post_id) {
    let sql = `SELECT *
               FROM ${TABLE_NAME}
                        INNER JOIN ${TABLE_NAME_RELATIONSHIP}
                                   ON ${TABLE_NAME}.id = ${TABLE_NAME_RELATIONSHIP}.journal_id
               WHERE ${TABLE_NAME_RELATIONSHIP}.post_id = ${connection.escape(post_id)}`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}