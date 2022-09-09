import {ValidationError}                 from "./customErrors.js";
import {EERR_STAT, SUCC_STAT, UERR_STAT} from "../util.js";

/* INPUT VALIDATION VALUES */
const UID_MAX   = 96;           // user id maximum char length
const UID_MIN   = 5;            // user id minimum char length
const FIRST_MAX = 32;           // firstname maximum char length
const LAST_MAX  = 32;           // lastname maximum char length
const NAME_MIN  = 2;            // common minimum char length
const PHONE_MAX = 32;           // phone number maximum char length
const PHONE_MIN = 5;            // phone number minimum char length
const EMAIL_MAX = 96;           // email address maximum char length
const EMAIL_MIN = 5;            //  email address minimum char length
const PASS_MAX  = 40;           // password maximum char length
const PASS_MIN  = 8;            // password minimum char length
const COMMT_MIN = 10;           // description
const COMMT_MAX = 100;          // description

const FILENAME_MAX = 128;       // filename maximum char length
const FILENAME_MIN = 5;         // filename minimum char length
const FILESIZE_MAX = 67108864;  // 8 Mebibyte (MiB)
const FILESIZE_MIN = 8192;      // 1 Kilobyte (KiB)

/* Regex */
// email regex source: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
// phone regex source: https://ihateregex.io/expr/phone/

const idRegex    = /^\d+-\w+-\d+:t03$/;
const nameRegex  = /^[a-zA-Z]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9().+\s]+$/;
const titleRegex = /^.+$/;

const validFileExtensions = ['txt', 'js', 'java', 'py', 'c', 'zip'];

/* INPUT VALIDATION FUNCTIONS */

/**
 * Server-side input validation for login validation.
 * Performs a number of validation checks to determine whether the user input is valid.
 * @param {{userid,password,state}} data login account data from client
 * @returns json object showing result of validation in format {"status": "...", "message" : "..."}
 */
export function validateLogin(data) {
    let result;
    try {
        validateInput(data.userid, "User ID", UID_MAX, UID_MIN, idRegex);
        validatePassword(data.password, PASS_MAX, PASS_MIN);
        result = {                                      // validation passed without error - input is valid
            status : SUCC_STAT,
            message: "SUCCESS"
        };
    } catch (error) {
        result = universalErrorHandling(error);  // handles the error and returns appropriate response
    }
    return result;
}

/**
 * Server-side input validation for user registration.
 * Performs a number of validation checks to determine whether the user input is valid.
 *
 * @param {{firstname, password, phone, email, lastname, rpassword}} data register account data from client
 * @returns json object showing result of validation in format {"status" : "...", "message" : "..."}
 */
export function validateRegistration(data) {
    let result;
    try {
        validateInput(data.firstname, "firstname", FIRST_MAX, NAME_MIN, nameRegex);
        validateInput(data.lastname, "lastname", LAST_MAX, NAME_MIN, nameRegex);
        validateInput(data.email, "email", EMAIL_MAX, EMAIL_MIN, emailRegex);
        validateInput(data.phone, "phone number", PHONE_MAX, PHONE_MIN, phoneRegex);
        if (data.rpassword !== data.password) throw new ValidationError("Password doesn't match.");
        validatePassword(data.password, PASS_MAX, PASS_MIN);
        result = {                                      // validation passed without error - input is valid
            status : SUCC_STAT,
            message: "SUCCESS"
        };
    } catch (error) {
        result = universalErrorHandling(error);  // handles the error and returns appropriate response
    }
    return result;
}

/**
 * Input validation for both the length and syntax of given data - usable for most String data.
 *
 * @param {String} data the data to validate.
 * @param {String} datatype what the data is.
 * @param {Number} maxLength the maximum length the given data can be.
 * @param {Number} minLength the minimum length the given data can be.
 * @param {RegExp} regex regular expression that the data must adhere to.
 * @throws validation error if input is invalid.
 */
function validateInput(data, datatype, maxLength, minLength, regex) {
    checkLength(data, datatype, maxLength, minLength);
    checkRegex(data, datatype, regex);
}

/**
 * Checks if input data is compatible with the regex.
 * If input data is not compatible, throws validation error.
 *
 * @param {String} data the data to validate.
 * @param {String} datatype what the data is.
 * @param {RegExp} regex regular expression that the data must adhere to.
 */
function checkRegex(data, datatype, regex) {
    if (!(regex.test(data))) throw new ValidationError(`invalid ${datatype} syntax.`);
}

/**
 * Checks if input data is compatible with the length bounds.
 * If input data is not compatible, throws validation error.
 *
 * @param {String} data the data to validate.
 * @param {String} datatype what the data is.
 * @param {Number} maxLength the maximum length the given data can be.
 * @param {Number} minLength the minimum length the given data can be.
 */
