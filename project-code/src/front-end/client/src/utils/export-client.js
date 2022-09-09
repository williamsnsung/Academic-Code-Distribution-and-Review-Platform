import React                                     from 'react';
import axios                                     from 'axios';
import config                                    from '../config.json';
import { FORCE_LOADING_DEACTIVATE, SERVER_HOST } from '../util';

const axiosConfig = `${config.axiosConfigFormData}`;
const uploadURL   = `${SERVER_HOST}/sg/resources/export`;

/**
 * Export post to another journal
 */
export function exportPost(id, destination) {
    const data = {
        id         : id,
        destination: destination
    };

    try {
        send(data);
    } catch (error) {
        console.error(error);
        alert(error.message);
        FORCE_LOADING_DEACTIVATE();
    }
}

function send(data) {
    axios.post(uploadURL, data, axiosConfig.headers)
        .then((response) => {
            console.log(response);
            alert('Successfully Uploaded File!');
            FORCE_LOADING_DEACTIVATE();
        })
        .catch((error) => {
            console.error('error');
            alert(error.response.data.message);
            FORCE_LOADING_DEACTIVATE();
        });
}
