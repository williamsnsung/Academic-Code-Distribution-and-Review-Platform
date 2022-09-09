import React      from 'react';
import CodeMirror from '@uiw/react-codemirror';

import { setEleText }                         from '../utils/DocumentHandler';
import { deleteCookie, getCookie, setCookie } from '../utils/Cookies';
import {
    EDIT_MODE, LOGIN, LOGIN_SUCC,
    MODE, SUCC_STAT, USERID, SERVER_HOST, FORCE_LOADING_ACTIVATE, FORCE_LOADING_DEACTIVATE
}                                             from '../util';
import { renderGlobalTips }                   from '../utils/globalTips';
import { highlightingExtension }              from '../utils/highlighting';
import { validateComment }                    from '../utils/validate-client';
import { exportPost }                         from '../utils/export-client';
import { printComments }                      from '../utils/APostComments';
import { GET, POST, POST200, POST_CATCH }     from '../utils/request';
import '../style/APost.css';
import '../style/Comments.css';

const POSTIDREGEX = /\?postId=(.+)/;

const downloadUrl  = `${SERVER_HOST}/api/download`;
const PostUrl      = `${SERVER_HOST}/api/post/postFile`;
const PostUrl_Vote = `${SERVER_HOST}/api/post/voting`;
const PostUrl_Save = `${SERVER_HOST}/api/post/updatePost`;
const PostUrl_Delt = `${SERVER_HOST}/api/post/delete`;
const PostUrl_Imag = `${SERVER_HOST}/api/post/image`;
const PostUrl_Vido = `${SERVER_HOST}/api/post/video`;
const cmmtUrl      = `${SERVER_HOST}/api/comment`;
const isFavPostUrl = `${SERVER_HOST}/api/favourite/isFavourite`;
const favPostUrl   = `${SERVER_HOST}/api/favourite/favourite`;

const videoTips =
          <p>The video on this page can’t be played? Your system may not have the required video
              codecs.
              <br/>Try <span>sudo apt-get install ffmpeg</span>
          </p>;

class APost extends React.Component {
    state = {
        login         : getCookie(LOGIN) === LOGIN_SUCC,
        postId        : null,
        userId        : getCookie(USERID),
        mode          : getCookie(MODE) === EDIT_MODE,
        favourite     : null,
        authorLoggedIn: false,
        upvoted       : null,   // 1 = upvoted, 2 = downvoted, null = neither
        editorValue   : '',
        editorTheme   : 'dark',
        filePostfix   : ''
    };

    componentDidMount() {
        FORCE_LOADING_ACTIVATE();
        const search = this.props.location.search;

        // DON'T use setState(): https://github.com/airbnb/javascript/issues/684
        this.state.postId = search.match(POSTIDREGEX)[1];
        this.readonlyMode();
        this.getPostContent(this.state.postId);
        this.getComment(this.state.postId);
        this.isFavourite();
    }

    errHandler(err) {
        console.error(err);
        if (window.confirm(`Error - ${err.response.data}. Go back to home page?`)) {
            window.location.href = '/';
        }
    }

    getPostContent(postId) {
        const data = {
            postId: postId,
            userId: this.state.login ? this.state.userId : null
        };
        POST_CATCH(PostUrl, data, (res) => this.showPostContent(res.data, postId), this.errHandler);
    }

    getComment(postId) {
        GET(`${cmmtUrl}?postId=${postId}`, (res) => this.showCommentContent(res.data.comments));
    }

    votingPostUrl(postId, userId, isVote, isUpvote) {
        const data = {
            postId  : postId,
            userId  : this.state.login ? this.state.userId : null,
            isVote  : isVote,
            isUpvote: isUpvote
        };
        POST_CATCH(PostUrl_Vote, data, () => {
        }, this.errHandler);
    }

    checkIfAuthor(uid) {
        const result = getCookie(USERID) === uid;
        this.setState({authorLoggedIn: result});
    }