function checkLength(data, datatype, maxLength, minLength) {
    if (data.length < minLength) {
        throw new ValidationError(`${datatype} must be at least ${minLength} characters long.`);

    } else if (data.length > maxLength) {
        throw new ValidationError(`${datatype} length must not exceed ${maxLength} characters.`);
    }
}

/**
 * Input validation designed specifically for passwords.
 * features additional validation to help increase account security.
 * password must inclide 1 lowercase char, 1 uppercase char, 1 digit and cannot contain 'Pass'
 *
 * @param {String} password the password to validate
 * @param {Number} maxLength the maximum length the given password can be.
 * @param {Number} minLength the minimum length the given password can be.
 * @throws validation error if password is invalid.
 */
export function validatePassword(password, maxLength, minLength) {
    checkLength(password, 'password', maxLength, minLength);

    if (password.search(/[a-z]/) < 0) {
        throw new ValidationError('password must contain at least 1 lowercase letter.');

    } else if (password.search(/[A-Z]/) < 0) {
        throw new ValidationError('password must contain at least 1 UPPERCASE letter.');

    } else if (password.search(/[0-9]/) < 0) {
        throw new ValidationError('password must contain at least 1 digit.');

    } else if (password.includes('password') || password.includes('Password')) {
        throw new ValidationError("password cannot contain the word 'password'.");
    }
}

/**
 * Server-side input validation for uploading a new journal.
 * Performs a number of validation checks to determine whether the input is valid.
 *
 * @param req the journal data to validate from client
 * @returns json object showing result of validation in format {"status" : "...", "message" : "..."}
 */
export function validateNewJournal(req) {
    let result;
    const files = req.files.files;
    try {
        for (let i = 0; i < files.length; i++) {
            const f = files[i], fn = f.name;
            checkLength(fn, "filename", FILENAME_MAX, FILENAME_MIN);
            checkSize(f.size, fn, FILESIZE_MAX, FILESIZE_MIN);
            // checkFileExtension(fn);
        }
        result = {
            status : SUCC_STAT,
            message: "SUCCESS"
        };
    } catch (error) {
        result = universalErrorHandling(error);  // handles the error and returns appropriate response
    }
    return result;
}

/**
 * Checks if input data is compatible with the size bounds.
 * If input data is not compatible, throws validation error.
 * INTENDED FOR things in KiB sizes.
 *
 * @param {String} data the data to validate.
 * @param {String} datatype what the data is.
 * @param {Number} maxLength the maximum length the given data can be.
 * @param {Number} minLength the minimum length the given data can be.
 */
function checkSize(data, datatype, maxLength, minLength) {
    if (data.length < minLength) {
        throw new ValidationError(`${datatype} must be at least ${minLength / (8 * 1024)} Kib.`);

    } else if (data.length > maxLength) {
        throw new ValidationError(`${datatype} length must not exceed ${maxLength / (8 * 1024)} Kib.`);
    }
}

/**
 * Checks if file extension is present within the list of allowed extensions
 * @param {*} filename name of the file to be checked
 */
function checkFileExtension(filename) {
    // get file extension from filename
    const extension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    let valid       = false;
    // check if the extension is is the list of allowed extensions
    for (let i = 0; i < validFileExtensions.length; i++) {
        if (validFileExtensions[i] === extension) {
            valid = true;
            break;
        }
    }
    if (!valid) {
        throw new ValidationError(`The file '${filename}' consists of an unsupported format.`);
    }
}

export function validateComment(data) {
    let result;
    try {
        validateInput(data.comment, "comment", COMMT_MAX, COMMT_MIN, titleRegex);
        result = {
            status : SUCC_STAT,
            message: "SUCCESS"
        };
    } catch (error) {
        console.log(error);
        result = universalErrorHandling(error);  // handles the error and returns appropriate response
    }
    return result;
}

/**
 * Function created to deal with cases of duplication for error handling we frequently use.
 * This is uniform error handling designed to be used for validation of request input.
 *
 * @param {Error} error error to handle
 * @returns json object showing result of validation in format {"status" : "...", "message" : "..."}
 */
export function universalErrorHandling(error) {
    let result;
    if (error.name === "TypeError") {
        result = {"status": EERR_STAT, "message": "Missing data - server has not recieved all required fields."};
    } else if (error.name === "ValidationError") {
        result = {"status": EERR_STAT, "message": error.message};
    } else {
        result = {"status": UERR_STAT, "message": "Unexpected error."};
    }
    return result;
}
