import React                       from 'react';
import {
    SUCC_STAT, C200, LOGIN, LOGIN_SUCC, USERID, USERFN,
    USERLN, USEREM, USERST, USERTK, SERVER_HOST, USERPH, USERRE, FORCE_LOADING_ACTIVATE, FORCE_LOADING_DEACTIVATE
}                                  from '../util.js';
import {
    deleteAllCookies,
    getCookie,
    setCookie
}                                  from '../utils/Cookies';
import { renderGlobalTips }        from '../utils/globalTips';
import {
    validateLogin,
    validateRegistration,
    validatePassword
}                                  from '../utils/validate-client';
import { getEleValue, setEleText } from '../utils/DocumentHandler';
import sGCLocation                 from '../sGCLocation.json';
import { genUUID }                 from '../utils/generator.js';
import { POST }                    from '../utils/request';
import History                     from './History';
import '../style/Account.css';

const rgstrURL  = `${SERVER_HOST}/api/register`;
const loginURL  = `${SERVER_HOST}/api/login`;
const forgetURL = `${SERVER_HOST}/api/forgot`;
const SSOURL    = `${SERVER_HOST}/sg/sso`;

/************** */

class Account extends React.Component {
    state = {
        login : getCookie(LOGIN) === LOGIN_SUCC,
        forgot: false
    };

    componentDidMount() {
        renderGlobalTips(this.tipsHTML);
        if (this.state.login === true) {
            this.setText();
        }
        if (this.checkCallback() && this.state.login != 1 ) {
            let url = window.location.href.split('?')[1].split('&');

            let data = {
                from : url[0].split('=')[1],
                state: url[1].split('=')[1],
                token: url[2].split('=')[1]
            };
            console.log(data);
            this.send(SSOURL + '/callback_helper', data);
        }
        // console.log(process.env.REACT_APP_SERVER_HOST);
    }

    checkCallback() {
        return window.location.href.includes('callback');
    }

    login = () => {
        FORCE_LOADING_ACTIVATE();
        const data = {
            userid  : getEleValue('lUserid'),
            password: getEleValue('lPassword')
        };

        /* client side validation */
        const result = validateLogin(data);
        if (result.status === SUCC_STAT) {
            const sup = {team: data.userid.split(':')[1]};
            if (sup.team !== 't03') {
                alert('Please use supergroup login for other team accounts.');
            } else {
                this.send(loginURL, data);
            }
        } else {
            console.error(result.message);
            alert(result.message);
        }
    };

    splogin = () => {
        FORCE_LOADING_ACTIVATE();
        const spUserid = getEleValue('lUserid_sg');
        const team     = spUserid.split(':')[1];
        if (team === 't03') {
            alert('Please use normal login for team3 accounts.');
        } else {
            this.getTeamAddress(team);
        }
    };

    getTeamAddress(sTeamNum) {
        let address = sGCLocation[sTeamNum];
        if (address === undefined) {
            alert('No such super group exists, please try again');
        } else {
            this.setSGCCookies(address);
            sessionStorage.setItem('state:', this.getSGState());
            address += 'api/sg/sso/login?from=' + SERVER_HOST.slice(0, -3) + '&state=' + this.getSGState();
            window.location.href = address;
            POST(SSOURL + '/storeState', {state: this.getSGState()}, () => {
                FORCE_LOADING_DEACTIVATE();
                window.location.href = address;
            });
        }
        return address;
    }

    setSGCCookies(SGurl) {
        let SGState = genUUID();
        setCookie('SGState', SGState);
        setCookie('SGURL', SGurl);
    }

    getSGState() {
        return getCookie('SGState');
    }

    logout = () => {
        deleteAllCookies();
        this.setState({login: false, forgot: false});
        document.location.reload();
    };

    signup = () => {
        /* get input data from form */
        const data = {
            firstname: getEleValue('firstname'),
            lastname : getEleValue('lastname'),
            email    : getEleValue('email'),
            phone    : getEleValue('phone'),
            password : getEleValue('password'),
            rpassword: getEleValue('rpassword'),
            gender   : getEleValue('gender'),
            role     : getEleValue('role')
        };
        /* client side validation */
        const result = validateRegistration(data);
        if (result.status === SUCC_STAT) {
            this.send(rgstrURL, data);   // Client side validation success.
        } else {
            console.error(result.message);
            alert(result.message);
        }
    };

    forgot = () => {
        const username = getEleValue('lUserid');
        if (username === '') {
            alert('Please enter the username to be recovered');
        } else {
            setCookie('fusername', username);
            const data = {userid: username};
            this.send(forgetURL, data);
        }
    };

    checkToken = () => {
        FORCE_LOADING_ACTIVATE();
        const token  = getEleValue('ftoken');
        const pword  = getEleValue('password');
        const rPword = getEleValue('rpassword');
        try {
            validatePassword(pword, 40, 8);
            if (token === '') {
                alert('Please enter the token value sent to the email');
            } else if (rPword !== pword) {
                alert('Password does not match');
            } else {
                const data = {
                    userid: getCookie('fusername'),
                    token : token
                };
                this.send(forgetURL + '/check', data);
            }
        } catch (error) {
            alert('Syntax error');
        }
    };

    autherise = () => {
        const data = {
            userid  : getEleValue('lUserid'),
            password: getEleValue('lPassword')
        };

        /* client side validation */
        const result = validateLogin(data);
        if (result.status === SUCC_STAT) {
            const sup = {team: data.userid.split(':')[1]};
            if (sup.team !== 't03') {
                alert('Please use supergroup login for other team accounts.');
            } else {
                POST(loginURL, data, (res) => {
                    if (res.status === C200) {
                        let url              = window.location.href.split('?')[1].split('&');
                        let state            = url[0].split('=')[1];
                        let from             = url[1].split('=')[1];
                        window.location.href = from + '/api/sg/sso/callback?token=' + res.data.user.token + '&from=' + SERVER_HOST + '&state=' + state;
                    } else alert(res.data.message);
                });
            }
        } else {
            console.error(result.message);
            alert(result.message);
        }
    };

