import express     from 'express';
import { Post }    from '../../../Database/utils/post.js';
import { Journal } from '../../../Database/utils/journal.js';
import { User }    from '../../../Database/utils/user.js';
import { C200 }    from '../../util.js';
import { Tag }     from '../../../Database/utils/tag.js';

let router = express.Router();

/**
 * Searches for and responds with posts that match the keyword using fuzzy search.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/post', async (req, res) => {
    const keyword = req.body.keyword;
    const posts   = await Post.search(keyword);
    try {
        res.status(C200).json({posts: posts});
    } catch (error) {
        console.log(error);
    }
});

/**
 * Searches for and responds with journals that match the keyword using fuzzy search.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/journals', async (req, res) => {
    const keyword  = req.body.keyword;
    const journals = await Journal.search(keyword);
    journals.concat(await Tag.searchJournals(keyword));
    try {
        res.status(C200).json({journals: journals});
    } catch (error) {
        console.log(error);
    }
});

/**
 * Searches for and responds with users that match the keyword using fuzzy search.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/users', async (req, res) => {
    const keyword = req.body.keyword;
    const users   = await User.search(keyword);
    try {
        res.status(C200).json({users: users});
    } catch (error) {
        console.log(error);
    }
});


/**
 * Searches for and responds with tags that match the keyword using fuzzy search.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/tags', async (req, res) => {
    const keyword = req.body.keyword;
    const tags    = await Tag.search(keyword);
    try {
        res.status(C200).json({tags: tags});
    } catch (error) {
        console.log(error);
    }
});

/**
 * Searches for and responds with journals that that contain a given tag.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/posttags', async (req, res) => {
    const tag_name = req.body.tag_name;
    const journals = await Tag.searchJournals(tag_name);
    try {
        res.status(C200).json({journals: journals});
    } catch (error) {
        console.log(error);
    }
});

/**
 * Searches for and responds with users that have a given role.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/role', async (req, res) => {
    const role = req.body.keyword;
    const users   = await User.getUsersByStatus(role);
    try {
        res.status(C200).json({users: users});
    } catch (error) {
        console.log(error);
    }
});

export default router;