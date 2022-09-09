import express      from 'express';
import {Favourite}  from "../../../Database/utils/favourite.js";
import {C200, C500} from "../../util.js";

let router = express.Router();

/**
 * Creates a new favourite linking a user with a post they have favourited 
 * If user has already favourited the post then it removes the link, undoing the favourite
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/favourite', async (req, res) => {
    const favourite = new Favourite(req.body.postId, req.body.userId);
    try {
        if (await favourite.favorite()) {
            await favourite.delete();
        } else {
            await favourite.insert(); // insert to database
        }
        res.status(C200).json({
            favourite: await favourite.favorite()
        });
    } catch (error) {
        res.status(C500).json({
            message: "Unexpected database error has occurred." + error.message
        });
        console.error(error.message);
    }
});

/**
 * Checks if a favourite exists - checks if a user has favourited a given post
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/isFavourite', async (req, res) => {
    const favourite = new Favourite(req.body.postId, req.body.userId);
    try {
        res.status(C200).json({
            favourite: await favourite.favorite() // check if its a favourite
        });
    } catch (error) {
        res.status(C500).json({
            message: "Unexpected database error has occurred." + error.message
        });
        console.error(error.message);
    }
});

export default router;