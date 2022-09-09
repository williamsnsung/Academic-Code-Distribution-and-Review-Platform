//frontend to reciprocate
import express    from "express";
import axios      from "axios";
import {genToken} from "../../utils/token.js";
import {User}     from "../../../Database/utils/user.js";
import {
    C200,
    C400,
    C500,
    EERR_STAT,
    SUCC_STAT,
    UERR_STAT
}                 from "../../util.js";

let router        = express.Router();
const SERVER_HOST = "https://cs3099user03.host.cs.st-andrews.ac.uk/";
router.get('/login', (req, res) => {
    let state      = req.query.state;
    const from = req.query.from;
    let code_func = "function code(){window.location.href = \""+SERVER_HOST+"account?state="+state+"&from="+from+"\"}";
    let htmllogin = "<script>"+code_func+" window.onload = code;</script>";
    res.send(htmllogin+ code_func);
});

router.post('/storeState', (req, res) => {
    console.log(req.body);
    //stateStore = req.body.state;
});//******************** */

router.post('/verify', async (req, res) => {
    const token = req.query.token;
    let user = await getToken(token);
    console.log(user.token);
    console.log(user.token == token);
    console.log(user === null);
    console.log(user.id)

    if ( user !== null ) {
        res.status(C200).json({
            status : "ok",
            id: user.id,
            name   :user.fn + user.ln,
            email  : user.email
        });
    } else {
        res.status(C400).json({
            status: "error",
            error : "verification failed"
        });
    }
});
router.get('/callback', (req, resp) => {
    const token = req.query.token;
    let from    = req.query.from;
    const state = req.query.state;
    let sgstate = req.headers.cookie;
    let code_func = "function code(){window.location.href = \""+SERVER_HOST+"callback?from="+from+"&state="+state+"&token="+token+"\"}";
    let htmllogin = "<script>"+code_func+" window.onload = code;</script>";
    resp.send(htmllogin+code_func);
});
router.post('/callback_helper', (req, resp) => {
    
    const token = req.body.token;
    let from    = req.body.from;
    const state = req.body.state;
    let sgstate = req.headers.cookie;
    sgstate = sgstate.split('SGState')[1].split('=')[1]
    sgstate = sgstate.split(';')[0];
    console.log(sgstate);
    if (sgstate === state) {
        from += "/api/sg/sso/verify?token=" + token;

        POST(from, token, async (res) => {
            if (res.data.status === "ok") {
                console.log(res.data);
                console.log("Supergroup user logged in");
                let firstname = res.data.name;//*********8 */
                let surname;
                let password = 'SuperGroup';
                let phone = 'Supergroup';
                let gender = 'unknown'
                try {
                    surname = firstname.split()[1];
                    firstname = firstname.split()[0];
                    if(surname == null){
                        surname = 'SuperGroup';
                    }
                    if(res.data.phone != null){
                        phone = res.data.phone ;
                    }
                    if(res.data.gender != null){
                        gender = res.data.gender ;
                    }
                } catch (error) {
                    surname = 'SuperGroup';
                }
                console.log(firstname);
                const user = new User(
                    res.data.id, firstname, surname, gender,
                    res.data.email, phone, password, 'viewer', new Date(),
                    token
                );
                
                if (await user.isRegistered()) {
                    resp.status(C200).json({
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
                } else {    // otherwise add to database
                    try {
                        await user.insert();
                    } catch (error) {
                        console.log(error);
                        resp.status(C400).json({
                            message: "invalid state"
                        });
                    }
                    
                    resp.status(C200).json({
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
            } else {
                resp.status(C400).json({
                    message: "invalid state"
                });
            }
        });
    } else {
        resp.status(C400).json({
            message: "Unautherised"
        });
    }
});
async function getToken(SGSToken) {
    const users = await User.getUserByToken(SGSToken);
    if(users.length == 1){
        return users[0];
    }
    return null;
}

function POST(url, data, callback, errHandler) {
    let axios_config = "Content-type: application/json; charset=UTF-8";
    axios.post(url, data, axios_config)
         .then(callback)
         .catch(errHandler);
}


export default router;
