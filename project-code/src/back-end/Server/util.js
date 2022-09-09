/*
 * Global Constants.
 */

export const PORT_NO    = 5102;
export const ID_POSTFIX = ':t03';   // Identifier for user IDs as required by supergroup standards.

/* Arguments */
export const OFF_CAMPUS_MODE = '--off';

/* Status */
export const SUCC_STAT = 1;         // Success Status
export const EERR_STAT = 0;         // Expected Error Status
export const UERR_STAT = -1;        // Unexpected Error Status

/* Status Code */
export const C200 = 200;            // if input validation passed - process request
export const C400 = 400;            // if input validation not passed or wrong data format received - send appropriate 400 bad request
export const C500 = 500;            // 500 internal server error - error not a result of client input
export const C501 = 501;

/* Upload File */
export const JOURNAL_DIR = '../Journals/';

export function getExtension(filepath) {
    return filepath.split('.').pop();
}

export function getVideoHeader(filepath) {
    switch (getExtension(filepath)) {
        case 'mp4':
            return 'video/mp4';
        case 'mpeg':
            return 'video/mpeg';
        case 'ogg':
            return 'video/ogg';
        case 'ts':
            return 'video/mp2t';
        case 'webm':
            return 'video/webm';
        case '3gp':
            return 'video/3gpp';
        case '3g2':
            return 'video/3gpp2';
        default:
            return null;
    }
}