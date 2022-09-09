import {Post}        from "../../Database/utils/post.js";
import {
    genBoolean,
    genDatetime,
    genDatetimeFrom,
    genInt,
    genString
}                    from "../../Server/utils/generator.js";
import {userForTest} from "./user.test.js";
import {newConnection} from "../../Database/dbAgent.js";

const MIN_LEN   = 3;
const MAX_LEN   = 10;

async function genPost(parent_id) {
    let user = await userForTest();
    await user.insert();
    return new Post(
        genString(genInt(MIN_LEN, MAX_LEN)),    // id
        user,                                   // user_id
        parent_id,                              // parent_id
        genString(genInt(MIN_LEN, MAX_LEN)),    // title
        genString(genInt(MIN_LEN, MAX_LEN)),    // meta_title
        genString(genInt(MIN_LEN, MAX_LEN)),    // slug
        genBoolean(),                           // published
        genDatetime(),                          // create_date
        null,                                   // update_date
        null,                                   // delete_date
        genString(genInt(MIN_LEN, MAX_LEN))     // filePath
    );
}

export async function postForTest(parent_id) {
    let post = await genPost(parent_id);
    // regenerate user profiles if this one is registered.
    if ((await Post.getPostById(post.id)).length !== 0)
        return postForTest(parent_id);
    return post;
}

function changePost(post) {
    return new Post(
        post.id,                                // id
        post.user,                              // user_id
        post.parent_id,                         // parent_id
        genString(genInt(MIN_LEN, MAX_LEN)),    // title
        genString(genInt(MIN_LEN, MAX_LEN)),    // meta_title
        genString(genInt(MIN_LEN, MAX_LEN)),    // slug
        genBoolean(),                           // published
        post.create_date,                       // create_date
        genDatetimeFrom(post.create_date),      // update_date
        post.delete_date,                       // delete_date
        genString(genInt(MIN_LEN, MAX_LEN))     // filePath
    );
}

describe('Post', () => {
    let post       = undefined;
    let parentPost = undefined;
    let connection = undefined;

    beforeAll(async () => {
        parentPost = await postForTest(null);
        post       = await postForTest(parentPost.id);
    });

    afterAll(async () => await post.user.delete());

    beforeEach(async () => connection = await newConnection());

    afterEach(async () => connection.release());

    test('Post Insertion', async () => {
        await parentPost.insert();
        await post.insert();
        expect(
            (await Post.getPostById(parentPost.id))[0]
        ).toEqual(parentPost);
        expect(
            (await Post.getPostById(post.id))[0]    // check post and user objects
        ).toEqual(post);
    });

    test('Post Publication', async () => {
        expect(await post.isPublished()).toStrictEqual(post.published);
    });

    test('Parent', async () => {
        expect(
            (await post.getParent())[0]
        ).toEqual(parentPost);
    });

    test('Post Updating', async () => {
        let updated = await changePost(post);
        await updated.update();
        let postInDB = (await Post.getPostById(post.id))[0];
        expect(postInDB).toStrictEqual(updated);
        expect(postInDB.id).toStrictEqual(post.id);
        post = postInDB;
    });

    test('Post Selection', async () => {
        expect(
            (await Post.getPostById(post.id))[0]
        ).toEqual(post);
        expect(
            await Post.getPostByUser(post.user)
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({user: post.user})])
        );
    });

    test('Post Deletion', async () => {
        await post.delete();
        await parentPost.delete();
        expect((await Post.getPostById(post.id)).length).toStrictEqual(0);
        expect((await Post.getPostById(parentPost.id)).length).toStrictEqual(0);
    });
});