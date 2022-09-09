/**
 * Server Entry Point.
 */

import express      from 'express';
import cors         from 'cors';
import path         from 'path';
import schedule     from 'node-schedule';
import { initDB }   from '../Database/dbAgent.js';
import { RecmdSys } from '../RecmdSys/recmdSys.js';
import { logger }   from './utils/logger.js';
import users        from './routes/api/users.js';
import post         from './routes/api/post.js';
import register     from './routes/api/register.js';
import login        from './routes/api/login.js';
import forgot       from './routes/api/forgot.js';
import downloader   from './routes/api/download.js';
import favourite    from './routes/api/favourite.js';
import comment      from './routes/api/comment.js';
import journal      from './routes/api/Journal.js';
import sgExport     from './routes/sg/resources/export.js';
import sgImport     from './routes/sg/resources/import.js';
import sgLogin      from './routes/sg/sso.js';
import search       from './routes/api/search.js';
import sgUsers	    from './routes/sg/users.js';
import {
    OFF_CAMPUS_MODE,
    PORT_NO
}                   from './util.js';

const app       = express();
const PORT      = process.env.PORT || PORT_NO;
let off_campus  = false;
global.ROOTPATH = path.resolve('.');

/* Parse Arguments */
for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === OFF_CAMPUS_MODE) {
        off_campus = true;
    }
}

console.log(`Off-campus Connection Mode: ${off_campus}. Connect to the database from off-campus: add flag '--off'.`);

(async () => {
    console.log('Starting server...');
    try {
        await initDB(off_campus);

        try {
            await RecmdSys.export_csv();
            await RecmdSys.train();
            await scheduleRS();
        } catch (e) {
            console.warn(`Deploy server without Recommender System - Recommender System Error: ${e}`);
        }

        app.use(express.json());
        app.use(express.urlencoded({extended: false}));
        app.use(cors());
        app.use(logger);    // initialise request logger

        app.use('/api/users', users);
        app.use('/api/post', post);
        app.use('/api/register', register);
        app.use('/api/login', login);
        app.use('/api/forgot', forgot);
        app.use('/sg/sso', sgLogin);
        app.use('/api/sg/sso/login', login);
        app.use('/api/comment', comment);
        app.use('/sg/resources/export', sgExport);
        app.use('/sg/resources/import', sgImport);
	app.use('/sg/users/', sgUsers);
        app.use('/api/download', downloader);
        app.use('/api/favourite', favourite);
        app.use('/api/journal', journal);
        app.use('/api/search', search);

        app.get('/hi', (req, res) => res.send('hello world')); // This is for testing purposes only
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (err) {
        console.error(err);
    }
})();


/* schedule RS jobs */
async function scheduleRS() {
    const rule  = new schedule.RecurrenceRule();
    rule.hour   = 0;
    rule.minute = 0;
    rule.second = 0;
    schedule.scheduleJob(rule, async () => {
        try {
            await RecmdSys.export_csv();
            await RecmdSys.train();
            console.log(`RS Schedule Start at ${new Date().toString()}`);
        } catch (e) {
            console.error(`RS ERROR: ${e} at ${new Date().toString()}`);
        }
    });
    console.log(`RS Task: Scheduled at ${rule.hour}:${rule.minute}:${rule.second} every day`);
}



