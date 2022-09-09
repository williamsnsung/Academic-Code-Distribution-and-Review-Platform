import {newConnection, newQuery, pool} from "../../Database/dbAgent.js";

const DATABASE = 'tz36_Team3';

describe('Database Environment', () => {
    let connection = undefined;

    beforeEach(async () => connection = await newConnection());

    afterEach(async () => connection.release());

    test('Database Connection Pooling', async () => {
        expect(pool).not.toBeNull();
        expect(pool).not.toBeUndefined();
    });

    test('Database Initialization', async () => {
        /* Database Check */
        let sql    = 'SHOW DATABASES';
        let result = await newQuery(connection, (con, resolve) => {
            con.query(sql, (err, result) => {
                expect(err).toBeNull();
                resolve(result);
            });
        });
        expect(result).toContainEqual({Database: DATABASE});

        /* Tables Check */
        sql    = 'SHOW TABLES';
        result = await newQuery(connection, (con, resolve) => {
            con.query(sql, (err, result) => {
                expect(err).toBeNull();
                resolve(result);
            });
        });
        expect(result).toEqual(expect.arrayContaining([
                {Tables_in_tz36_Team3: 'users'},
                {Tables_in_tz36_Team3: 'posts'}
            ])
        );
    });
});