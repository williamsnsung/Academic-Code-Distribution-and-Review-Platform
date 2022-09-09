const GEN_OFFSET           = 36;
const EMAIL_NAME_LEN       = 10;
const EMAIL_HOST_LEN       = 7;
const EMAIL_TOP_DOMAIN_LEN = 4;
const PHONE_MASK           = 1000000000;
const DATE_START           = new Date(1998, 1, 1);
const DATE_END             = new Date();
const BOOLEAN_BOUND        = 0.5;
const TWO                  = 2;
const UID_STRING_LEN       = 6;

/**
 * Randomly generates a string.
 * Derived from https://gist.github.com/6174/6062387.
 * @param {Number} length Length of string.
 * @returns {string} Result.
 */
export function genString(length) {
    length = Math.floor(length);
    return [...Array(length)].map(() => (~~(Math.random() * GEN_OFFSET)).toString(GEN_OFFSET)).join('');
}

/**
 * Generates a unique user ID for database entry.
 * 56 billion UUID combinations are possible for each millisecond.
 * @returns unique user ID
 */
export function genUUID(suffix) {
    const now       = String(Date.now());
    const middlePos = Math.ceil(now.length / TWO);
    const output    = `${now.substr(0, middlePos)}-${genString(UID_STRING_LEN)}-${now.substr(middlePos)}`;
    return `${output}${suffix}`;
}

/**
 * Randomly generates an integer between the specified values.
 * The maximum is exclusive and the minimum is inclusive.
 * @param {Number} min minimum possible value.
 * @param {Number} max maximum possible value.
 * @returns {number} Result.
 */
export function genInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Randomly generates a positive integer.
 * The maximum is exclusiv.
 * @param {Number} max maximum possible value.
 * @returns {number} Result.
 */
export function genPosInt(max) {
    return genInt(0, max);
}

/**
 * Randomly generates an email.
 * @returns {string} Result.
 */
export function genEmail() {
    return genString(EMAIL_NAME_LEN) + '@' +
           genString(EMAIL_HOST_LEN) + '.' +
           genString(EMAIL_TOP_DOMAIN_LEN);
}

/**
 * Randomly generates a phone number.
 * @returns {string} Result.
 */
export function genPhone() {
    return Math.floor(Math.random() * PHONE_MASK).toString();
}

/**
 * Randomly generates a Date in range.
 * @returns {Date} Result.
 */
export function genDatetime() {
    let date = new Date(
        DATE_START.getTime() + Math.random() * (DATE_END.getTime() - DATE_START.getTime())
    );
    date.setMilliseconds(0);
    return date;
}

/**
 * Randomly generates a Date from 'start'.
 * @param start Earliest time allowed.
 * @returns {Date} Result.
 */
export function genDatetimeFrom(start) {
    let date = new Date(
        start.getTime() + Math.random() * (DATE_END.getTime() - start.getTime())
    );
    date.setMilliseconds(0);
    return date;
}

/**
 * Randomly generates a boolean value.
 * @returns {boolean} Result.
 */
export function genBoolean() {
    return Math.random() < BOOLEAN_BOUND;
}