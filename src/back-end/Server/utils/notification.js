import {sendResetMail}  from "./mailSender.js";
export function notify(data,email){
    const subject = "**Comment Notification**";
    const text = "Post id: " + data.postId + " has had a new comment from user: " + data.userId + ".\n The comment made by the user was: " + data.comment;
    try {
        sendResetMail(subject,text,email);
        console.log("user notfied");
    } catch (error) {
        console.log(error);
    }
    
    
}