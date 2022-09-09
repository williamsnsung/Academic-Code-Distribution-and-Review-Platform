import React    from 'react';

import {
    SUCC_STAT, C200, LOGIN, LOGIN_SUCC, USERID, USERFN,
    USERLN, USEREM, USERST, USERTK, SERVER_HOST
}               from '../util.js';
import {
    getCookie,
}               from '../utils/Cookies';

import { GET200 }                      from '../utils/request';
import { DOMrenderDivs} from '../utils/DocumentHandler';
import '../style/History.css';

const HistoryUrl = `${SERVER_HOST}/api/post/userHistory`;


class History extends React.Component {

    constructor(props) {
        super(props);
        this.mainRef      = React.createRef();
        this.historyStart = 0;
        this.historySize  = 100;
        this.history      = [];
        this.displaySize  = 10;
    }

    // runs after component loads - gets history
    componentDidMount = () => {
        this.getUserHistory(getCookie(USERID));
    };

    // retirves the history of a user from the server
    getUserHistory(userId) {
        GET200(`${HistoryUrl}?userId=${userId}`,
            (res) => {
                this.history = res.data.history;
                this.showHistory();
            });
    }

    // shows next history elements (if there are any history elements next) corresponding to the display size
    nextHistory = () => {
        if (this.historyStart + this.displaySize < this.historySize) {
            this.historyStart = this.historyStart + this.displaySize;
            this.showHistory();
        }
    };

    // shows previous history elements (if there are any previous history elements) corresponding to the display size
    previousHistory = () => {
        if (this.historyStart - this.displaySize > 0) {
            this.historyStart = this.historyStart - this.displaySize;
            this.showHistory();

        } else if (this.historyStart > 0) {
            this.historyStart = 0;
            this.showHistory();
        }
    };

    // shows the first history elements corresponding to the display size
    firstHistory = () => {
        this.historyStart = 0;
        this.showHistory();
    };

    // shows the last history elements corresponding to the display size
    lastHistory = () => {
        while (this.historyStart + this.displaySize < this.historySize) {
            this.historyStart = this.historyStart + this.displaySize;
        }
        this.showHistory();
    };

    // displays the history to the user
    showHistory = () => {
        const historyDivs = [];
        this.historySize  = this.history.length;
        // creates the html for each history element
        this.history.forEach((p, i) => {
            if (i >= this.historyStart && i < (this.historyStart + this.displaySize)) {
                historyDivs.push(History.historyDiv(p, i));
            }
        });
        // only display if there is something to display
        let html = historyDivs.length > 0 ? <div>{historyDivs}</div> : History.emptyHTML;

        DOMrenderDivs(html, this.mainRef.current); // render
        this.displayMetrics(); // currently showing elements x to y from a total of z
    };

    static historyDiv(element, i) {
        return (
            <div className="history-element" key={i}>
                <a href={'/post?postId=' + element.post_id}>
                    <h2>{element.post_title}</h2>
                </a>
                <h3>By {element.author}</h3>
                <p>{new Date(element.accesstime).toString()}</p>

            </div>
        );
    }


    changeDisplaySize(size) {
        console.log(size);
        this.displaySize = size;
        this.showHistory();
    }

    returnHighest = () => {
        const x = this.historyStart + this.displaySize;
        return (this.historySize > x) ? x : this.historySize;

    };

    displayMetrics() {
        const floor = document.getElementById('history-metrics-floor');
        const ceil  = document.getElementById('history-metrics-ceil');
        const max   = document.getElementById('history-metrics-max');

        floor.innerHTML = (this.historySize === 0) ? '0' : (this.historyStart + 1).toString();
        ceil.innerHTML  = this.returnHighest().toString();
        max.innerHTML   = this.historySize.toString();
    }

    render() {
        return (
            <div className="history-container">
                <div className="history-contents">
                    <h1>VIEWING HISTORY</h1>
                    <div>
                        <span>Currently showing elements </span>
                        <span id="history-metrics-floor"></span>
                        <span> to </span>
                        <span id="history-metrics-ceil"></span>
                        <span> from a total of </span>
                        <span id="history-metrics-max"></span>
                    </div>
                    <div className="history-buttons">
                        <button onClick={this.firstHistory}>Newest</button>
                        <button onClick={this.previousHistory}>Previous</button>
                        <button onClick={this.nextHistory}>Next</button>
                        <button onClick={this.lastHistory}>Oldest</button>
                    </div>
                    <div className="display-size-buttons">
                        <button onClick={() => this.changeDisplaySize(10)}>10</button>
                        <button onClick={() => this.changeDisplaySize(20)}>20</button>
                        <button onClick={() => this.changeDisplaySize(50)}>50</button>
                    </div>
                    <div className="history-posts" id="history-posts" ref={this.mainRef}>
                        <div className="lds-facebook" style={{left: 0, top: 0}}>
                            <div style={{background: 'grey'}}></div>
                            <div style={{background: 'grey'}}></div>
                            <div style={{background: 'grey'}}></div>
                        </div>
                    </div>
                    <div className="history-buttons">
                        <button onClick={this.firstHistory}>Newest</button>
                        <button onClick={this.previousHistory}>Previous</button>
                        <button onClick={this.nextHistory}>Next</button>
                        <button onClick={this.lastHistory}>Oldest</button>
                    </div>
                </div>
            </div>
        );
    };

    static emptyHTML =
               <div className="HOME_empty">
                   <h4>You have not visited anything on the site yet!</h4>
               </div>;

}

export default History;