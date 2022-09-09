import {newConnection, newQuery, selectAll} from "../dbAgent.js";
import {Journal}                            from "./journal.js";

const TABLE_NAME = 'tags';

export class Tag {
    constructor(tag_name, journal_id) {
        this.tag_name   = tag_name;
        this.journal_id = journal_id;
    }

    async insert() {
        let conn = await newConnection();
        await newQuery(conn, tagInsertion, this);
        conn.release();
    }

    static async deleteAllByJournalId(journal_id) {
        let conn = await newConnection();
        await newQuery(conn, tagDeletion, journal_id);
        conn.release();
    }

    static async getTags(journal_id) {
        let conn  = await newConnection();
        const res = await newQuery(conn, getTags, journal_id);
        conn.release();
        const tags = [];
        for (let i = 0, l = res.length; i < l; i++) {
            tags.push(res[i]);
        }
        return tags;
    }

    static async searchJournals(tag_name) {
        let conn = await newConnection();
        let res  = await newQuery(conn, searchJournals, tag_name);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = (await Journal.getJournalById(res[i].journal_id))[0];
        }
        return res;
    }

    static async search(tag_name) {
        let conn = await newConnection();
        let res  = await newQuery(conn, fuzzySearch, tag_name);
        conn.release();
        for (let i = 0, l = res.length; i < l; i++) {
            res[i] = res[i].tag_name;
        }
        return res;
    }

    static async dataset() {
        let conn = await newConnection();
        let res  = await newQuery(conn, selectAll, TABLE_NAME);
        conn.release();
        res = JSON.parse(JSON.stringify(res));
        return res;
    }
}

export function createTags(connection, resolve, reject) {
    let sql = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
               tag_name   VARCHAR(96) NOT NULL ,
               journal_id VARCHAR(96) NOT NULL ,
               PRIMARY KEY (tag_name, journal_id),
               FOREIGN KEY (journal_id) REFERENCES journals(id))`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

function tagInsertion(connection, resolve, reject, tag) {
    tag        = tag[0];
    let sql    = `INSERT INTO ${TABLE_NAME} SET ? `;
    let values = {
        tag_name  : tag.tag_name,
        journal_id: tag.journal_id
    };
    connection.query(sql, values, err => {
        if (err) reject(err);
        else resolve();
    });
}

function tagDeletion(connection, resolve, reject, journal_id) {
    let sql = `DELETE FROM ${TABLE_NAME} WHERE journal_id = ${connection.escape(journal_id)}`;
    connection.query(sql, err => {
        if (err) reject(err);
        else resolve();
    });
}

function getTags(connection, resolve, reject, journal_id) {
    let sql = `SELECT tag_name FROM ${TABLE_NAME} WHERE journal_id = ${connection.escape(journal_id)}`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

function searchJournals(connection, resolve, reject, tag_name) {
    let sql = `SELECT DISTINCT journal_id FROM ${TABLE_NAME}
               WHERE tag_name LIKE '%${tag_name}%'`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

function fuzzySearch(connection, resolve, reject, tag_name) {
    tag_name = tag_name.toString();
    let sql  = `SELECT DISTINCT tag_name FROM ${TABLE_NAME}
               WHERE LOWER(tag_name) LIKE '%${tag_name.toLowerCase()}%'`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}