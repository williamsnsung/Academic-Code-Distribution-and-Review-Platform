import React, { Component } from 'react';
import {
    BrowserRouter,
    Route, Switch
}                           from 'react-router-dom';
import './style/stylesheet.css';

import Home            from './components/Home';
import Account         from './components/Account';
import Upload          from './components/Upload';
import Error           from './components/Error';
import Help            from './components/Help';
import Navigation      from './components/Navigation';
import Footer          from './components/Footer';
import APost           from './components/APost';
import Search          from './components/Search';
import { SERVER_HOST } from './util';

require('dotenv').config();

console.log(`[IMPORTANT]: You are connected to ${SERVER_HOST}.`);

class App extends Component {
    render() {
        document.addEventListener('keydown', e => {
            if (e.altKey) {
                const key = e.key.toLowerCase();
                if (key === 'b') {
                    window.location.href = '/';
                } else if (key === 'm') {
                    window.location.href = '/account';
                } else if (key === 'n') {
                    window.location.href = '/upload';
                }
            }
        });
        return (
            <BrowserRouter>
                <div className="page">
                    <div id="__LOADING__"/>
                    <Navigation/>
                    <Switch>
                        <Route path="/" component={Home} exact/>
                        <Route path="/account" component={Account}/>
                        <Route path="/callback" component={Account}/>
                        <Route path="/upload" component={Upload}/>
                        <Route path="/post" component={APost}/>
                        <Route path="/search" component={Search}/>
                        <Route path="/help" component={Help}/>
                        <Route component={Error}/>
                    </Switch>
                </div>
                <div id="__BUFFER__"/>
                <Footer/>
            </BrowserRouter>
        );
    }
}

export default App;
