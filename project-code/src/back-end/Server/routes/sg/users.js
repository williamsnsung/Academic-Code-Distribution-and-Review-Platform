import express from 'express';
let router = express.Router();
import axios                    from 'axios';
import {verifyJWT}                from "../../utils/token.js";
import {User} from '../../../Database/utils/user.js';
import {
    C200,
    C400,
    C500,
    EERR_STAT,
    SUCC_STAT,
    UERR_STAT
}                               from "../../util.js";

// export user details to another journal
router.get('/:id', async (req, res) => {
    //let err = verifyJWT(req);
    // let err ;
    //if (err != null)
    //        res.status(C400).json({"status": "error", "message": "bad token"});
    //else {
        try {
            var user = await User.getUserByID(req.params.id);
            if (user.length > 0) {
                user = user[0];
                let fn = user.fn;
                const data = {
                        "status": "ok",
                        "name": fn.concat(user.ln),
                        "email": user.email,
                        "id": user.id
                };
                res.status(C200).json(data);
            }
            else {
                console.error("user does not exist")
                res.status(C400).json({"status": "error", "message": "user does not exist"});
                }
        } catch (error) {
                console.error(error);
                res.status(C500).json({"status": "error", "message": error});
        }
    //}
});

export default router;

