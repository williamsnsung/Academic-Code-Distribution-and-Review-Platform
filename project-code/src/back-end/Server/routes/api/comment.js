import express           from "express";
import {validateComment} from "../../utils/validate.js";
import {Comment}         from "../../../Database/utils/comment.js";
import {Post}            from "../../../Database/utils/post.js";
import {User}            from "../../../Database/utils/user.js";
import {
    C200,
    C400, C500, EERR_STAT,
    SUCC_STAT, UERR_STAT
}                        from "../../util.js";
import {genUUID}         from "../../utils/generator.js";
import {notify}          from "../../utils/notification.js"

let router = express.Router();

/**
 * Handle request to fetch all posts.
 * Example url: /post?number=20
 */
router.get('/', async (req, res) => {
    const postId = req.query.postId;
    if (postId !== undefined) {
        const post     = (await Post.getPostById(postId))[0];
        const comments = await Comment.getCommentByPost(post);
        res.status(C200).json({
            comments: comments
        });
    }
});

/**
 * Handle request to get the number of comments belonging to a given user
 */
router.post('/count', async (req, res) => {
    const userId = req.body.userId;

    if (userId !== undefined) {
        try {
            const comments = await Comment.getCommentByUserId(userId);
            res.status(C200).json({
                count: comments.length
            });
        } catch (e) {
            res.status(C500).json({
                message: "could not retrieve count of comments"
            });
        }
    }
});

/**
 * Handle request to delete a comment.
 */
router.post('/delete', async (req, res) => {
    await deleteComment(req.body, res);
});

/**
 * Handle request to create a new comment.
 */
router.post('/', async (req, res) => {
    const result = validateComment(req.body);
    switch (result.status) {
        case SUCC_STAT:
            await createComment(req.body, res);
            break;
        case EERR_STAT:
            res.status(C400).json({
                message: result.message
            });
            break;
        case UERR_STAT:
            res.status(C500).json({
                message: result.message
            });
            break;
    }
});

/**
 * Functionality for creating a new comment
 * @param {{comment,userId,postId}} data comment data from client
 * @param {*} res response to client
 */
async function createComment(data, res) {
    try {
        // create comment
        const user    = (await User.getUserByID(data.userId))[0];
        const post    = (await Post.getPostById(data.postId))[0];
        const date    = new Date();
        const comment = new Comment(
            genUUID(post.id), post, user, 0,
            "", true, date, date, date, data.comment
        );
        
        await comment.insert();                 // insert comment into database
        await callNotifier(data,post.user);     // notify post owner about the comment they have received

        res.status(C200).json({
            message: `Comment : ${comment.id}.`
        });

    } catch (e) {
        console.log(e);
        res.status(C500).json({
            message: "Unexpected database error has occurred."
        });
    }
}

/**
 * call functionality to notify post author about new comment
 * @param {{comment,userId,postId}} data comment data from client
 * @param {JSON} author the author of the post
 */
async function callNotifier(data, author){
    notify(data, author.email);
}

/**
 * call functionality to notify post author about new comment
 * @param {*} data comment data from client
 * @param {*} res response to client
 */
async function deleteComment(data, res) {
    try {
        const comments = await Comment.getCommentById(data.id);
        const comment = comments[0];
        await comment.delete();
        res.status(C200).json({
            message: `Comment Deleted`
        });

    } catch (e) {
        console.log(e);
        res.status(C500).json({
            message: "Unexpected database error has occurred."
        });
    }
}


export default router;
