import React                                                                                from 'react';
import config                                                                               from '../config.json';
import { getCookie }                                                                        from '../utils/Cookies';
import { USERID, SUCC_STAT, SERVER_HOST, FORCE_LOADING_DEACTIVATE, FORCE_LOADING_ACTIVATE } from '../util';
import { renderGlobalTips }                                                                 from '../utils/globalTips';
import {
    validateJournal
}                                                                                           from '../utils/validate-client';
import {
    getEleValue
}                                                                                           from '../utils/DocumentHandler';
import { POST }                                                                             from '../utils/request';
import '../style/Upload.css';

const uploadURL = `${SERVER_HOST}/api/journal/`;

class Upload extends React.Component {
    state = {
        posts            : new Map(),
        tags             : new Set(),
        post_descriptions: {}
    };

    componentDidMount() {
        renderGlobalTips(this.tipHTML);
    }

    submit = () => {
        FORCE_LOADING_ACTIVATE();
        const data = {
            userid           : getCookie(USERID),
            title            : getEleValue('title'),
            description      : getEleValue('description'),
            tags             : Array.from(this.state.tags),
            files            : this.state.posts,
            post_descriptions: this.state.post_descriptions
        };

        const result = validateJournal(data);
        if (result.status === SUCC_STAT) {
            const formData = new FormData();
            formData.append(`data`, JSON.stringify(data));
            data.files.forEach((f, fn) => {
                formData.append(`files`, f, fn);
            });
            this.send(formData);
        } else {
            console.error(result.message);
            alert(result.message);
            FORCE_LOADING_DEACTIVATE();
        }
    };

    send(data) {
        POST(uploadURL, data, () => {
            alert('Successfully Uploaded File!');
            window.location.href = '/';
            FORCE_LOADING_DEACTIVATE();
        });
    }

    // add a tag to a post
    addTag = (e) => {
        if (e.key !== 'Enter') return;
        const tagValue = document.getElementById('tag').value;
        if (tagValue.length === 0) return;
        let tgs = this.state.tags;
        tgs.add(tagValue);
        this.setState({tags: tgs});
        this.refreshTags();
        e.currentTarget.value = '';
    };

    // refresh a tag to a post
    refreshTags = () => {
        const tgs        = this.state.tags;
        const tgList     = document.getElementById('tags_list');
        tgList.innerHTML = '';
        tgs.forEach(v => {
            const li     = document.createElement('li');
            li.onclick   = this.deleteTag;
            li.innerHTML = v;
            tgList.appendChild(li);
        });
    };

    // delete a tag to a post
    deleteTag = (e) => {
        const self = e.currentTarget;
        this.state.tags.delete(self.innerHTML);
        self.remove();
    };

    // add a post
    addAPost = (e) => {
        const ps = this.state.posts;
        const fs = e.target.files;
        for (let i = 0; i < fs.length; i++) {
            const f = fs[i];
            ps.set(f.name, f);
        }
        this.setState({posts: ps});
        this.refreshPosts();
        e.currentTarget.value = '';
    };

    // refreshes a post
    refreshPosts = () => {
        const ps         = this.state.posts;
        const psList     = document.getElementById('posts_list');
        psList.innerHTML = '';
        ps.forEach((v, k) => {
            const li = document.createElement('li');

            const title     = document.createElement('p');
            title.innerHTML = k;
            title.onclick   = this.deletePost;

            const input       = document.createElement('input');
            input.type        = 'text';
            input.placeholder = 'Add a description';
            input.id          = `post_description_${k}`;
            input.onchange    = this.postDescriptionOnChange;

            const dscpt = this.state.post_descriptions[input.id];
            if (dscpt !== undefined) input.value = dscpt;

            li.appendChild(title);
            li.appendChild(input);
            psList.appendChild(li);
        });
    };

    // delete a post
    deletePost = (e) => {
        const self = e.currentTarget;
        this.state.posts.delete(self.innerHTML);
        this.state.post_descriptions[`post_description_${self.innerHTML}`] = undefined;
        self.parentElement.remove();
    };

    postDescriptionOnChange = (e) => {
        const self     = e.currentTarget;
        const dscpt    = this.state.post_descriptions;
        dscpt[self.id] = self.value;
        this.setState({post_descriptions: dscpt});
    };

    render() {
        return (<div>
            {getCookie(USERID) ? this.uploadHTML : this.waitLoginHTML}
        </div>);
    }

    tagsHTML =
        <div className="UP_tagContainer">
            <div className="UP_tags">
                <ul id="tags_list">
                </ul>
            </div>
            <input type="text" id="tag" placeholder="+ Press ENTER to add a new tag" onKeyPress={this.addTag}/>
        </div>;

    selectFileHTML =
        <div className="UP_postContainer">
            {/*<input type="file" name="fUpload" onChange={this.uploadHandler}/><br/>*/}
            <input type="file" name="fUpload" onChange={this.addAPost}/><br/>
            <div className="UP_posts">
                <ul id="posts_list">
                </ul>
            </div>
        </div>;

    uploadHTML =
        <div className="UP_main">
            <div className="UP_msgbox">
                <div className="UP_msgbox_in">
                    <h1>Upload</h1>
                    <p>Get inspired with incredible posts around the world.</p>
                    <div className="UP_form">
                        <input type="text" id="title" placeholder="Title"/><br/>
                        <textarea id="description" placeholder="Description"/><br/>
                        {this.tagsHTML}
                        {this.selectFileHTML}
                        <button onClick={this.submit}>Submit</button>
                    </div>
                </div>
            </div>
        </div>;

    waitLoginHTML =
        <div className="UP_main">
            <div className="UP_msgbox">
                <div className="UP_msgbox_in">
                    <h1>Tell People Who <text id="UP_title">YOU</text> Are</h1>
                    <a href="/account">
                        <button>Login/Sign up</button>
                    </a>
                </div>
            </div>
        </div>;

    // display supported file formats to upload for highlighting and media
    tipHTML =
        <p>
            Highlighting Supports
            : <span>.js</span>
            , <span>.jsx</span>
            , <span>.hpp</span>
            , <span>.h</span>
            , <span>.c</span>
            , <span>.cpp</span>
            , <span>.html</span>
            , <span>.css</span>
            , <span>.java</span>
            , <span>.json</span>
            , <span>.md</span>
            , <span>.php</span>
            , <span>.py</span>
            , <span>.rs</span>
            , <span>.sql</span>
            , <span>.xml</span>
            <br/>
            Media Supports: images, videos
            ( <span>.MP4</span>
            , <span>.MPEG</span>
            , <span>.OGG</span>
            , <span>.TS</span>
            , <span>.WEBM</span>
            , <span>.3GP</span>
            , <span>.3G2</span> )
        </p>;
}

export default Upload;
