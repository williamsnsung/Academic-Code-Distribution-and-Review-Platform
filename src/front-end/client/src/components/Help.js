import React from 'react';
import '../style/Help.css';

class Help extends React.Component {

    render() {
        return (
            <div id="help-box">
                <p><b><h2>Help and Documentation</h2></b>

                    <br></br>
                    <h3><b><u>Home</u></b></h3>
                    <br></br>
                    <p>The <a href="/">Home</a> page shows a curated lists of posts for your organisation.</p>
                    <p>The 'Recommendation' tab shows a list of recommended posts.</p>
                    <p>The 'Explore Post' tab shows the entire list of posts.</p>
                    <p>The 'Your Journals' tab shows all your journals.</p>
                    <p>The 'Your Posts' tab shows all your posts.</p>
                    <p>The 'Explore More' button allows you to extend the list of displayed posts.</p>
                    <p>The side bar displays your user profile and user stats.</p>

                    <br></br>
                    <h3><b><u>Upload</u></b></h3>
                    <br></br>
                    <p><b>How do I upload a post?</b></p>
                    <p>You need to have the role of an 'Author' to upload posts.</p>
                    <p>The 'Title' placeholder is where you add the title of the post.</p>
                    <p>The 'Description placeholder is where you add the description of the post.</p>
                    <p>You can add tags to your posts by typing in the name of a tag and press ENTER.</p>
                    <p>Press 'Choose file' to select the file that you would like to upload from your directory.</p>
                    <p>Press the 'Submit' button to confirm and publish your post.</p>
                    <p>The Upload page supports syntax highlighting for the following file formats: <kbd>.js</kbd>, <kbd>.jsx</kbd>, <kbd>.hpp</kbd>, <kbd>.h</kbd>, <kbd>.c</kbd>, <kbd>.cpp</kbd>, <kbd>.html</kbd>, <kbd>.css</kbd>, <kbd>.java</kbd>, <kbd>.json</kbd>, <kbd>.md</kbd>, <kbd>.php</kbd>, <kbd>.py</kbd>, <kbd>.rs</kbd>, <kbd>.sql</kbd>, <kbd>.xml</kbd>.</p>
                    <p>The Upload page supports the following media file formats: <kbd>.MP4</kbd>, <kbd>.MPEG</kbd>, <kbd>.OGG</kbd>, <kbd>.TS</kbd>, <kbd>.WEBM</kbd>, <kbd>.3GP</kbd>, <kbd>.3G2</kbd>.</p>

                    <br></br>
                    <h3><b><u>Posts</u></b></h3>
                    <br></br>
                    <p><b>How can I edit a post?</b></p>
                    <p>You can edit a post using the text editor if you are the author of the post.</p>
                    <p>Press the 'Save' button to save changes.</p>
                    <p><b>How can I comment on a post?</b></p>
                    <p>You need to log into your account before you can post a comment.</p>


                    <br></br>
                    <h3><b><u>Account</u></b></h3>
                    <br></br>
                    <p><b>How do I sign up for a new account?</b></p>
                    <p>You can sign up for a new user account on the <a href="/account">Account</a> page.</p>
                    <p>Enter your first name, last name, gender, email, phone number, role and password to sign up for a new account.</p>
                    <p>Press the 'Sign Up' button after you have entered all mandatory information.</p>

                    <p><b>How do I log into my existing account?</b></p>
                    <p>Enter your user ID and your password to log in.</p>
                    <p>Press the 'Log In' button after you have enter all mandatory information.</p>
                    <p><b>What if I forget my password for log in?</b></p>
                    <p>An email will be sent to you to reset your password.</p>

                    <p><b>How do I log into other supergroup journals?</b></p>
                    <p>You will be redirected to your target supergroup journal to enter your login credentials. Then press the 'AutheriseJournal' button to proceed.</p>

                    <p><b>How do I log into the journal from another supergroup?</b></p>
                    <p>Enter your team name in the format 't(team name)' and press the 'Supergoup Log In' button.</p>

                    <p><b>Where can I find my profile page?</b></p>
                    <p>The profile page is displayed after you have logged into an existing account.</p>
                    <p>The profile page displays your user ID, email, phone and the date of account creation.</p>

                    <p><b>Where can I find my viewing history of posts?</b></p>
                    <p>The viewing history of posts is displayed on your profile page in 'Account'.</p>

                    <br></br>
                    <h3><b><u>Search</u></b></h3>
                    <br></br>
                    <p>How do I search for posts, journals, users and tags?</p>
                    <p>Enter the post/journal title, user or tag name in the <a href="/search">Search</a> bar then press ENTER to display search results. The number of search results is displayed on the left.</p>

                    <br></br>
                    <h3><b><u>Help Menu</u></b></h3>
                    <br></br>
                    <p>Help Menu provides immediate support via online documentation, advanced keyboard shortcuts and a user onboarding tour.</p>
                    <p>Press the 'Show Tour' button to start the user onboarding tour.</p>


                </p>
            </div>
        );
    }
};

export default Help;
