import React         from 'react';
import config        from '../config.json';
import "../style/Export.css";
import {getEleValue} from "../utils/DocumentHandler";
import {exportPost}  from "../utils/export-client";
import {SERVER_HOST} from "../util";

const axiosConfig = `${config.axiosConfigFormData}`;
const uploadURL   = `${SERVER_HOST}/sg/export`;

class Export extends React.Component {

    submit = () => {

        const id = getEleValue("postID");
        const destination = getEleValue("superGroupID");
        exportPost(id, destination);   
    };

    render() {
        return (<div>
            <div className="export">
                {this.exportHTML}
            </div>
        </div>);
    }

    exportHTML =
        <div className="exportContainer">
            <h1>Export Your Post</h1>
            <div className="exportForm">
                <input type="text" id="postID" placeholder="Post ID"/><br/>
                <input type="text" id="superGroupID" placeholder="Journal ID"/><br/>
                <button onClick={this.submit}>Submit</button>
            </div>
            <div className="exportJournals">
                
                <table class="journal-table">
                <h2>Connected Code Journals</h2>
                    <tr>
                        <th>Journal ID</th>
                        <th>Address</th>
                    </tr>
                    <tr>
                        <td>t03</td>
                        <td>https://cs3099user03.host.cs.st-andrews.ac.uk/</td>
                    </tr>
                    <tr>
                        <td>t06</td>
                        <td>https://cs3099user06.host.cs.st-andrews.ac.uk/</td>
                    </tr>
                    <tr>
                        <td>t09</td>
                        <td>https://cs3099user09.host.cs.st-andrews.ac.uk/</td>
                    </tr>
                    <tr>
                        <td>t12</td>
                        <td>https://cs3099user12.host.cs.st-andrews.ac.uk/</td>
                    </tr>
                    <tr>
                        <td>t15</td>
                        <td>https://cs3099user15.host.cs.st-andrews.ac.uk/</td>
                    </tr>
                    <tr>
                        <td>t18</td>
                        <td>https://cs3099user18.host.cs.st-andrews.ac.uk/</td>
                    </tr>
                    <tr>
                        <td>t21</td>
                        <td>https://cs3099user21.host.cs.st-andrews.ac.uk/</td>
                    </tr>
                    <tr>
                        <td>t24</td>
                        <td>https://cs3099user24.host.cs.st-andrews.ac.uk/</td>
                    </tr>
                    <tr>
                        <td>t27</td>
                        <td>https://cs3099user27.host.cs.st-andrews.ac.uk/</td>
                    </tr>
                </table> 
            </div>
        </div>;
}

export default Export;