    send(url, data) {
        POST(url, data, (res) => {
            if (res.data.message === 'Email sent') {
                alert('Email Has been sent to the provided address');
                this.setState({login: false, forgot: true});
            } else if (res.status === C200) {
                this.success(res.data.user);
            } else alert(res.data.message);
            document.location.reload();
            FORCE_LOADING_DEACTIVATE();
        });
    }

    success(user) {
        console.log(user);
        setCookie(LOGIN, LOGIN_SUCC);
        setCookie(USERID, user.id);
        setCookie(USERFN, user.fn);
        setCookie(USERLN, user.ln);
        setCookie(USEREM, user.email);
        setCookie(USERPH, user.phone);
        setCookie(USERST, user.status);
        setCookie(USERTK, user.token);
        setCookie(USERRE, user.regis_date);
        this.setState({login: true, forgot: false});
        this.setText();
    }

    setText() {
        const fn = getCookie(USERFN), ln = getCookie(USERLN);
        setEleText('userid', getCookie(USERID));
        setEleText('username', `${fn} ${ln}`);
        setEleText('useremail', getCookie(USEREM));
        setEleText('userphone', getCookie(USERPH));
        setEleText('abbreviation', `${fn[0]}${ln[0]}`);
        setEleText('user_regis_date', `${new Date(getCookie(USERRE)).toString()}`);
        setEleText('userstatus', getCookie(USERST));
    }

    render() {
        return <> {this.state.forgot ? this.forgotHTML : (this.state.login ? this.logoutHTML : this.loginHTML)}</>;
    }

    logoutHTML =
        <>
            <div className="RL_main">
                <div className="RGST_LGIN">
                    <div className="RL_logged">
                        <h2 id="abbreviation"/>
                        <h6 id="userstatus"/>
                        <h1 id="username">...</h1>
                        <p id="userid">...</p>
                        <p id="useremail">...</p>
                        <p id="userphone">...</p>
                        <p id="user_regis_date">...</p>
                        <br/>
                        <button onClick={this.logout}>Logout</button>
                    </div>
                </div>

            </div>
            <History/>
        </>;

    forgotHTML =
        <div className="RL_main">
            <div className="RGST_LGIN">
                <div className="RL_logged">
                    <div className="RL_box">
                        <input type="text" id="ftoken" placeholder="Enter Token from email"/><br/>
                        <input type="password" id="password" placeholder="New Password"/><br/>
                        <input type="password" id="rpassword" placeholder="re-enter Password"/><br/>
                        <button onClick={this.checkToken}>Submit</button>
                    </div>
                </div>
            </div>
        </div>;

    loginHTML =
        <div className="RL_main">
            <div className="RGST_LGIN">
                <div className="RL_column">
                    <div className="RL_box">
                        {this.renderInput('text', 'firstname', 'First Name')}
                        {this.renderInput('text', 'lastname', 'Last name')}
                        {this.renderGenderBar()}
                        {this.renderInput('text', 'email', 'Email')}
                        {this.renderInput('text', 'phone', 'Phone Number')}
                        {this.renderRoleBar()}
                        {this.renderInput('password', 'password', 'Password')}
                        {this.renderInput('password', 'rpassword', 're-enter Password')}
                        <button onClick={this.signup}>Sign Up</button>
                    </div>
                </div>
                <div className="RL_column">
                    <div className="RL_box">
                        {this.renderInput('text', 'lUserid', 'User ID')}
                        {this.renderInput('password', 'lPassword', 'Password')}
                        <button id="forgot" onClick={this.forgot}>Forgot Password</button>
                        <br/>
                        <button onClick={this.login}>Log In</button>
                        <button onClick={this.autherise} style={{marginLeft: '20px'}}> AutheriseJournal</button>
                    </div>
                    <div className="RL_box" style={{marginTop: '30px'}}>
                        {this.renderInput('text', 'lUserid_sg', 'Supergroup User ID')}
                        <button onClick={this.splogin}>Supergroup Log In</button>
                    </div>
                </div>
            </div>
        </div>;

    renderInput(type, id, placeholder) {
        return (<div className="input-group">
            <label className="input-underlined">
                <input className="input-bar" type={type} id={id} required/>
                <span className="input-label">{placeholder}</span>
            </label>
        </div>);
    }

    renderGenderBar() {
        return (
            <div className="input-group">
                <label className="input-underlined">
                    <select className="input-bar select-bar" id="gender">
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="transgender-female">Transgender Female</option>
                        <option value="transgender-male">Transgender Male</option>
                        <option value="gender-variant">Gender Variant</option>
                        <option value="not-listed">Not listed</option>
                    </select>
                    <span className="input-label">Gender</span>
                </label>
            </div>
        );
    }

    renderRoleBar() {
        return (
            <div className="input-group">
                <label className="input-underlined">
                    <select className="input-bar select-bar" id="role">
                        <option value="viewer">Viewer</option>
                        <option value="author">Author</option>
                        <option value="reviewer">Reviewer</option>
                    </select>
                    <span className="input-label">Who are you</span>
                </label>
            </div>
        );
    }

    tipsHTML = <p>
        You may not see the <b>Upload</b> section if you are not an author.
    </p>;
}

export default Account;
