import {User}          from "../../Database/utils/user.js";
import {
    genDatetime,
    genEmail,
    genInt,
    genPhone,
    genPosInt,
    genString
}                      from "../../Server/utils/generator.js";
import {newConnection} from "../../Database/dbAgent.js";

const MIN_LEN = 3;
const MAX_LEN = 10;

/**
 * Randomly generates a user.
 * @returns {User} User.
 */
function genUser() {
    return new User(
        genString(genInt(MIN_LEN, MAX_LEN)),    // id
        genString(genInt(MIN_LEN, MAX_LEN)),    // fn
        genString(genInt(MIN_LEN, MAX_LEN)),    // ln
        "female",                        // gender
        genEmail(),                             // email
        genPhone(),                             // phone
        genString(genInt(MIN_LEN, MAX_LEN)),    // psw
        genPosInt(MIN_LEN),                     // status
        genDatetime(),                          // regis_date
        genString(genInt(MIN_LEN, MAX_LEN)),    // token
    );
}

/**
 * Randomly changes some of the profiles of a user.
 * @param {User} user User with same id, but some of the profiles are changed.
 */
function changeUser(user) {
    return new User(
        user.id,                                // id
        genString(genInt(MIN_LEN, MAX_LEN)),    // fn
        genString(genInt(MIN_LEN, MAX_LEN)),    // ln
        "female",
        genEmail(),                             // email
        genPhone(),                             // phone
        genString(genInt(MIN_LEN, MAX_LEN)),    // psw
        genPosInt(MIN_LEN),                     // status
        genDatetime(),                          // regis_date
        genString(genInt(MIN_LEN, MAX_LEN)),    // token
    );
}

/**
 * Randomly generates an un-registered user.
 * @returns {Promise<*|User>} An un-registered user.
 */
export async function userForTest() {
    let user = genUser();
    // regenerate user profiles if this one is registered.
    if (await user.isRegistered()) return userForTest();
    return user;
}

describe('User', () => {
    let user       = undefined;
    let connection = undefined;

    beforeAll(async () => user = await userForTest());

    beforeEach(async () => connection = await newConnection());

    afterEach(async () => connection.release());

    test('User Insertion', async () => {
        await user.insert();
        expect(await user.isRegistered()).toBe(true);   // user should be registered
        expect(                                                 // query results should match original data
            (await User.getUserByID(user.id))[0]
        ).toStrictEqual(user);
    });

    test('User Updating', async () => {
        let newUser = changeUser(user);
        expect(await user.isRegistered()).toBe(true);   // user should be registered
        await newUser.update();
        expect(
            (await User.getUserByID(user.id))[0].id
        ).toStrictEqual(newUser.id);
        user = newUser;
    });

    test('User Deletion', async () => {
        await user.delete();
        expect(await user.isRegistered()).toBe(false);  // user should not be registered
    });
});