    showPostContent(post, postId) {
        const postInfo = post.post;
        const user     = postInfo.user;
        const score    = post.score;
        this.checkIfAuthor(user.id);

        setEleText('AP_ID_title', postInfo.title);
        setEleText('AP_ID_meta', postInfo.meta_title);
        setEleText('AP_ID_slug', postInfo.slug);
        setEleText('AP_USER_name', `${user.fn} ${user.ln}`);
        setEleText('AP_ID_create_date', new Date(postInfo.create_date).toString());
        setEleText('AP_ID_update_date', new Date(postInfo.update_date).toString());
        setEleText('AP_ID_post_id', postId);
        setEleText('AP_ID_score', score);
        document.getElementById('AP_USER_name_a').href = `/search?userid=${user.id}`;

        this.setState({filePostfix: postInfo.filePath.split('.').pop()});

        /* Voting Score */
        const scoreElement = document.getElementById('AP_ID_score');
        if (post.vote !== null) {
            if (post.vote['is_upvote'] === 1) {
                document.getElementById('Upvote_Button').click();
            } else {
                document.getElementById('Downvote_Button').click();
            }
            scoreElement.innerHTML = (score).toString();
        }

        const data      = post.data;
        const imagePath = post.image;
        const videoPath = post.video;
        if (data !== undefined) {
            this.setState({editorValue: data});
        } else if (imagePath !== undefined) {
            const container     = document.getElementById('file_container');
            const src           = `${PostUrl_Imag}?path=${imagePath}`;
            container.innerHTML = `<img class="AP_image" src=${encodeURI(src)} alt="${postInfo.title}"/>`;
        } else if (videoPath !== undefined) {
            const container     = document.getElementById('file_container');
            const src           = `${PostUrl_Vido}?path=${videoPath}`;
            container.innerHTML =
                `<video id="videoPlayer" controls>
                    <source src="${encodeURI(src)}" type="${post.video_header}">
                 </video>`;
            renderGlobalTips(videoTips);
        }
        FORCE_LOADING_DEACTIVATE();
    }

    changeScore(increaseScore) {
        const box = document.getElementById('AP_ID_score');

        if (box != null && increaseScore != null) {
            const upvote       = document.getElementById('Upvote_Button');
            const downvote     = document.getElementById('Downvote_Button');
            const scoreElement = document.getElementById('AP_ID_score');
            let score          = parseInt(scoreElement.innerHTML);

            if (increaseScore) {
                if (this.state.upvoted === 1) {
                    upvote.style.color     = 'white';
                    this.state.upvoted     = null; // neutral state
                    scoreElement.innerHTML = (score - 1).toString();
                    this.votingPostUrl(this.state.postId, this.state.userId, false, true);
                } else {
                    upvote.style.color   = 'rgb(154, 250, 99)';
                    downvote.style.color = 'white';

                    if (this.state.upvoted === 0) {
                        scoreElement.innerHTML = (score + 2).toString();
                    } else {
                        scoreElement.innerHTML = (score + 1).toString();
                    }
                    this.state.upvoted = 1; // upvoted state
                    this.votingPostUrl(this.state.postId, this.state.userId, true, true);
                }
            } else {
                if (this.state.upvoted === 0) {
                    downvote.style.color   = 'white';
                    this.state.upvoted     = null; // neutral state
                    scoreElement.innerHTML = (score + 1).toString();
                    this.votingPostUrl(this.state.postId, this.state.userId, false, false);
                } else {
                    upvote.style.color   = 'white';
                    downvote.style.color = 'rgb(255, 145, 145)';

                    if (this.state.upvoted === 1) {
                        scoreElement.innerHTML = (score - 2).toString();
                    } else {
                        scoreElement.innerHTML = (score - 1).toString();
                    }
                    this.state.upvoted = 0; // downvoted state
                    this.votingPostUrl(this.state.postId, this.state.userId, true, false);
                }
            }
        }
    }

    showCommentContent(comments) {
        const box = document.getElementById('AP_comments');
        if (box != null) {
            printComments(comments, box, getCookie(USERID), this);
        }
    }

    postComment = () => {
        const input = document.getElementById('AP_comment');
        if (input.value.length === 0) return;

        const data   = {
            comment: input.value,
            userId : getCookie(USERID),
            postId : this.state.postId
        };
        const result = validateComment(data);
        if (result.status === SUCC_STAT) {
            this.sendComment(data);
            input.value = '';
        } else {
            console.error(result.message);
            alert(result.message);
        }
    };

