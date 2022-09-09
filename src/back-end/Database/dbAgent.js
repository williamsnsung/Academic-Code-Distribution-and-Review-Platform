/**
 * Use this agent to manipulate database.
 */

import {createUsers}                      from "./utils/user.js";
import {createPosts}                      from "./utils/post.js";
import {createComments}                   from "./utils/comment.js";
import {createFavourite}                  from "./utils/favourite.js";
import {createJournal, createJournalPost} from "./utils/journal.js";
import mysql                              from 'mysql';
import {createVoting}                     from "./utils/voting.js";
import {createTags}                       from "./utils/tag.js";
import {createHistory}                    from "./utils/history.js";

/* DATABASE CONFIG */

const DATABASE    = 'tz36_Team3';
const DB_HOST     = 'tz36.host.cs.st-andrews.ac.uk';
const DB_USER     = 'tz36';
const DB_PASSWORD = 'YmJip2.1GkYr4D';

/*
 * CONNECT TO DATABASE IN CAMPUS:
 */

const POOL_ON = mysql.createPool({
    host    : DB_HOST,
    user    : DB_USER,
    password: DB_PASSWORD,
    database: DATABASE
});

/*
 * CONNECT TO DATABASE FROM OFF-CAMPUS:
 * - run below:
 *   ssh -o ProxyCommand=none <username>@<username>.host.cs.st-andrews.ac.uk -L 3306:<username>.host.cs.st-andrews.ac.uk:3306 -N
 * - DO NOT terminate and then select CONN_OC to connect to database.
 * - Read more:
 *   https://systems.wiki.cs.st-andrews.ac.uk/index.php/Using_SSH#Example:_Tunneling_a_MySQL_connection_via_the_Linux_Host_servers
 */

const DB_HOST_OC = 'localhost';
const DB_PORT_OC = 3306;
const POOL_OFF   = mysql.createPool({
    host    : DB_HOST_OC,
    port    : DB_PORT_OC,
    user    : DB_USER,
    password: DB_PASSWORD,
    database: DATABASE,
});

/* SELECT YOUR CONNECTION MODE HERE! */
export let pool  = null;
let db_connected = false;

/**
 * Establish a new pooling connection.
 * Rather than creating and managing connections one-by-one,
 * a connection pool is a cache of database connections maintained
 * so that the connections can be reused when future requests to the database are required.
 * WARNING: Instead of establishing a connection directly using this function,
 *          you should use well-tested wrapper functions defined in related data types. (e.g. User.isRegistered()).
 * @returns {Promise} A proxy for a connection that will eventually become available.
 */
export function newConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) reject(err);
            else resolve(connection);
        });
    });
}

/**
 * A query to view, add, delete, or change data in database.
 * @param connection Activated connection.
 * @param queryFunc{Function} A function to do a query.
 * @param args Arguments be passed to function queryFunc.
 * @returns {Promise} A proxy for a Query that will eventually become available.
 */
export function newQuery(connection, queryFunc, ...args) {
    return new Promise((resolve, reject) => {
        queryFunc(connection, resolve, reject, args);
    });
}

/**
 * Initialize database by creating/checking compulsory tables.
 * @param offMode{boolean} true for POOL_OFF, false for POOL_ON
 * @returns {Promise<void>}
 */
export async function initDB(offMode) {
    if (db_connected) return;

    pool     = offMode ? POOL_OFF : POOL_ON;
    let conn = await newConnection();

    /* switch to project database: USE tz36_Team3; */
    let sql = 'USE ' + DATABASE;
    await newQuery(conn, (con, res, rej) => {
        con.query(sql, (err) => {
            if (err) rej(err);
            else res();
        });
    });

    /* create tables if not exists */
    await newQuery(conn, createUsers);
    await newQuery(conn, createPosts);
    await newQuery(conn, createComments);
    await newQuery(conn, createFavourite);
    await newQuery(conn, createJournal);
    await newQuery(conn, createJournalPost);
    await newQuery(conn, createVoting);
    await newQuery(conn, createTags);
    await newQuery(conn, createHistory);
    conn.release();
    db_connected = true;
}

/**
 * Closing all the connections in the pool.
 */
export function disconnectDB() {
    pool.end();
    db_connected = false;
}

/**
 * A SELECT WHERE template which
 * selects records from a table with specified condition.
 * @param connection Available MySQL connection.
 * @param resolve    Connection Promise resolve.
 * @param reject     Connection Promise reject.
 * @param args
 */
export function selectWhere(connection, resolve, reject, args) {
    const tableName = args[0], condition = args[1];
    let sql         = `SELECT * FROM ${tableName} WHERE ${condition}`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}

export function selectAll(connection, resolve, reject, table_name) {
    let sql = `SELECT * FROM ${table_name}`;
    connection.query(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    });
}