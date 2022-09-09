import { newConnection, newQuery, selectAll } from '../dbAgent.js';

const TABLE_NAME = 'history';

export class History {
    constructor(post_id, user_id, accesstime) {
        this.post_id    = post_id;
        this.user_id    = user_id;
        this.accesstime = accesstime;
    }

    async insert() {
        let conn = await newConnection();
        await newQuery(conn, insertion, this);
        conn.release();
    }

    static async dataset() {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectAll, TABLE_NAME);
        conn.release();
        res = JSON.parse(JSON.stringify(res));
        return res;
    }

    static async delete(post_id) {
        let conn = await newConnection();
        await newQuery(conn, deletion, post_id);
        conn.release();
    }

    static async getHistory(user_id) {
        let conn = await newConnection();
        let res  = await newQuery(conn, getHistorySQL, user_id);
        conn.release();
        return JSON.parse(JSON.stringify(res));
    }
}

/**
 * Create table.
 */
export function createHistory(connection, resolve, reject) {
    let sql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME}
    (post_id VARCHAR
               (96) NOT NULL, user_id VARCHAR
               (96) NOT NULL, accesstime DATETIME NOT NULL, PRIMARY KEY
               (post_id,
                user_id,
                accesstime), FOREIGN KEY
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
 * Insert a History obj into database.
 */
function insertion(connection, resolve, reject, history) {
    history    = history[0];
    let sql    = `INSERT INTO ${TABLE_NAME}
                  SET ? `;
    let values = {
        post_id   : history.post_id,
        user_id   : history.user_id,
        accesstime: history.accesstime
    };
    connection.query(sql, values, err => {
        if (err) reject(err);
        else resolve();
    });
}

function deletion(connection, resolve, reject, post_id) {
    let sql = `DELETE
               FROM ${TABLE_NAME}
               WHERE post_id = ${connection.escape(post_id)}`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

function getHistorySQL(connection, resolve, reject, user_id) {
    let sql = `SELECT post_id, accesstime
               FROM ${TABLE_NAME}
               WHERE user_id = ${connection.escape(user_id)}
               ORDER BY accesstime DESC`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}