    sendComment(data) {
        POST200(cmmtUrl, data, () => this.getComment(this.state.postId));
    }

    editMode = () => {
        this.setState({mode: true});
        setCookie(MODE, EDIT_MODE);
    };

    readonlyMode = () => {
        this.setState({mode: false});
        deleteCookie(MODE);
    };

    startCancel = () => {
        this.readonlyMode();
        this.getPostContent(this.state.postId);
    };

    startDownload = () => {
        window.open(`${downloadUrl}?postId=${this.state.postId}`);
    };

    startSave = () => {
        FORCE_LOADING_ACTIVATE();
        const data = {
            postId : this.state.postId,
            content: this.state.editorValue
        };
        POST200(PostUrl_Save, data, (res) => {
            this.readonlyMode();
            setEleText('AP_ID_update_date', res.data.date);
            FORCE_LOADING_DEACTIVATE();
        });
    };

    /**
     * Button on-click functionality for initiating the deletion of a post.
     * Will attempt to delete the given post from the database.
     */
    startDeletePost = () => {
        FORCE_LOADING_ACTIVATE();
        const postName = document.getElementById('AP_ID_title').textContent;
        if (window.confirm(`Are you sure you want to delete '${postName}' from this journal? This action cannot be undone.`)) {
            POST200(PostUrl_Delt, {postId: this.state.postId}, () => {
                FORCE_LOADING_DEACTIVATE();
                window.location.href = '/';
            });
        } else {
            FORCE_LOADING_DEACTIVATE();
        }
    };

    /**
     * Button on-click functionality for initiating an export request.
     * Attempts to export the given post to a user chosen destination.
     */
    startExportPost(destinationID) {
        const postID   = document.getElementById('AP_ID_post_id').textContent;
        const postName = document.getElementById('AP_ID_title').textContent;

        // reject if journal ID or post ID are empty
        if (postID == null || destinationID == null) return;

        // confirmation window - export will only proceed if user presses the OK button
        if (window.confirm(`Export '${postName}' to the journal '${destinationID}'. Press OK to confirm.`)) {
            FORCE_LOADING_ACTIVATE();
            exportPost(postID, destinationID); // ../utils/export-client.js
        }
    }

    isFavourite = () => {
        this.favouriteRequest(isFavPostUrl);
    };

    toggleFavourite = () => {
        this.favouriteRequest(favPostUrl);
    };

    favouriteRequest(url) {
        const data = {
            postId: this.state.postId,
            userId: this.state.userId
        };
        POST(url, data, res => this.setState({favourite: res.data.favourite}));
    };

    changeTheme = () => {
        this.setState({
            editorTheme: this.state.editorTheme === 'dark' ? 'light' : 'dark'
        });
    };

    render() {
        return (
            <div className="AP_main">
                <this.renderPostHeader/>
                <this.renderComments/>
                <this.renderFileContents/>
            </div>
        );
    }

    renderComments = () => {
        return this.state.login ? <this.renderCommentHTML/> : <this.renderCommentLogOutHTML/>;
    };

    renderCommentHTML = () => {
        return (
            <div className="AP_container">
                <div className="AP_commentBOX">
                    <input type="text" id="AP_comment" placeholder="Add a comment" onKeyPress={(e) => {
                        if (e.key === 'Enter') this.postComment();
                    }}/>
                    <button className="AP_Buttons" onClick={this.postComment}>Post</button>
                </div>
                <div className="AP_commentBOX" id="AP_comments">
                </div>
            </div>
        );
    };

    renderCommentLogOutHTML = () => {
        return (
            <div className="AP_container">
                <div className="AP_commentBOX">
                    <h4>Login to post a comment.</h4>
                </div>
            </div>
        );
    };

    renderPostHeader = () => {
        return (
            <div className="AP_container">
                <h1 id="AP_ID_title">...</h1>
                <h2 id="AP_ID_meta">...</h2>
                <h3 id="AP_ID_slug">...</h3>
                <a id="AP_USER_name_a">
                    <h4 id="AP_USER_name">...</h4>
                </a>
                <h5 id="AP_ID_create_date">...</h5>
                <h5 id="AP_ID_update_date">...</h5>
                <h5 id="AP_ID_post_id">...</h5>

                <this.renderHeaderButtons/>
            </div>
        );
    };

