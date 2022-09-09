import React from 'react';
import '../style/Footer.css';
const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-links">
                    <ul>
                        <li><a href="/">ABOUT</a></li>
                        <li><a href="/">PRIVACY</a></li>
                        <li><a href="/">CONTACT</a></li>

                    </ul>
                </div>
                <p>© CS3099 TEAM 3. ALL RIGHTS RESERVED.</p>
                <p>All trademarks refernced herein are the properties of their respective owners.</p>
            </div>
        </footer>
    );
};

export default Footer;