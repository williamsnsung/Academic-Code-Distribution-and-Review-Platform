// import {currentDate} from "./currentDate.js";

/**
 * Basic request logger.
 * This function will log requests in the terminal where the server is running.
 * Intended purely for testing during development, not recommended for final version.
 *
 * @param {Request} req request from client
 * @param {Response} res response to client
 * @param {Function} next go to next middleware function
 */
const logger = (req, res, next) => {

    const reqTarget = `${req.protocol}://${req.get('host')}${req.originalUrl} : `;

    console.log(reqTarget + new Date());
    next();
};

export {logger}; 
