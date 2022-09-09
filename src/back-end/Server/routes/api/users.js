import express from 'express';
let router = express.Router();
import {User}            from "../../../Database/utils/user.js";
import {
    C200,
    C400, C500, EERR_STAT,
    SUCC_STAT, UERR_STAT
}                        from "../../util.js";

// Handle request for all users
router.get('/', (req, res) => {
    res.status(501).json({message: 'handler not in use.'})
});

// Handle request for specific user by ID
router.get('/:id', (req, res) => {
    res.status(501).json({message: 'handler not in use.'})
});

// handle request for user stats
router.post('/userStats', (req, res) => {
    getUserStats(req.body.userId, res);
});
// gets statistic data belonging to a user
async function getUserStats(userId, res) {
    if (userId !== undefined) {
        try {
            const statistics = (await User.getStatistics(userId));
            console.log("hello");
            console.log(statistics.user_favourite.length);
            res.status(C200).json({
                favourites: statistics.user_favourite.length
            });
        } catch (e) {
            res.status(C500).json({
                message: "could not retrieve stats"
            });
        }
    }
}

export default router;
