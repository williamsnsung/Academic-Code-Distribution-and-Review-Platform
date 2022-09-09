import jwt    from 'jsonwebtoken';

/**
 * Generate a token for a certain use.
 * @param {User} use Use, can be for SSO or for import/export
 * @returns {*} Token.
 */
const secret = "5EA2D33C127A0C598A359C4824FF6D218AE8CAC63AAB59B21F563C279CA42382E4E7A1BE8CA000042A0EEE982E6415B9CDD5FC540181AAB2CEB3BA818C816801"

export function genToken(use) {
    //below is generate using https://www.grc.com/passwords.htm twice as per advice from https://github.com/dwyl/hapi-auth-jwt2/issues/48
    let token = jwt.sign({  // https://jwt.io/introduction
        "use": use,         // token usecase
        "ts": Date.now()    // timestamp
    }, secret);
    return token;
}

export function verifyJWT(req) {
        try{
                //https://www.geeksforgeeks.org/how-to-create-and-verify-jwts-with-node-js/
                const token = (req.headers.authorization).substring(7);
                const decode = jwt.verify(token, secret, function(err, decoded) {
                        if (err) {
                                throw err;
                        }
                });
        }
        catch(err) {
                console.log("----JWT VERIFICATION FAILED");
                return err;
        }

}

