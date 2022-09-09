import {Comment}     from "../../Database/utils/comment.js";
import {
    genBoolean, genDatetime, genDatetimeFrom,
    genInt,
    genString
}                    from "../../Server/utils/generator.js";
import {postForTest} from "./post.test.js";
import {userForTest}   from "./user.test.js";
import {newConnection} from "../../Database/dbAgent.js";
import {Post}          from "../../Database/utils/post";

const MIN_LEN = 3;
const MAX_LEN = 10;

async function genComment(parent_id) {
    let user = await userForTest();
    let post = await postForTest(null);
    await user.insert();
    await post.insert();
    return new Comment(
        genString(genInt(MIN_LEN, MAX_LEN)),    // id
        post,
        user,
        parent_id,
        genString(genInt(MIN_LEN, MAX_LEN)),    // title
        genBoolean(),                           // published
        genDatetime(),                          // create_date
        null,                                   // update_date
        null,                                   // delete_date
        genString(genInt(MIN_LEN, MAX_LEN))     // body
    );
}

async function commentForTest(parent_id) {
    let comment = genComment(parent_id);
    if ((await Comment.getCommentById(comment.id)).length !== 0)
        return commentForTest(parent_id);
    return comment;
}

function changeComment(comment) {
    return new Comment(
        comment.id,                             // id
        comment.post,                           // post
        comment.user,                           // user
        comment.parent_id,                      // parent_id
        genString(genInt(MIN_LEN, MAX_LEN)),    // title
        genBoolean(),                           // published
        comment.create_date,                    // create_date
        genDatetimeFrom(comment.create_date),   // update_date
        comment.delete_date,                    // delete_date
        genString(genInt(MIN_LEN, MAX_LEN))     // body
    );
}

describe('Comment', () => {
    let parentComment = undefined;
    let comment       = undefined;
    let connection    = undefined;

    beforeAll(async () => {
        parentComment = await commentForTest(null);
        comment       = await commentForTest(parentComment.id);
    });

    beforeEach(async () => connection = await newConnection());

    afterEach(async () => connection.release());

    test('Comment Insertion', async () => {
        await parentComment.insert();
        await comment.insert();
        expect(
            (await Comment.getCommentById(parentComment.id))[0]    // check post and user objects
        ).toEqual(parentComment);
        expect(
            (await Comment.getCommentById(comment.id))[0]
        ).toEqual(comment);
    });

    test('Comment Publication', async () => {
        expect(await comment.isPublished()).toStrictEqual(comment.published);
    });

    test('Parent', async () => {
        expect(
            (await comment.getParent())[0]
        ).toEqual(parentComment);
    });

    test('Comment Updating', async () => {
        let updated = await changeComment(comment);
        await updated.update();
        let commentInDB = (await Comment.getCommentById(comment.id))[0];
        expect(commentInDB).toStrictEqual(updated);
        expect(commentInDB.id).toStrictEqual(comment.id);
        comment = commentInDB;
    });

    test('Comment Selection', async () => {
        expect(
            (await Comment.getCommentById(comment.id))[0]
        ).toEqual(comment);
        expect(
            await Comment.getCommentByUser(comment.user)
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({user: comment.user})])
        );
        expect(
            await Comment.getCommentByPost(comment.post)
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({post: comment.post})])
        );
    });

    test('Comment Deletion', async () => {
        await comment.delete();
        await parentComment.delete();
        expect((await Comment.getCommentById(comment.id)).length).toStrictEqual(0);
        expect((await Comment.getCommentById(parentComment.id)).length).toStrictEqual(0);
    });
});