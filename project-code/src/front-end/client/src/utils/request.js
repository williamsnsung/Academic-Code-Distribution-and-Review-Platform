import axios  from "axios";
import config from "../config.json";
import {C200} from "../util";

const axiosConfig = `${config.axiosConfigJSON}`;

export function POST(url, data, callback) {
    POST_CATCH(url, data, callback, err => {
        console.error(err);
        alert(err);
    });
}

export function POST_CATCH(url, data, callback, errHandler) {
    axios.post(url, data, axiosConfig.headers)
         .then(callback)
         .catch(errHandler);
}

export function POST200(url, data, callback) {
    POST(url, data, (res) => {
        if (res.status === C200) callback(res);
        else alert(res.data.message);
    });
}

export function GET(url, callback) {
    axios.get(url)
         .then(callback)
         .catch(err => {
             console.error(err);
             alert(err);
         });
}

export function GET200(url, callback) {
    GET(url, (res) => {
        if (res.status === C200) callback(res);
        else alert(res.data.message);
    });
}