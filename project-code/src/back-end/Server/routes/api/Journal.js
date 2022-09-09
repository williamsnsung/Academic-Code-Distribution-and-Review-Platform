import fs                                                                 from 'fs';
import express                                                            from 'express';
import fileUpload                                                         from 'express-fileupload';
import { RecmdSys }                                                       from '../../../RecmdSys/recmdSys.js';
import { validateNewJournal }                                             from '../../utils/validate.js';
import { C200, C400, C500, EERR_STAT, JOURNAL_DIR, SUCC_STAT, UERR_STAT } from '../../util.js';
import { User }                                                           from '../../../Database/utils/user.js';
import { Post }                                                           from '../../../Database/utils/post.js';
import { Journal }                                                        from '../../../Database/utils/journal.js';
import { genUUID }                                                        from '../../utils/generator.js';

let router = express.Router();
router.use(fileUpload());

router.get('/', async (req, res) => {
    const number = req.query.number;
    const uid    = req.query.uid;
    let jrnl_lst = [];
    if (uid !== undefined && number !== undefined) {
        try {
            const jrnl_ids = await RecmdSys.query(uid, number);
            for (let i = 0; i < jrnl_ids.length; i++) {
                const jid   = jrnl_ids[i];
                const jrnls = await Journal.getJournalById(jid);
                if (jrnls.length > 0) jrnl_lst.push(jrnls[0]);
            }
        } catch (e) {   // if RS is down, send random journals
            jrnl_lst = await Journal.getRandomJournals(number);
        }
    } else if (number !== undefined) {
        jrnl_lst = await Journal.getRandomJournals(number);
    }
    res.status(C200).json({
        message : `${number} posts from Database.`,
        journals: jrnl_lst
    });
});

router.get('/userJournals', async (req, res) => {
    const userId = req.query.userId;
    if (userId !== undefined) {
        const journals = await Journal.getJournalByUserId(userId);
        res.status(C200).json({
            message : `${userId}'s posts from Database.`,
            journals: journals
        });
    }
});

router.get('/posts', async (req, res) => {
    const journalId = req.query.journal_id;
    if (journalId !== undefined) {
        const posts = await Journal.getPostsInJournal(journalId);
        res.status(C200).json({
            posts: posts
        });
    }
});

router.post('/', async (req, res) => {
    const result = validateNewJournal(req);   // check if input is valid
    switch (result.status) {
        /* VALID INPUT OUTCOME */
        case SUCC_STAT:
            await newJournal(req, res);
            break;

        /* INVALID INPUT OUTCOME */
        case EERR_STAT:
            res.status(C400).send(result.message);
            break;

        /* SERVER ERROR OUTCOME */
        case UERR_STAT:
            res.status(C500).send(result.message);
            break;
    }
});

router.get('/delete', async (req, res) => {
    const journalId = req.query.journal_id;
    const journal   = (await Journal.getJournalById(journalId))[0];
    try {
        await journal.delete();
        fs.rmSync(journal.location, {recursive: true});
        res.status(C200).send('success');
    } catch (error) {
        res.status(C500);
        console.error(error.message);
    }
});

/**
 * Attempts to add new post to the database to complete the upload process.
 * This is the core server-side post upload function.
 *
 * @param data register account data from client
 * @param {*} res response to client
 */
async function newJournal(data, res) {
    const body              = JSON.parse(data.body.data);
    let files               = data.files.files;
    files                   = files.length === undefined ? [files] : files;
    const userid            = body.userid;
    const title             = body.title;
    const description       = body.description;
    const tags              = body.tags;
    const date              = new Date();
    const post_descriptions = body.post_descriptions;

    const journalId = genUUID(title).split(':')[0];
    const location  = `${JOURNAL_DIR}${journalId}/`;

    try {
        const users = await User.getUserByID(userid);
        if (users.length !== 1) { // if user does not exist - error
            res.status(C400).send('User does not exist');
        } else {
            await mkFolder(JOURNAL_DIR);
            await mkFolder(location);

            const journal = new Journal(
                journalId, users[0], title, description, location, date, date, null, tags
            );
            await journal.insert();
            for (let i = 0; i < files.length; i++) {
                const f        = files[i], fn = f.name;
                const postId   = genUUID(fn).split(':')[0];
                const filepath = location + postId;

                let post_description = post_descriptions[`post_description_${fn}`];
                if (post_descriptions === undefined) post_description = 'No description';

                await saveFile(f, filepath);
                const post = new Post(
                    postId, users[0], '0', `${title}: ${fn}`, fn,
                    post_description,
                    true, date, date, null, filepath
                );
                await journal.addPost(post);
            }
            res.status(C200).send('Upload successful');
        }
    } catch (error) {
        res.status(C500).send('Unexpected database error has occurred.' + error.message);
        console.error(error.message);
    }
}

/**
 * Saves file in server local file space.
 *
 * @param {*} file file to save
 * @param {*} filePath where to save it
 */
function saveFile(file, filePath) {
    // Use the mv() function to place the file on the server filespace
    return new Promise(((resolve, reject) => {
        file.mv(filePath, (err) => {
            if (err) reject(err); else resolve();
        });
    }));
}

function mkFolder(path) {
    return new Promise((res, rej) => {
        fs.mkdir(path, () => res());
    });
}

export default router;