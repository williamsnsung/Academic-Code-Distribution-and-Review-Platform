import express                                               from 'express';
import { User }                                              from '../../../Database/utils/user.js';
import { C200, C400, C500, EERR_STAT, SUCC_STAT, UERR_STAT } from '../../util.js';
import { validateLogin }                                     from '../../utils/validate.js';

let router = express.Router();
const ONE  = 1;

// Handling for login registration form - validates user inputs and logins users
router.post('/', async (req, res) => {
    const result = validateLogin(req.body);   // check if input is valid
    switch (result.status) {
        case SUCC_STAT:   // if input validation passed - process request
            console.log('-- VALID INPUT');
            await loginUser(req.body, res);
            break;
        case EERR_STAT:   // if input validation not passed or wrong data format received - send appropriate 400 bad request
            res.status(C400).json({
                message: result.message
            });
            console.error(`-- INVALID INPUT: ${result.message}`);
            break;
        case UERR_STAT:  // 500 internal server error - error not a result of client input
            res.status(C500).json({
                message: result.message
            });
            console.error(`-- SERVER ERROR: ${result.message}`);
            break;
    }
});

/* USER LOGIN */

/**
 * Attempts to check validate user id and password to complete the login process.
 * This is the core server-side user login function.
 *
 * @param {{userid,password}} data login account data from client
 * @param {*} res response to client
 */
async function loginUser(data, res) {
    try {
        const users = await User.getUserByID(data.userid);
        if (users.length !== ONE) {     // if user does not exist - error
            res.status(C400).json({
                message: 'User does not exist.'
            });
        } else if (data.password !== users[0].psw) {
            res.status(C400).json({
                message: 'Invalid Login.'
            });
        } else {                        // if user exists
            const user = users[0];
            res.status(C200).json({
                message: 'User login successful.',
                user   : {
                    id        : user.id,
                    fn        : user.fn,
                    ln        : user.ln,
                    email     : user.email,
                    status    : user.status,
                    token     : user.token,
                    phone     : user.phone,
                    regis_date: user.regis_date
                }
            });
        }
    } catch (err) {
        console.log(err);
        res.status(C500).json({
            message: 'Unexpected database error has occurred.'
        });
    }
}

export default router;
