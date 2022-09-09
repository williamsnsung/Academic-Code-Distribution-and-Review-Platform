/*
 * Global Constants.
 */

export const ID_POSTFIX = ':t03';   // Identifier for user IDs as required by supergroup standards.
//export const SERVER_HOST = "http://localhost:5102";
export const SERVER_HOST = process.env.REACT_APP_SERVER === 'LOCAL' ?
    'http://localhost:5102' :
    'https://cs3099user03.host.cs.st-andrews.ac.uk/api';

/* Status */
export const SUCC_STAT = 1;         // Success Status
export const EERR_STAT = 0;         // Expected Error Status
export const UERR_STAT = -1;        // Unexpected Error Status

/* Status Code */
export const C200 = 200;
export const C400 = 400;
export const C500 = 500;

/* Cookies */
export const LOGIN      = 'Login';
export const LOGIN_SUCC = 'Success';
export const USERID     = 'Userid';
export const USERFN     = 'Userfn';
export const USERLN     = 'Userln';
export const USEREM     = 'Useremail';
export const USERPH     = 'Userphone';
export const USERST     = 'Userstatus';
export const USERTK     = 'Usertoken';
export const USERRE     = 'User_regis_date';
export const MODE       = 'Mode';
export const EDIT_MODE  = 'EditMode';

/* Super Group */
export const SUPERLOGIN = 'SUPERGC';

export function FORCE_LOADING_ACTIVATE() {
    const container     = document.getElementById('__LOADING__');
    container.innerHTML =
        `<div id ='__LOADING__BLOCK_DIV'><div class="lds-facebook"><div></div><div></div><div></div></div></div>`;
}

export function FORCE_LOADING_DEACTIVATE() {
    const container     = document.getElementById('__LOADING__');
    container.innerHTML = '';
}