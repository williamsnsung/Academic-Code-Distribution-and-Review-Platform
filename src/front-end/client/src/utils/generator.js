const TWO                  = 2;
const STATE_STRING_LEN       = 6;
const GEN_OFFSET           = 36;

export function genUUID() {
    const now       = String(Date.now());
    const middlePos = Math.ceil(now.length / TWO);
    const output    = `${now.substr(0, middlePos)}-${genString(STATE_STRING_LEN)}-${now.substr(middlePos)}`;
    return output;
}

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