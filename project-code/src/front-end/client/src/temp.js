import React from 'react';
import './index.css';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: null,
        };
    }

    render() {
        const res = display(this.state.value);
        return (
            <div className="pane">
                <div className="navBar">
                    <ul>
                        <li>
                            <button className="Home" onClick={() => this.setState({value: "Home"})}>
                                Home
                            </button>
                        </li>
                        <li>
                            <button className="Create Post" onClick={() => this.setState({value: "Create Post"})}>
                                Create Post
                            </button>
                        </li>
                        <li>
                            <button className="Account" onClick={() => this.setState({value: "Account"})}>
                                Account
                            </button>
                        </li>
                        <li>
                            <button className="Logout" onClick={() => this.setState({value: "Logout"})}>
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="dynaPane">
                    {res}
                </div>
            </div>
        );
    }

}

function display(state) {
    if (state == "Account") {
        return (
            <SignUp/>
        );
    } else {
        return (
            state
        );
    }
}

export default App;
