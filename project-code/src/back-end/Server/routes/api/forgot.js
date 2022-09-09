//********check passowrd again in server */
import express         from "express";
import {User}          from "../../../Database/utils/user.js";
import {genToken}      from "../../utils/token.js";
import {sendResetMail} from "../../utils/mailSender.js";
import {
    C200,
    C400,
    C500
}                      from "../../util.js";

let router = express.Router();
const ONE  = 1;

/**
 * Sends a password reset email to the users email address
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/', async (req, res) => {
    console.log("Password reset request");
    await email(req.body, res);
});

/**
 * If checks passed this changes the users password
 * @param {Request} req request from client
 * @param {Response} res response to cleint
 */
router.post('/check', async (req, res) => {
    console.log("Password reset Check");
    await check(req.body, res);
});


/**
 * Sends a password reset email to the users email address
 * @param {*} data req.body
 * @param {Response} res response to cleint
 */
async function email(data, res) {
    try {
        const users = await User.getUserByID(data.userid);
        if (users.length !== ONE) {     // if user does not exist - error**************
            console.log(data.userid);
            res.status(C400).json({
                message: "User does not exist."
            });
        } else {                        // if user exists
            const user    = users[0];
            user.token    = genToken(user).substring(0, 9);
            const subject = "Password Rest Token :" + user.token;
            const text    = "Please copy and paste this token into the appropriate textbox in the website.\n Re-enter the new password you would like to have";
            let result = sendResetMail(subject, text, user.email);
            if (result == 1){
                res.status(C200).json({
                    message: "Email sent"
                });
            }else{
                throw Error;
            }
            //console.log(user.token)
        }
    } catch (err) {
        console.log(err);
        res.status(C500).json({
            message: "Unexpected database error has occurred."
        });
    }
}

/**
 * changes a persons password if tokens match
 * @param {*} data req.body
 * @param {Response} res response to cleint
 */
async function check(data, res) {
    try {
        const users = await User.getUserByID(data.userid);
        if (users.length !== ONE) {     // if user does not exist - error
            res.status(C400).json({
                message: "User does not exist."
            });
        } else {                        // if user exists
            const user = users[0];
            if (user.token === data.token) {
                user.psw = data.password;
                //await user.update();
                res.status(C200).json({
                    message: "Password changed",
                    user   : {
                        id    : user.id,
                        fn    : user.fn,
                        ln    : user.ln,
                        email : user.email,
                        status: user.status,
                        token : user.token
                    }
                });
            }else{
                console.log(user.token);
                console.log(data.token);
                console.log("invalid token");
                res.status(C400).json({
                    message: "Invalid Token"
                });
            }
            
        }
    } catch (err) {
        console.log(err);
        res.status(C500).json({
            message: "Unexpected database error has occurred."
        });
    }
}

//https://www.geeksforgeeks.org/how-to-send-an-email-from-javascript/

export default router;
