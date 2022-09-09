import React                         from 'react';
import { getCookie }                 from '../utils/Cookies';
import {
    LOGIN, LOGIN_SUCC,
    SERVER_HOST, USERID, USERFN, USERLN, FORCE_LOADING_ACTIVATE, FORCE_LOADING_DEACTIVATE
}                                    from '../util';
import { renderGlobalTips }          from '../utils/globalTips';
import { GET, GET200, POST }         from '../utils/request';
import { DOMrenderDivs, setEleText } from '../utils/DocumentHandler';
import '../style/Home.css';

const PostUrl      = `${SERVER_HOST}/api/post`;
const JrnlUrl      = `${SERVER_HOST}/api/journal`;
const CmntUrl      = `${SERVER_HOST}/api/comment`;
const UserUrl      = `${SERVER_HOST}/api/users`;
const PostUrl_User = `${PostUrl}/userPosts`;
const JrnlUrl_User = `${JrnlUrl}/userJournals`;
const JrnlUrl_Post = `${JrnlUrl}/posts`;
const JrnlUrl_Delt = `${JrnlUrl}/delete`;
const POSTS_NUM    = 8;

class Home extends React.Component {
    state = {
        login     : getCookie(LOGIN) === LOGIN_SUCC,
        userid    : getCookie(USERID),
        refresh   : false,
        isPost    : false,      // true: Post; false: Journal
        helloMsg  : null,
        rs_running: false,
        section   : null
    };

    constructor(props) {
        super(props);
        this.mainRef = React.createRef();
    }

    // what to do when page loads - display recommendations page and if logged in populate the sidebar with up to date data
    componentDidMount = () => {
        this.exploreJournals();
        if (this.state.login) this.fetchSidebarContents();
        this.renderTips();
    };

    newSelection = (id) => {
        // ReactDOM.render(Home.loadingHTML, this.mainRef.current);
        DOMrenderDivs(Home.loadingHTML, this.mainRef.current);
        const nav   = document.getElementById('narrowNav');
        const aTags = nav.children;
        for (let i = 0; i < aTags.length; i++) {
            aTags[i].classList.remove('home_active');
        }
        document.getElementById(id).className = 'home_active';
        this.setState({rs_running: false});
    };

    // fetches additional content or the user
    exploreMore = () => {
        if (this.state.isPost) {
            this.getRandomPosts(POSTS_NUM, 'explorePosts');
        } else {
            this.getRandomJournals(POSTS_NUM, 'exploreJournals');
        }
    };

    // retrieves some number of randomly selected journals
    getRandomJournals(num, section) {
        GET200(`${JrnlUrl}?number=${num}`,
            (res) => {
                if (section !== this.state.section) return;
                this.showJournals(res.data.journals);
            });
    }

    // retirves some number of journals recommended by the recommender systtem
    getRSJournals(uid, num, section) {
        GET200(`${JrnlUrl}?number=${num}&uid=${uid}`,
            (res) => {
                if (section !== this.state.section) return;
                this.setState({rs_running: false});
                this.showJournals(res.data.journals);
            });
    }

    // retrieves some number of randomly selected posts
    getRandomPosts(num, section) {
        GET200(`${PostUrl}?number=${num}`,
            (res) => {
                if (section !== this.state.section) return;
                this.showPosts(res.data.posts);
            });
    }

    // retrieves the journals uploaded by a given user
    getUserJournals(userId, section) {
        GET200(`${JrnlUrl_User}?userId=${userId}`,
            (res) => {
                if (section !== this.state.section) return;
                this.showJournals(res.data.journals);
            });
    }

    //retrieves the posts uploaded by a given user
    getUserPosts(userId, section) {
        GET200(`${PostUrl_User}?userId=${userId}`,
            (res) => {
                if (section !== this.state.section) return;
                this.showPosts(res.data.posts);
            });
    }

    // retrieves the posts belonging to a parent journal
    static getPostsInJournal(journalId, parentEle) {
        GET200(`${JrnlUrl_Post}?journal_id=${journalId}`,
            (res) => Home.showPostsInJournal(res.data.posts, parentEle));
    }

    // displays journals in a user friendly format
    showJournals(journals) {
        const journalDivs = [];
        journals.forEach((j, i) => journalDivs.push(Home.journalDiv(j, i, this.state.userid)));
        if (journalDivs.length > 0) {
            DOMrenderDivs(journalDivs, this.mainRef.current);
            journals.forEach((j) => {
                Home.journalTags(j.id, j.tags);
            });
        } else {
            DOMrenderDivs(Home.emptyHTML, this.mainRef.current);
        }
    }

    // displays posts in a user friendly format
    showPosts(posts) {
        const postDivs = [];
        posts.forEach((p, i) => postDivs.push(Home.postDiv(p, i)));
        let divs = postDivs.length > 0 ? postDivs : Home.emptyHTML;
        DOMrenderDivs(divs, this.mainRef.current);
        // ReactDOM.render(<div>html</div>, this.mainRef.current);
    }

