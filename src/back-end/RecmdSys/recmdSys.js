import fs              from 'fs';
import csv             from 'fast-csv';
import { PythonShell } from 'python-shell';

import { disconnectDB, initDB } from '../Database/dbAgent.js';
import { User }                 from '../Database/utils/user.js';
import { Voting }               from '../Database/utils/voting.js';
import { Favourite }            from '../Database/utils/favourite.js';
import { Post }                 from '../Database/utils/post.js';
import { Journal }              from '../Database/utils/journal.js';
import { Tag }                  from '../Database/utils/tag.js';
import { History }              from '../Database/utils/history.js';

let off_campus = true;

const user_fn = 'dataset/user.csv';     // users
const vote_fn = 'dataset/vote.csv';     // voting
const favr_fn = 'dataset/favr.csv';     // favourite
const post_fn = 'dataset/post.csv';     // post
const jrnl_fn = 'dataset/jnrl.csv';     // journal
const tags_fn = 'dataset/tags.csv';     // tags
const hsty_fn = 'dataset/hsty.csv';     // history

class RecmdSys {
    static async export_csv() {
        const RS_ROOT = `${global.ROOTPATH}/RecmdSys`;
        await initDB(off_campus);

        await RecmdSys.#writeCsv(`${RS_ROOT}/${user_fn}`, await User.dataset());
        await RecmdSys.#writeCsv(`${RS_ROOT}/${vote_fn}`, await Voting.dataset());
        await RecmdSys.#writeCsv(`${RS_ROOT}/${favr_fn}`, await Favourite.dataset());
        await RecmdSys.#writeCsv(`${RS_ROOT}/${post_fn}`, await Post.dataset());
        await RecmdSys.#writeCsv(`${RS_ROOT}/${jrnl_fn}`, await Journal.dataset());
        await RecmdSys.#writeCsv(`${RS_ROOT}/${tags_fn}`, await Tag.dataset());
        await RecmdSys.#writeCsv(`${RS_ROOT}/${hsty_fn}`, await History.dataset());

        // disconnectDB();
    }

    static #writeCsv(path, json) {
        return new Promise((resolve, reject) => {
            csv.write(json, {headers: true})
                .on('error', err => reject(err))
                .on('end', () => {
                    console.log(`${path}: extracted`);
                    resolve();
                })
                .pipe(fs.createWriteStream(path));
        });
    }

    static async query(user_id, k) {
        const RS_ROOT = `${global.ROOTPATH}/RecmdSys`;
        const MD_PATH = `${RS_ROOT}/save/query_tower`;

        const user = (await User.getUserByID(user_id))[0];
        if (user === undefined) return;

        const user_args = [
            user.id,
            user.regis_date.toISOString(),
            user.gender,
            User.toStatus(user.status)
        ];
        return new Promise((resolve, reject) => {
            PythonShell.run(`${RS_ROOT}/main.py`, {
                mode: 'text',
                args: ['query', MD_PATH, k].concat(user_args)
            }, (err, res) => {
                if (err) reject(err);
                resolve(res);
            });
        });
    }

    static async train() {
        console.log('Retraining models: old models might cause conflict. It could take a while. Please wait...');
        const RS_ROOT = `${global.ROOTPATH}/RecmdSys`;
        return new Promise((resolve, reject) => {
            PythonShell.run(`${RS_ROOT}/main.py`, {
                mode: 'text',
                args: ['cs3099', RS_ROOT]
            }, (err, res) => {
                console.log('Retraining complete');
                if (err) reject(err);
                resolve(res);
            });
        });
    }
}


export { RecmdSys };