    // Renders the 'Export to', 'Download' and 'Add to favourite' buttons
    renderHeaderButtons = () => {
        if (this.state.login) {
            return (
                <div>
                    <div className="dropdown">
                        <button className="AP_Buttons_Two" id="AP_Button_Export">Export to...</button>
                        <div className="dropdown-content">
                            <button className="AP_Buttons_Two" onClick={() => this.startExportPost('t03')}> t03</button>
                            <button className="AP_Buttons_Two" onClick={() => this.startExportPost('t06')}> t06</button>
                            <button className="AP_Buttons_Two" onClick={() => this.startExportPost('t09')}> t09</button>
                            <button className="AP_Buttons_Two" onClick={() => this.startExportPost('t12')}> t12</button>
                            <button className="AP_Buttons_Two" onClick={() => this.startExportPost('t15')}> t15</button>
                            <button className="AP_Buttons_Two" onClick={() => this.startExportPost('t18')}> t18</button>
                            <button className="AP_Buttons_Two" onClick={() => this.startExportPost('t21')}> t21</button>
                            <button className="AP_Buttons_Two" onClick={() => this.startExportPost('t24')}> t24</button>
                            <button className="AP_Buttons_Two" onClick={() => this.startExportPost('t27')}> t27</button>
                        </div>
                    </div>
                    <button className="AP_Buttons_Two" onClick={this.startDownload}>Download</button>
                    {this.state.favourite ? this.renderRemoveFavourite() : this.renderAddFavourite()}

                    <h6 id="AP_ID_score">...</h6>
                    <button id="Downvote_Button" onClick={() => this.changeScore(false)}>&#8711;</button>
                    <button id="Upvote_Button" onClick={() => this.changeScore(true)}>&#8710;</button>
                </div>
            );
        } else {
            return (<div>
                <div className="dropdown"/>
                <h6 id="AP_ID_score">...</h6>
            </div>);
        }
    };

    /**
     * Renders the  contents of uploaded files alongside the file editor and the editor buttons.
     * Editor buttons will only be rendered if the user is the author.
     */
    renderFileContents = () => {
        return (<>
                <div className="AP_container" id="file_container">
                    <div className="AP_theme">
                        <input type="checkbox" id="theme_switch_input"/>
                        <label htmlFor="theme_switch_input" id="theme_switch_label"
                               onClick={this.changeTheme}>Toggle</label>
                    </div>
                    <CodeMirror
                        value={this.state.editorValue}
                        height="50vh"
                        theme={this.state.editorTheme}
                        editable={this.state.mode}
                        onChange={v => this.setState({editorValue: v})}
                        extensions={highlightingExtension(this.state.filePostfix)}
                    />
                </div>
                <div className="AP_container">
                    <this.renderEditorOptions/>
                </div>
            </>
        );
    };

    // Renders the appropriate editor buttons based on what state the editor is currently in.
    renderEditorOptions = () => {
        if (this.state.authorLoggedIn) {
            return (this.state.mode) ? <this.renderEditMode/> : <this.renderReadOnlyMode/>;
        } else {
            return null;
        }
    };

    // Editor Buttons for when the editor is in read only mode
    renderReadOnlyMode = () => {
        return (
            <div>
                <button className="AP_Buttons" onClick={this.startDeletePost}>Delete</button>
                {this.state.editorValue.length > 0 ?
                    <button className="AP_Buttons" onClick={this.editMode}>Edit</button> : <></>}
            </div>
        );
    };

    // Editor buttons for when the editor is in edit mode
    renderEditMode = () => {
        return (
            <div>
                <button className="AP_Buttons" onClick={this.startSave}>Save</button>
                <button className="AP_Buttons" onClick={this.startCancel}>Cancel</button>
            </div>
        );
    };

    renderAddFavourite = () => {
        return (
            <button className="AP_Buttons_Two" id="AP_Button_Star" onClick={this.toggleFavourite}>Add to
                favourite</button>);
    };

    renderRemoveFavourite = () => {
        return (
            <button className="AP_Buttons_Two" id="AP_Button_Star" onClick={this.toggleFavourite}>Remove from
                favourite</button>);
    };
}

export default APost;
