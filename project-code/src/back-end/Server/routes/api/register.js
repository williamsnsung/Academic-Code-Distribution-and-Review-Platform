import express                  from 'express';
import { validateRegistration } from '../../utils/validate.js';
import { genToken }             from '../../utils/token.js';
import { User }                 from '../../../Database/utils/user.js';
import { genUUID }              from '../../utils/generator.js';
import {
    C200,
    C400,
    C500,
    EERR_STAT,
    ID_POSTFIX,
    SUCC_STAT,
    UERR_STAT
}                               from '../../util.js';

let router = express.Router();

/**
 * GET exclusively for testing purposes - no real functionality
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.get('/', (req, res) => {
    console.log('-- REGISTER GETTER');
    res.json({message: 'OK'});
});

/**
 * Handling for user registration form - validates user inputs and registers users to database.
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/', async (req, res) => {
    const result = validateRegistration(req.body);   // check if input is valid
    switch (result.status) {

        case SUCC_STAT:                             /* VALID INPUT OUTCOME */
            console.log('-- VALID INPUT');
            await registerNewUser(req.body, res);
            const test = await User.getUserByEmailName(req.body.email,req.body.lastname,req.body.firstname);
            console.log(test.token);
            break;

        case EERR_STAT:                             /* INVALID INPUT OUTCOME */
            res.status(C400).json({
                message: result.message
            });
            console.error(`-- INVALID INPUT: ${result.message}`);
            break;

        case UERR_STAT:                             /* SERVER ERROR OUTCOME */
            res.status(C500).json({
                message: result.message
            });
            console.error(`-- SERVER ERROR: ${result.message}`);
            break;
    }
})
;

/* USER REGISTRATION */

/**
 * Attempts to add user to the database to complete the registration process.
 * This is the core server-side user registration function.
 *
 *  register account data from client
 * @param {*} data request body
 * @param {Response} res response to client
 * @returns {Promise<void>}
 */
async function registerNewUser(data, res) {
    try {
        // create user with freshly generated unique user ID
        let id = genUUID(ID_POSTFIX);
        const user = new User(
            id, data.firstname, data.lastname, data.gender,
            data.email, data.phone, data.password, data.role, new Date(),
            null // Generate token later.
        );
        user.token = genToken(user);

        // if user id is already in use, error
        if (await user.isRegistered()) {
            res.status(C400).json({
                message: 'There is such a user in the database.'
            });
            console.error('---- FAILURE: UUID is not unique');

        // otherwise add to database
        } else {    
            await user.insert();
            res.status(C200).json({
                message: `User registration successful - welcome ${res.firstname}.`,
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
            console.log('---- SUCCESS');
        }
    } catch (error) {
        res.status(C500).json({
            message: 'Unexpected database error has occurred.' + error.message
        });
        console.error(error.message);
    }
}

export default router;
