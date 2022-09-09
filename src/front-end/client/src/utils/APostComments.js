import React           from 'react';
import axios           from 'axios';
import config          from '../config.json';
import { SERVER_HOST } from '../util';

const axiosConfig      = `${config.axiosConfigFormData}`;
const deleteCommentURL = `${SERVER_HOST}/api/comment/delete`;
const reportCommentURL = `${SERVER_HOST}/api/comment/report`;

/**
 * Display comment elements alongside any required buttons
 *
 * @param {JSON} comments
 * @param {HTMLElement} box
 * @param {String} userID
 * @param APost
 */
export function printComments(comments, box, userID, APost) {

    while (box.firstChild) {
        box.removeChild(box.firstChild);
    }
    comments.forEach(c => {

        const thisComment     = document.createElement('div');
        thisComment.className = 'AP_commentBOX';

        // display the actual comment in a paragraph tag
        const comment     = document.createElement('p');
        comment.className = 'AP_Comment_Para';
        comment.innerText = `${c.user.fn} - ${new Date(c.create_date).toString()}: ${c.body}`;
        thisComment.appendChild(comment);


        // display 'delete comment' button if this comment belongs to the user
        if (c.user.id === userID) {
            delCommentInitState(thisComment, APost, c);

            // display 'flag comment' button if this button does not belong to the user
        } else {

            const reportCommentBtn     = document.createElement('button');
            reportCommentBtn.className = 'Comment_Button';
            reportCommentBtn.innerHTML = '&#9873;';
            reportCommentBtn.onclick   = function () {

                // TO-DO: REPORT USERS FUNCTIONALITY
                alert('REPORT PLACEHOLDER');
            };
            thisComment.appendChild(reportCommentBtn);
        }

        box.appendChild(thisComment);
    });
}

function delCommentInitState(thisComment, APost, c) {

    const leftButton = document.createElement('button');

    leftButton.className = 'Comment_Button';
    leftButton.innerHTML = '&#10005;';
    leftButton.onclick   = function () {

        leftButton.remove();
        delCommentActiveState(thisComment, APost, c);
    };

    thisComment.appendChild(leftButton);
}

function delCommentActiveState(thisComment, APost, c) {

    const backButton   = document.createElement('button');
    const deleteButton = document.createElement('button');

    // Go Back Button
    backButton.className = 'Choice_Left';
    backButton.innerHTML = '&#8617;';
    backButton.onclick   = function () {

        backButton.remove();
        deleteButton.remove();
        delCommentInitState(thisComment, APost, c);
    };

    // Delete Comment Button
    deleteButton.className = 'Choice_Right';
    deleteButton.innerHTML = '&#10005;';
    deleteButton.onclick   = function () {

        axios.post(deleteCommentURL, {id: c.id}, axiosConfig.headers)
            .then(response => {
                APost.getComment(APost.state.postId);
            })
            .catch(err => {
                console.error(err);
                alert(err.message);
            });
    };

    thisComment.appendChild(deleteButton);
    thisComment.appendChild(backButton);
}
