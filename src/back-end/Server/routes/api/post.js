import express    from 'express';
import fs         from 'fs';
import fileUpload from 'express-fileupload';
import isImage    from 'is-image';
import path       from 'path';

import { Post }                             from '../../../Database/utils/post.js';
import { C200, C400, C500, getVideoHeader } from '../../util.js';
import { Voting }                           from '../../../Database/utils/voting.js';
import { History }                          from '../../../Database/utils/history.js';

let router = express.Router();
router.use(fileUpload());

/**
 * Handle request to fetch all posts.
 * Example url: /post?number=20
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.get('/', async (req, res) => {
    const number = req.query.number;
    if (number !== undefined) {
        const posts = await Post.getRandomPosts(number);
        res.status(C200).json({
            message: `${number} posts from Database.`,
            posts  : posts
        });
    }
});


/**
 * Handle request to fetch all posts belonging to a particular user.
 * Utalises userID to find all posts that a user has created.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.get('/userPosts', async (req, res) => {
    const userId = req.query.userId;
    if (userId !== undefined) {
        const posts = await Post.getPostByUserId(userId);
        res.status(C200).json({
            message: `${userId}'s posts from Database.`,
            posts  : posts
        });
    }
});

/**
 * Redirect to post page by post ID.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/postFile', async (req, res) => {
    const postId = decodeURI(req.body.postId);
    const userId = req.body.userId;

    // check if the id exists
    if (postId === undefined || postId == null) {
        res.status(C400).send('Post Id does not exist');
        return;
    }

    // check if the post of the given id exists
    const posts = await Post.getPostById(postId);
    if (posts.length !== 1) {
        res.status(C400).send('Database Conflicts');
        return;
    }

    // attempt to create a new history element which indicates that the user has visited the page
    try {
        if (userId !== null) {
            const h = new History(postId, userId, new Date());
            await h.insert();
        }
    } catch (ignore) {
    }

    // assemble and send post data to client
    try {
        const post = posts[0];
        const data = {
            message: `Post: ${postId}`,
            post   : post,
            score  : await Voting.score(postId),
            vote   : await Voting.queryVoting(postId, userId)
        };
        if (isImage(post.filePath)) {
            data['image'] = post.filePath;
        } else if (getVideoHeader(post.filePath) != null) {
            data['video']        = post.filePath;
            data['video_header'] = getVideoHeader(post.filePath);
        } else {
            data['data'] = (await readFile(post.filePath)).toString();
        }
        res.status(C200).json(data);
    } catch (error) {
        res.status(C500).send('File not found');
        console.log(error);
    }
});

/**
 * Functionality for retrieving an image file.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.get('/image', async (req, res) => {
    res.status(C200).sendFile(path.resolve(req.query.path));
});

/**
 * Functionality for retrieving a video file.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.get('/video', async (req, res) => {
    const filepath = req.query.path;
    const stat     = fs.statSync(filepath);
    const size     = stat.size;
    const header   = {
        'Content-Length': size,
        'Content-Type'  : getVideoHeader(filepath)
    };
    res.writeHead(200, header);
    fs.createReadStream(filepath).pipe(res);
});

/**
 * Functionality for updating the contents of a post.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/updatePost', async (req, res) => {
    const postId = req.body.postId;
    // check if the id exists
    if (postId === undefined || postId == null) {
        res.status(C400).send('Post Id does not exist');
        return;
    }

    // check if the post of the given id exists
    const posts = await Post.getPostById(postId);
    if (posts.length !== 1) {
        res.status(C400).send('Database Conflicts');
        return;
    }

    // attempt to perform the update
    try {
        const post        = posts[0];
        const update_date = new Date();
        post.update_date  = update_date;
        await post.update();
        const newContent = req.body.content;
        await writeFile(post.filePath, newContent);
        res.status(C200).json({
            message: `Post: ${postId} has been updated.`,
            date   : update_date
        });

    } catch (error) {
        res.status(C500).send('Unexpected database error has occurred.' + error.message);
        console.error(error.message);
    }
});

/**
 * Attempts to delete a post from the database.
 * Will also attempt to delete all children (comment) nodes.
 * @param {Request} req should contain the postId of a post to delete.
 * @param {Response} res response to client
 */
router.post('/delete', async (req, res) => {
    const postId = req.body.postId;
    // check if the id exists
    if (postId === undefined || postId == null) {
        res.status(C400).send('Post Id does not exist');
        return;
    }

    // check if the post of the given id exists
    const posts = await Post.getPostById(postId);
    if (posts.length !== 1) {
        res.status(C400).send('Database Conflicts');
        return;
    }

    try {
        await posts[0].delete();                // Delete the post from db.
        res.status(C200).send('success');
    } catch (error) {
        res.status(C500).send('Unexpected database error has occurred.' + error.message);
        console.error(error.message);
    }
});

/**
 * Functionality for upvote or downvote functionality affecting the score of a post
 * @param {Request} req request from client
 * @param {Response} res response to client
 */
router.post('/voting', async (req, res) => {
    const postId   = req.body.postId;
    const userId   = req.body.userId;
    const isVote   = req.body.isVote;
    const isUpvote = req.body.isUpvote;

    try {
        const voted = await Voting.queryVoting(postId, userId);
        if (isVote) {
            const voting = new Voting(postId, userId, isUpvote);
            if (voted === null) {
                await voting.insert();
            } else {
                await voting.update();
            }
        } else if (voted !== null) {
            await Voting.delete(postId, userId);
        }
        res.status(C200).send('success');
    } catch (error) {
        console.log(error);
        res.status(C200);
    }
});

/* UPLOAD POST */

/**
 * Functionality for reading the content of a file given a correct file path
 * @param {path} filepath path of the file to read
 */
function readFile(filepath) {
    return new Promise((res, rej) => {
        fs.readFile(filepath, (err, data) => {
            if (err) rej(err); else res(data);
        });
    });
}

/**
 * Functionality for writing content to a file given a correct file path
 * @param {path} filepath path of the file to write to
 * @param {*} content what to write to the file thus updating it
 */
function writeFile(filepath, content) {
    return new Promise((res, rej) => {
        fs.writeFile(filepath, content, (err) => {
            if (err) rej(err); else res();
        });
    });
}

/**
 * Handle request to fetch all posts belonging to a particular user.
 * Utalises userID to find all posts that a user has created.
 * @param {Request} req request from client
 * @param {Response} res response to client
 */
router.get('/userHistory', async (req, res) => {
    const userId = req.query.userId;
    if (userId !== undefined) {
        const history = await History.getHistory(userId); // fetch user history
        let output    = [];

        try {
        // use history data and additional data from the post to create new json objects - add new objects to output array
        for (let i = 0; i < history.length; i++) {
            const post = await Post.getPostById(history[i].post_id);
            if (post[0] !== undefined) {
                let x = {
                    post_id   : post[0].id,
                    post_title: post[0].title,
                    accesstime: history[i].accesstime,
                    author    : post[0].user.fn + ' ' + post[0].user.ln
                };
                output.push(x);
            }
        }

        res.status(C200).json({
            message: `${userId}'s history from Database.`,
            history: output
        });
        } catch (e) {
            res.status(C500).json({
                message: "could not retrieve hitory"
            });
        }
    }
});

export default router;