    // gets statistics for the side bar from the server and populates them with up to date data
    fetchSidebarContents = () => {
        GET200(`${PostUrl_User}?userId=${this.state.userid}`,
            (res) => setEleText('side-bar-posts', res.data.posts.length));

        GET200(`${JrnlUrl_User}?userId=${this.state.userid}`,
            (res) => setEleText('side-bar-journals', res.data.journals.length));

        POST(`${CmntUrl}/count`, {userId: getCookie(USERID)},
            (res) => setEleText('side-bar-comments', res.data.count));

        POST(`${UserUrl}/userStats`, {userId: getCookie(USERID)},
            (res) => setEleText('side-bar-favourites', res.data.favourites));
    };

    // switches display contents to 'Explore Post'
    explorePosts = () => {
        const section = 'explorePosts';
        this.newSelection(section);
        this.setState({refresh: true, isPost: true, section: section});
        this.getRandomPosts(POSTS_NUM, section);
    };

    // switches display elements to 'Recommendations' - Recomender System is used if user logged in, otherwise random journals
    exploreJournals = () => {
        const section = 'exploreJournals';
        this.newSelection(section);
        this.setState({refresh: true, isPost: false, rs_running: true, section: section});
        if (this.state.login) this.getRSJournals(this.state.userid, POSTS_NUM, section);
        else this.getRandomJournals(POSTS_NUM, section);
    };

    // switches display elements to 'your Posts'
    yourPosts = () => {
        const section = 'yourPosts';
        this.newSelection(section);
        this.setState({refresh: false, section: section});
        this.getUserPosts(this.state.userid, section);
    };

    // switches display elements to 'your journals'
    yourJournals = () => {
        const section = 'yourJournals';
        this.newSelection(section);
        this.setState({refresh: false, section: section});
        this.getUserJournals(this.state.userid, section);
    };

    // displays posts belonging to a joiurnal within a section of the journal tabs
    static showPostsInJournal(posts, parentEle) {
        const ul     = parentEle.lastElementChild;
        ul.innerHTML = '';
        ul.className = 'postsList';
        for (let i = 0; i < posts.length; i++) {
            const post   = posts[i];
            const li     = document.createElement('li');
            li.onclick   = () => window.location.href = `/post?postId=${post.post_id}`;
            li.innerHTML = `
                <h5>${post.title}</h5>
                <p>${post.author}</p>
                <h6>${post.description}</h6>
            `;
            ul.appendChild(li);
        }
        parentEle.appendChild(ul);
    }

    // functionality for clicking on a journal
    static journalOnClick = (e) => {
        const journalId = e.currentTarget.id;
        const parent    = e.currentTarget.parentElement;
        Home.getPostsInJournal(journalId, parent);
    };

    // functionality for deleting a journal including a 'are you sure' pop up
    static journalDelete(journal_id) {
        if (window.confirm(`Are you sure you want to delete this journal? This will delete all associated files, posts, and comments and the action cannot be undone.`)) {
            FORCE_LOADING_ACTIVATE();
            GET(`${JrnlUrl_Delt}?journal_id=${journal_id}`, () => {
                FORCE_LOADING_DEACTIVATE();
                window.location.reload();
            });
        }
    }

    // main render component - renders page contents and, if logged in, the side bar with appropriate css adjustments
    render() {
        if (this.state.login) {
            return (
                <div className="HOME_wrap">
                    {this.renderMAIN()}
                    {this.renderASIDE()}
                </div>
            );
        } else {
            return (
                <div>
                    {this.renderMAIN2()}
                </div>
            );
        }
    }

    // what to render when user is logged in
    renderMAIN() {
        return (
            <main>
                {this.narrowNavHTML}
                <div className="HOME_innermain backdrop-blur">
                    <div id="HOME_mainColumn" ref={this.mainRef}/>
                    {this.state.refresh
                        ? <button onClick={this.exploreMore} className="morePosts">Explore More</button>
                        : <div/>}
                </div>
            </main>
        );
    }

    // what to render when user is not logged in
    renderMAIN2() {
        return (
            <main className="HOME_main-content">
                {this.narrowNavHTML}
                <div className="HOME_innermain backdrop-blur">
                    <div id="HOME_mainColumn" ref={this.mainRef}/>
                    {this.state.refresh
                        ? <button onClick={this.exploreMore} className="morePosts">Explore More</button>
                        : <div/>}
                </div>
            </main>
        );
    }

    // functionality for rendering the side bar - only renders if user is currently logged in
    renderASIDE() {

        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {

                // Generate random number
                var j = Math.floor(Math.random() * (i + 1));

                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        }

        if (this.state.helloMsg == null) {
            let list = ['How are you today?', 'Ready to be inspired?', 'You are looking dapper today!', 'What will it be this time?',
                        'Weapons systems deactivated.', 'Looking for something special?', 'Beep Boop. Boop Beep?', 'Lets do this thing!', 'You\'ve come to the right place.'];
            list     = shuffleArray(list);
            this.setState({helloMsg: list[0]});
        }

        if (this.state.login) {
            return this.renderSideBarLoggedIn();
        }
    }

