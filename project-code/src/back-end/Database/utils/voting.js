import {newConnection, newQuery, selectAll} from "../dbAgent.js";

const TABLE_NAME = 'voting';

export class Voting {
    constructor(post_id, user_id, is_upvote) {
        this.post_id   = post_id;
        this.user_id   = user_id;
        this.is_upvote = is_upvote;
    }

    async insert() {
        let conn = await newConnection();
        await newQuery(conn, votingInsertion, this);
        conn.release();
    }

    async update() {
        let conn = await newConnection();
        await newQuery(conn, votingUpdate, this);
        conn.release();
    }

    static async delete(post_id) {
        let conn = await newConnection();
        await votingDeletion(conn, post_id);
        conn.release();
    }

    static async queryVoting(post_id, user_id) {
        let conn  = await newConnection();
        const res = await votingQuery(conn, post_id, user_id);
        conn.release();
        return res;
    }

    static async queryAll(user_id) {
        let conn  = await newConnection();
        const res = await newQuery(conn, votingQueryAll, user_id);
        conn.release();
        return JSON.parse(JSON.stringify(res));
    }

    static async score(post_id) {
        let conn  = await newConnection();
        const res = await newQuery(conn, votingScore, post_id);
        conn.release();
        return res;
    }

    static async dataset() {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectAll, TABLE_NAME);
        conn.release();
        res = JSON.parse(JSON.stringify(res));
        for (let i = 0, l = res.length; i < l; i++) {
            let r       = res[i];
            r["voting"] = r["is_upvote"] === 0 ? -1 : 1;
            delete r.is_upvote;
        }
        return res;
    }

    static async #voteUsers(post_id, is_upvote) {
        let conn = await newConnection();
        let res  = await newQuery(conn, (conn_, res, rej, pid) => {
            let sql = `SELECT user_id FROM ${TABLE_NAME} WHERE post_id = ${conn_.escape(pid)} and is_upvote = ${is_upvote ? 1 : 0}`;
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

    static async upvoteUsers(post_id) {
        return await this.#voteUsers(post_id, true);
    }

    static async downvoteUsers(post_id) {
        return await this.#voteUsers(post_id, false);
    }
}

export function createVoting(connection, resolve, reject) {
    let sql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
               post_id   VARCHAR(96)   NOT NULL,
               user_id   VARCHAR(96)   NOT NULL,
               is_upvote BOOLEAN,
               PRIMARY KEY (post_id, user_id, is_upvote),
               FOREIGN KEY (post_id) REFERENCES posts(id),
               FOREIGN KEY (user_id) REFERENCES users(id))`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

function votingInsertion(connection, resolve, reject, voting) {
    voting     = voting[0];
    let sql    = `INSERT INTO ${TABLE_NAME} SET ? `;
    let values = {
        post_id  : voting.post_id,
        user_id  : voting.user_id,
        is_upvote: voting.is_upvote,
    };
    connection.query(sql, values, err => {
        if (err) reject(err);
        else resolve();
    });
}

function votingUpdate(connection, resolve, reject, voting) {
    voting  = voting[0];
    let sql = `UPDATE ${TABLE_NAME} SET
                 is_upvote = ?
                 WHERE post_id = ? AND user_id = ?`;
    connection.query(sql, [
        voting.is_upvote, voting.post_id, voting.user_id
    ], err => {
        if (err) reject(err);
        else resolve();
    });
}

function votingDeletion(connection, post_id) {
    return new Promise((resolve, reject) => {
        let sql = `DELETE FROM ${TABLE_NAME}
               WHERE post_id = ${connection.escape(post_id)}`;
        connection.query(sql, err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function votingQuery(connection, post_id, user_id) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM ${TABLE_NAME} 
               WHERE post_id = ${connection.escape(post_id)} AND user_id = ${connection.escape(user_id)}`;
        connection.query(sql, (err, res) => {
            if (err) reject(err);
            else {
                if (res.length !== 1) resolve(null);
                else resolve(res[0]);
            }
        });
    });
}

function votingQueryAll(connection, resolve, reject, user_id) {
    let sql = `SELECT post_id, is_upvote FROM ${TABLE_NAME} WHERE user_id = ${connection.escape(user_id)}`;

    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

function votingScore(connection, resolve, reject, post_id) {
    post_id = post_id[0];
    let sql =
            `SELECT
                (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE post_id = ${connection.escape(post_id)} AND is_upvote = '1')
                -
                (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE post_id = ${connection.escape(post_id)} AND is_upvote = '0')
            AS res`;

    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res[0]["res"]);
    });
}