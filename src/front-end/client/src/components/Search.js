import React                   from 'react';
import { SERVER_HOST, USERID } from '../util';
import Home                    from './Home.js';
import ReactDOM                from 'react-dom';
import { GET200, POST }        from '../utils/request';
import '../style/Search.css';
import { getCookie }           from '../utils/Cookies';

const REGEX = /\?(.+)=(.+)/;

const searchURL            = `${SERVER_HOST}/api/search`;
const searchURL_Psts       = `${searchURL}/post`;
const searchURL_Jnls       = `${searchURL}/journals`;
const searchURL_Usrs       = `${searchURL}/users`;
const searchURL_Tags       = `${searchURL}/tags`;
const searchURL_Role       = `${searchURL}/role`;
const searchURL_PostInTags = `${searchURL}/posttags`;

const PostUrl      = `${SERVER_HOST}/api/post`;
const PostUrl_User = `${PostUrl}/userPosts`;
const JrnlUrl      = `${SERVER_HOST}/api/journal`;
const JrnlUrl_User = `${JrnlUrl}/userJournals`;

class Search extends React.Component {
    state = {
        keyword  : null,
        filed    : null,    // all / tag
        searching: 0,       // number of ongoing searching
        searchRes: {}
    };

    componentDidMount() {
        const search = decodeURI(this.props.location.search);

        let match = search.match(REGEX);
        if (match === null) {
            this.setState({searching: 0});
            return;
        }

        this.state.filed   = match[1];
        this.state.keyword = match[2];

        if (this.state.filed === 'tag') {
            this.setState({searching: 1});
            this.searchTag();
        } else if (this.state.filed === 'all') {
            this.setState({searching: 4});
            this.searchKeyword();
        } else if (this.state.filed === 'userid') {
            this.setState({searching: 3});
            this.searchUserid();
        } else if (this.state.filed === 'role') {
            this.setState({searching: 1});
            this.searchUserRole();
        }
    }

    completeSearch(typename, num) {
        /* update search state */
        let searchRes       = this.state.searchRes;
        searchRes[typename] = num;
        this.setState({
            searching: this.state.searching - 1,
            searchRes: searchRes
        });

        /* update search bar */
        const state_bar  = document.getElementById('state_bar');
        const result     = document.createElement('h3');
        result.innerHTML = `${typename} <span>${num}</span>`;
        state_bar.appendChild(result);
    }

    searchKeyword() {
        document.getElementById('title').innerHTML = `for ${this.state.keyword}`;

        const data = {keyword: this.state.keyword};

        POST(searchURL_Usrs, data, res => this.showContent(res.data.users, this.userDiv, 'grid_user', 'users'));
        POST(searchURL_Tags, data, res => this.showContent(res.data.tags, this.tagDiv, 'grid_tag', 'tags'));
        POST(searchURL_Psts, data, res => this.showContent(res.data.posts, Home.postDiv, 'grid_post', 'posts'));
        POST(searchURL_Jnls, data, res => {
            this.showContent(res.data.journals, Home.journalDiv, 'grid_journal', 'journals');
            res.data.journals.forEach((j) => Home.journalTags(j.id, j.tags));
        });
    }

    searchTag() {
        document.getElementById('title').innerHTML = `for submissions in category ${this.state.keyword}`;

        const data = {tag_name: this.state.keyword};
        POST(searchURL_PostInTags, data, res => {
            this.showContent(res.data.journals, Home.journalDiv, 'grid_journal', 'journals');
            res.data.journals.forEach((j) => Home.journalTags(j.id, j.tags));
        });
    }

    searchUserid() {
        document.getElementById('title').innerHTML = `for user id ${this.state.keyword}`;

        POST(searchURL_Usrs, {keyword: this.state.keyword},
            res => this.showContent(res.data.users, this.userDiv, 'grid_user', 'users'));
        GET200(`${PostUrl_User}?userId=${this.state.keyword}`,
            res => this.showContent(res.data.posts, Home.postDiv, 'grid_post', 'posts'));
        GET200(`${JrnlUrl_User}?userId=${this.state.keyword}`, res => {
            this.showContent(res.data.journals, Home.journalDiv, 'grid_journal', 'journals');
            res.data.journals.forEach((j) => Home.journalTags(j.id, j.tags));
        });
    }

    searchUserRole() {
        document.getElementById('title').innerHTML = `for role ${this.state.keyword}`;
        POST(searchURL_Role, {keyword: this.state.keyword},
            res => this.showContent(res.data.users, this.userDiv, 'grid_user', 'users'));
    }

    showContent(json, divTemplate, parentEleId, name) {
        const divs = [];
        json.forEach((j, i) => divs.push(divTemplate(j, i, getCookie(USERID))));
        ReactDOM.render(
            <div>
                <h2>{json.length} {name} found</h2>
                {divs}
            </div>,
            document.getElementById(parentEleId)
        );
        this.completeSearch(name, json.length);
    }

    userDiv(user, i) {
        return (
            <div key={i}>
                <a href={`/search?userid=${user.id}`}>
                    <h2>{`${user.fn} ${user.ln}`}</h2>
                </a>
                <h3>{user.email}</h3>
                <a href={`/search?role=${user.status}`}>
                    <h5>{user.status}</h5>
                </a>
                <h4>{user.phone}</h4>
                <h4>Since {new Date(user.regis_date).toString()}</h4>
                <h6>{user.id}</h6>
            </div>
        );
    }

    tagDiv(tag, i) {
        return (
            <div key={i}>
                <a href={`/search?tag=${tag}`}><h3>{tag}</h3></a>
            </div>
        );
    }

    render() {
        return (
            <div className="main_div">
                <h1 id="title"/>
                <div className="grid" id="grid">
                    <div className="grid_item" id="state_bar">
                        <h2>{this.state.searching <= 0 ? 'Search Complete' : 'Searching ...'}</h2>
                    </div>
                    <div className="grid_item" id="grid_post"/>
                    <div className="grid_item" id="grid_journal"/>
                    <div className="grid_item" id="grid_user"/>
                    <div className="grid_item" id="grid_tag"/>
                    <div style={{clear: 'both'}}/>
                </div>
            </div>
        );
    }
}

/**
 * TODO LIST
 * 1. BUG: passing password to client
 */

export default Search;