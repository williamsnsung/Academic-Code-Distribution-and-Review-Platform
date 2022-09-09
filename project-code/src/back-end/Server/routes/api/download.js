import express from 'express';
import {Post} from "../../../Database/utils/post.js";
import {C400} from "../../util.js";

let router = express.Router();

/**
 * Handles functionality for downloading a post from the site.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.get('/', async (req, res) => {
    const postId = req.query.postId;
    if (postId === undefined || postId == null) {
        res.status(C400).json({
            message: "PostId Error."
        });
        return;
    }
    // get the post
    const posts = await Post.getPostById(postId);
    if (posts.length !== 1) {
        res.status(C400).json({
            message: "Database conflicts."
        });
    } else {
        res.download(posts[0].filePath); // respond with a download of the post
    }
});

export default router;