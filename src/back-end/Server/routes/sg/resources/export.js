import express                  from 'express';
import fs         from 'fs';
import axios                    from 'axios';
import {Post}                   from "../../../../Database/utils/post.js";
import {Comment}                from "../../../../Database/utils/comment.js";
import {ValidationError}        from "../../../utils/customErrors.js";
import {universalErrorHandling} from "../../../utils/validate.js";
import {genToken, verifyJWT}                from "../../../utils/token.js";
import path from 'path';
import JSZip from 'jszip';
import {
    C200,
    C400,
    C500,
    EERR_STAT,
    SUCC_STAT,
    UERR_STAT
}                               from "../../../util.js";
// https://bobbyhadz.com/blog/javascript-dirname-is-not-defined-in-es-module-scope
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let router = express.Router();
let filePath;

const journals = {
    "t03": "https://cs3099user03.host.cs.st-andrews.ac.uk",
    "t06": "https://cs3099user06.host.cs.st-andrews.ac.uk",
    "t09": "https://cs3099user09.host.cs.st-andrews.ac.uk",
    "t12": "https://cs3099user12.host.cs.st-andrews.ac.uk",
    "t15": "https://cs3099user15.host.cs.st-andrews.ac.uk",
    "t18": "https://cs3099user18.host.cs.st-andrews.ac.uk",
    "t21": "https://cs3099user21.host.cs.st-andrews.ac.uk",
    "t24": "https://cs3099user24.host.cs.st-andrews.ac.uk",
    "t27": "https://cs3099user27.host.cs.st-andrews.ac.uk"
};
const SUCCESS = {"status": "ok"};
var errorJson = {
  "status": "error",
  "message": "Message describing the error.",
  "errors": {
    "additionalProp1": {
      "message": "This field is invalid"
    },
    "additionalProp2": {
      "message": "This field is invalid"
    },
    "additionalProp3": {
      "message": "This field is invalid"
    }
  }
}


// client initialises request to export a post to another journal
router.post('/', async (req, res) => {

    const result = await validateExportInit(req);
    switch (result.status) {
        case SUCC_STAT:     // if input validation passed - process request
            console.log("-- VALID EXPORT REQUEST");
            await initialiseExport(req, res);
            break;

        case EERR_STAT:    // if input validation not passed or wrong data format recieved - send appropriate 400 bad request
            res.status(C400).json({"status": "error", "message": `${result.message}`});
            console.error(`--INVALID EXPORT INPUT: ${result}`);
            break;

        case UERR_STAT:   // 500 internal server error - error not a result of client input
            res.status(C500).json({"status": "error", "message": "Internal Server Error"});
            console.error(`-- SERVER INIT EXPORT ERROR: ${result}`);
            break;
    }
});

// export to other journal (this exports a file)
router.get('/:id', async (req, res) => {
    const result = validateExportGET(req);
    let err = verifyJWT(req);
    if (err != null) 	
            res.status(C400).json({"status": "error", "message": "bad token"});
    switch (result.status) {
        case SUCC_STAT:     // if input validation passed - process request
            console.log("-- VALID FILE EXPORT REQUEST");
            let postArr = await Post.getPostById(req.params.id);
            await forwardFile(postArr[0], req, res);
            break;

        case EERR_STAT:    // if input validation not passed or wrong data format recieved - send appropriate 400 bad request
            res.status(C400).json({"status": "error", "message": "malformed request"});
            console.error(`--INVALID FILE INPUT: ${result}`);
            break;

    }
});

// export to other journal (meta data)
router.get('/:id/metadata', async (req, res) => {
    const result = validateExportGET(req);
	console.log(req);
    let err = verifyJWT(req);
    if (err != null) 	
            res.status(C400).json({"status": "error", "message": "bad token"});
    switch (result.status) {
        case SUCC_STAT:     // if input validation passed - process request
            console.log("-- VALID METADATA EXPORT REQUEST");
            let postArr = await Post.getPostById(req.params.id);
	    //let post = await Journal.getJournalById(postArr[0].id);
//console.log(postArr[0].id);
//	    console.log(post);
            await forwardMetaData(res, postArr[0]);
            break;

        case EERR_STAT:    // if input validation not passed or wrong data format recieved - send appropriate 400 bad request
            res.status(C400).json({"status": "error", "message": "malformed request"});
            console.error(`--INVALID METADATA EXPORT INPUT: ${result}`);
            break;

        case UERR_STAT:   // 500 internal server error - error not a result of client input
            res.status(C500).json({"status": "error", "message": "Internal Server Error"});
            console.error(`-- SERVER METATDATA EXPORT ERROR: ${result}`);
            break;
    }
});

/**
 * Initialises and comences content migration to another journal.
 * attempts to send a POST request to another journals server /import/.
 *
 * @param {Request} req migrate content request FROM THE CLIENT
 * @param {Response} res response regarding migration TO THE CLIENT
 */
async function initialiseExport(req, res) {
        const id          = req.body.id;
        const destinationAdd = journals[req.body.destination];
        const destination = `${destinationAdd}/api/sg/resources/import`;   //i think this is meant to be used for the destination address rather than what we have currently
        const data   = {
            from : journals["t03"],
            id   : id,
            token: genToken("I/E")

        };
	const config = {'headers': {"Authorization": `Bearer ${data.token}`}, "params": data};

        // send import request to the other journal and await response
        await sendImportRequest(data, destination, config, res);
}