    // html for ASIDE side bar
    renderSideBarLoggedIn() {
        return (
            <aside>
                <div className="HOME_sidebar-container">
                    <h1 onClick={() => window.location.href = '/account'}>{getCookie(USERFN)[0] + getCookie(USERLN)[0]}</h1>
                    <h3>Hello {getCookie(USERFN)}</h3>
                    <p>{this.state.helloMsg}</p>
                </div>

                <hr className="divider"/>
                {
                    this.state.rs_running
                        ? <div className="HOME_sidebar-container">
                            <p style={{color: 'gray'}}>Recommender System is Running</p>
                            <div className="lds-hourglass"/>
                        </div>
                        : <div className="HOME_sidebar-container">
                            <p style={{color: 'gray'}}>Hope you like it</p>
                            <div className="lds-heart">
                                <div/>
                            </div>
                        </div>
                }
                <hr className="divider"/>
                <div className="HOME_sidebar-container">
                    <h2>USER STATS</h2>
                    <div className="HOME_sidebar-stats">
                        <div><h4>Posts: </h4> <h4 id="side-bar-posts">0</h4></div>
                        <div><h4>Journals: </h4> <h4 id="side-bar-journals">0</h4></div>
                        <div><h4>Comments: </h4> <h4 id="side-bar-comments">0</h4></div>
                        <div><h4>Favourited: </h4> <h4 id="side-bar-favourites">0</h4></div>
                    </div>
                </div>
                <hr className="divider"/>
                <div className="HOME_sidebar-container">
                    <h2>NOTIFICATIONS</h2>
                    <p>No new notifications</p>
                </div>
            </aside>
        );
    }

    // creates tags with appropriate links based on
    static journalTags(journalId, tags) {
        try {
            const container     = document.getElementById(`tags_${journalId}`);
            container.innerHTML = '';
            for (let i = 0; i < tags.length; i++) {
                const li       = document.createElement('li');
                const tag_name = tags[i]['tag_name'];
                li.innerHTML   = tag_name;
                li.onclick     = () => window.location.href = `/search?tag=${tag_name}`;
                container.appendChild(li);
            }
        } catch (ignore) {
        }
    }

    // creates a element for a journal and populates it with data from a journal JSON object
    static journalDiv(journal, i, userid) {
        return (
            <div className="HOME_journal" key={i}>
                {userid === journal.user.id
                    ? <button onClick={() => Home.journalDelete(journal.id)}>Delete</button>
                    : <span/>}
                <a onClick={Home.journalOnClick} id={journal.id}>
                    <h2>{journal.title}</h2>
                </a>
                <a href={`/search?userid=${journal.user.id}`}>
                    <h4>{journal.user.fn + ' ' + journal.user.ln}</h4>
                </a>
                <a href={`/search?role=${journal.user.status}`}>
                    <span>{journal.user.status}</span>
                </a>
                <p className="postUpdateT">{new Date(journal.update_date).toString()}</p>
                <div className="HOME_postInfo">
                    <p className="postPlug">{journal.description}</p>
                </div>
                <ul className="tags" id={`tags_${journal.id}`}/>
                <ul className="postsList"/>
            </div>
        );
    }

    // creates a element for a post and populates it with data from a post JSON object
    static postDiv(post, i) {
        return (
            <div className="HOME_post" key={i}>
                <a href={'/post?postId=' + post.id}>
                    <h2>{post.title}</h2>
                </a>
                <h3>{post.meta_title}</h3>
                <a href={`/search?userid=${post.user.id}`}>
                    <h4>{post.user.fn + ' ' + post.user.ln}</h4>
                </a>
                <a href={`/search?role=${post.user.status}`}>
                    <span>{post.user.status}</span>
                </a>
                <p className="postUpdateT">{new Date(post.update_date).toString()}</p>
                <div className="HOME_postInfo">
                    <p className="postPlug">{post.slug}</p>
                </div>
                <p className="postInfo">{post.filePath}</p>
            </div>
        );
    }

    // navigation between sections Recommendations, Explore Post,, and if logged in, Your Journals, Your Posts
    narrowNavHTML =
        <div id="narrowNav">
            <a onClick={this.exploreJournals} id="exploreJournals">Recommendations</a>
            <a onClick={this.explorePosts} id="explorePosts">Explore Post</a>
            {
                this.state.login ?
                    <a onClick={this.yourJournals} id="yourJournals">Your Journals</a> : <span/>
            }
            {
                this.state.login ?
                    <a onClick={this.yourPosts} id="yourPosts">Your Posts</a> : <span/>
            }
        </div>;

    // loading icon for recomended posts
    static loadingHTML =
               <div className="HOME_empty">
                   <h4>Your time is very important to us. Please wait while we ignore you...</h4>
                   <div className="lds-ellipsis">
                       <div/>
                       <div/>
                       <div/>
                       <div/>
                   </div>
               </div>;

    // standard empty for posts and journals
    static emptyHTML =
               <div className="HOME_empty">
                   <h1>O_O</h1>
                   <h4>Have not uploaded anything to the site yet!</h4>
               </div>;

    // displays a useful tip at the bottom of the screen
    renderTips() {
        renderGlobalTips(<p>
            It may take some time to query from the recommender system.
        </p>);
    }
}

export default Home;
