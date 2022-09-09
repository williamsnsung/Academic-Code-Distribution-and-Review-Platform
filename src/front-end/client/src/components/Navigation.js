import React         from 'react';
import { Steps }     from 'intro.js-react';
import { NavLink }   from 'react-router-dom';
import { USERST }    from '../util';
import { getCookie } from '../utils/Cookies';
import '../style/Navigation.css';
import 'intro.js/introjs.css';

class Navigation extends React.Component {
    state = {
        helpMenu    : false,
        startTour   : false,
        stepsEnabled: true,
        initialStep : 0,
        role        : getCookie(USERST),
        steps       : [
            // user onboarding tour and walkthrough elements
            {
                element: '#tour_home',
                intro  : 'Welcome to the T03 Code Journal. Your Home page shows a curated lists of posts for your organisation.'
            },
            {
                element: '#tour_upload',
                intro  : 'You can also upload posts directly to the Code Journal.'
            },
            {
                element: '#tour_account',
                intro  : 'Sign up and log in to your account or other supergroup journals.'
            },
            {
                element: '#global_search_bar',
                intro  : 'Search allows you to search inside the content of posts and relevant categorical tags.'
            },
            {
                element: '.help-menu',
                intro  : 'Help Menu provides immediate support via online documentation, advanced keyboard shortcuts and a user onboarding tour.'
            }
        ]
    };

    searchBarOnKeyPress = (e) => {
        const value = e.currentTarget.value;
        if (value.length === 0 || e.key !== 'Enter') return;
        const match = value.match(/(.+):(.+)/);
        let href    = `/search?all=${value}`;
        if (match !== null) href = `/search?${match[1]}=${match[2]}`;
        window.location.href = href;
    };

    // help and documentation page opens up on a new tab
    help = (e) => {
        window.open("/help");
    };

    render() {
        return (
            <div id="global_navigation_bar">
                <nav>
                    <ul>
                        <li id="tour_home"><NavLink className="wide" exact activeClassName="current"
                                                    to="/">HOME</NavLink></li>
                        {this.state.role === 'author' ?
                            <li id="tour_upload">
                                <NavLink exact activeClassName="current" to="/upload">UPLOAD</NavLink>
                            </li> : <></>
                        }
                        <li id="tour_account"><NavLink exact activeClassName="current" to="/account">ACCOUNT</NavLink>
                        </li>
                    </ul>
                </nav>
                <input type="text"
                       placeholder="Search   Tag:<tag_name> to search journals under a specific tag."
                       id="global_search_bar"
                       onKeyPress={this.searchBarOnKeyPress}
                />
                <button className="help-menu"
                        onClick={() => this.setState({helpMenu: true})}>
                    Help Menu
                </button>
                {this.state.helpMenu ? this.renderHelpMenu() : <span/>}
                {this.state.startTour ? this.renderTour() : <span/>}
            </div>
        );
    }

    // render help menu with online documentation, legends for keyboard shortcuts and button to begin user onboarding tour
    renderHelpMenu() {
        return (<div id="openModal">
            <div>
                <a title="Close" className="close" onClick={() => this.setState({helpMenu: false})}>
                    &times;
                </a>
                <h1>Help Menu</h1>
                <h3>Online Documentation</h3>
                <br/>
                <button onClick={this.help}>Browse Support</button>
                <br/>
                <br/>
                <h3>Keyboard Shortcuts</h3>
                <br/>
                <p><b>Home</b>&nbsp;&nbsp;:&nbsp;&nbsp;<kbd><code>alt + b</code></kbd></p>
                <p><b>Upload</b>&nbsp;&nbsp;:&nbsp;&nbsp;<kbd><code>alt + n</code></kbd></p>
                <p><b>Account</b>&nbsp;&nbsp;:&nbsp;&nbsp;<kbd><code>alt + m</code></kbd></p>
                <h3>Onboarding Walkthrough</h3>
                <br/>
                <button on onClick={() => this.setState({startTour: true})}>Show Tour</button>
            </div>
        </div>);
    };

    // render user onboarding tour using intro.js
    renderTour() {
        const {
                  stepsEnabled,
                  steps,
                  initialStep
              } = this.state;

        return (
            <div>
                <Steps
                    enabled={stepsEnabled}
                    steps={steps}
                    initialStep={initialStep}
                    onExit={this.onExit}
                />
            </div>
        );
    }

    onExit = () => {
        this.setState(() => ({stepsEnabled: false}));
    };
}

export default Navigation;
