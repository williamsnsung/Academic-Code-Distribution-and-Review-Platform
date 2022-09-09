/**
 * Gets one cookie value.
 * @param cName Cookie name.
 * @returns {string|null} Cookie value.
 */
export function getCookie(cName) {
    const name          = cName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca            = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;    // if the cookie is undefined
}

/**
 * Sets one cookie.
 * This method set session cookie: cookies disappear after closing browser.
 * @param cName Cookie name.
 * @param cValue Cookie value.
 */
export function setCookie(cName, cValue) {
    document.cookie = String(cName) + "=" + String(cValue);
}

/**
 * Delete one cookie.
 * @param cName Cookie name.
 */
export function deleteCookie(cName) {
    document.cookie = String(cName) + "=; Max-Age=0";
}

export function deleteAllCookies() {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const eqPos     = cookie.indexOf("=");
        const name      = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}


//SGState is the cookie that stores the state when user from secondary tries to log in 