/**
 * Uses axios to send a POST request to another journal.
 * Handles outcome and returns as a result JSON file.
 *
 * @param {JSON} data data required to fulfil content migration
 * @param {String} destination what journal should accept given content
 * @param {JSON} config axios configuration for JSON data
 * @returns result of POST
 */
async function sendImportRequest(data, destination, config, res) {
    //Error: Request failed with status code 404
    //so destination is bad?
    axios.post(destination, data, config)
         .then((result) => {
		res.status(C200).json(SUCCESS);
		console.log("---IMPORT REQUEST ACCEPTED");
         })
         .catch((error) => {
		res.status(C500).json({"status": "error", "message": "Could not migrate contents."});
		console.error(`----IMPORT REQUEST ERROR: ${error}`);
         });
}

/**
 * Sends the actual file from /Files/ filespace as a response to requesting journal.
 * @param {Response} res response to other journal
 * @returns {Promise<void>}
 */
async function forwardFile(post, req, res) {
    	try {
		filePath = path.resolve(filePath)
		let data = fs.readFileSync(filePath).toString();; 
        	var zip = new JSZip();
		zip.file("data", data);
		let address = "/home/cs3099user03/Documents/project-code/Deliverable2/src/back-end/Server/routes/sg/resources/data.zip";
		let promise = await zip.generateAsync({type: "uint8array", compression: "DEFLATE"}).then(function(content) {
			fs.writeFileSync(address, content);
		});
		res.status(C200).sendFile(address);
		console.log("---FORWARD FILE SUCCESS");
    	} catch (error) {
        	res.status(C500).json({"status": "error", "message": "Internal Server Error"});
        	console.error(`----FORWARD FILE FAILURE: ${error}`);
    	}
}

/**
 * Sends the file metadata from the database as a JSON response to requesting journal.
 * @param {Response} res response to other journal
 * @returns {Promise<void>}
 */
async function forwardMetaData(res, post) {

    try {
        // retirve the post and its comments (if any)
        let postComments = await Comment.getCommentByPost(post);
        // required metadata according to supergroup api documentation https://app.swaggerhub.com/apis/feds01/supergroup-c_api/1.0.0#/resources/get_api_sg_resources_export__id__metadata
        let desc;
	if (post.slug === null){
		desc = "I have no introduction!";	
	}
	else {
		desc = post.slug;
	}
        const publication = {
                name        : post.id,
                title       : post.title,
                owner       : post.user.id,
                introduction: desc,
                revision    : "v1.0.0",
                collaborators: [] 
        };
	let count = 0;
	var comments = [];
	let reviews = [];
	if (postComments.length > 0 ) {

		for (const comment of postComments) {
			comments.push(
				{
					"id": count,
					"contents": comment.body,
					"author": comment.user.id,
					"postedAt":new Date(comment.create_date).getTime()
				}
			);
			count++;
		}
        	reviews = [{
			"createdAt": new Date(postComments[0].create_date).getTime(),
			"owner": postComments[0].user.id,
			"comments": comments 
		}];
	}
	console.log("---FORWARD METADATA SUCCESS");
  	res.status(C200).json({"status": "ok", "publication": publication, "reviews": reviews});
       // res.status(C200).json({"status": "ok", "publication": publication, "reviews": []});

    } catch (error) {
        res.status(C500).json({"status": "error", "message": "Internal Server Error"});
        console.error(`----FORWARD METADATA FAILURE: ${error}`);
    }
}

/**
 * Validates the input data for the export GET handlers and handles errors
 * Used to validate request to migrate both file and file metadata
 * @param {Request} req Request from other journal
 * @returns json object showing result of validation in format {"status": "...", "message" : "..."}
 */
function validateExportGET(req) {
    let result;
    try {
        checkPostID(req.params.id);                   // only got id to validate
        result = {                                  // validation passed without error - input is valid
            status : SUCC_STAT,
            message: "SUCCESS"
        };
    } catch (error) {
        result = universalErrorHandling(error);     // handles the error and returns appropriate response
    }
    return result;
}

/**
 * Validates the input parameters that allow for the initialisation of exporting to another journal.
 * @param {Request} req request from client
 */
async function validateExportInit(req) {
    let result;
    try {
        await checkPostID(req.body.id);
        checkDestination(req.body.destination);

        result = {                                  // validation passed without error - input is valid
            status : SUCC_STAT,
            message: "SUCCESS"
        };

    } catch (error) {
        result = universalErrorHandling(error);     // handles the error and returns appropriate response
    }
    return result;
}

/**
 * Checks if the post to be exported has been sent and actually exists in the database.
 * @param {String} id
 * @throws validation error if input is invalid.
 */
async function checkPostID(id) {

    if (id === undefined) {
        throw new ValidationError("the id is blank");
    }

    // check if id is present in the post database
    let postArr = await Post.getPostById(id);
    if (postArr.length === 0) {
        throw new ValidationError(`id not found in database: ${id}`);
    }
    filePath = postArr[0].filePath;             // set file path
}

/**
 * Checks if a valid export target was chosen.
 * We can only export to valid team URLs in our supergroup.
 * @param {String} exportDestination
 * @throws validation error if input is invalid.
 */
function checkDestination(exportDestination) {
    let valid = false;
    // compare export desitination to list of valid destinations
    if (exportDestination in journals) {
        valid = true;
    }
    if (!valid) {
        throw new ValidationError(`invalid target for export.`);
    }
}

export default router;

