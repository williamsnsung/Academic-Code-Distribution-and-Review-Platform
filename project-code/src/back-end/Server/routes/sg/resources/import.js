import express			from 'express';
import {Post}                   from "../../../../Database/utils/post.js";
import fs from "fs";
import {
    C200,
    C400,
    C500,
    EERR_STAT,
    SUCC_STAT,
    UERR_STAT,
}						from "../../../util.js";
import axios			from 'axios';
let router = express.Router();
import {Journal}                   from "../../../../Database/utils/journal.js";
import JSZip from 'jszip';
import {genUUID} from '../../../utils/generator.js';
import {User} from "../../../../Database/utils/user.js";


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
}
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


// https://docs.google.com/document/d/17SNjEcgshsMUlfOPDuVybBYBb861sP60ql5bkp4WgCg/edit
// https://app.swaggerhub.com/apis/feds01/supergroup-c_api/1.0.0#/resources/post_api_sg_resources_import

// receive import request from a journal
// verify request data
// send first get request to ask for the actual publication file, receive either application/zip or text/plain mime type
// verify retrieved publication file
// send second get request to ask for post data, receive JSON file containing the data
// verify the received JSON file
// create the post on our database if everything checks out


router.post('/', async (req,res) => {
        //res.status(C200).json(SUCCESS);
	//request contains
	//	string from detailing which journal its from
	//	string token which is a bearer token allowing you to request data from the journal
	//	string id which contains the id of the post we are wanting to retrieve
	console.log("---IMPORT REQUEST ARRIVED");
	const from = req.query.from;
	const token = req.query.token;	// https://stackoverflow.com/questions/25838183/what-is-the-oauth-2-0-bearer-token-exactly/25843058
	const id = req.query.id;
	console.log(token);
	console.log(id);
	const configFile = {'headers': {"Authorization": `Bearer ${token}`}, 'responseType':'arraybuffer'};
	const config = {'headers': {"Authorization": `Bearer ${token}`}};
    try {
		// verifying request data
		if (checkFrom(from) && isDefined(token) && isDefined(id)) {
			// performing request for the publication file and post metadata
			var resFile = await importFile(from, id, configFile);
			console.log("---FILE EXPORTED SUCCESSFULLY");
			var resPost = await importPost(from, id, config);
			console.log("---METADATA EXPORTED SUCCESSFULLY");
			// verify both requests succeeded
			if (resFile.status === 200 && resPost.status === 200) {
				// the below object is assuming the json structure as it is actually not yet established 
				//https://stackoverflow.com/questions/39322964/extracting-zipped-files-using-jszip-in-javascript
				resPost = resPost.data;
				resFile = resFile.data;
				await upload(resFile, resPost, from ,config, res, id);
			}
			else {
				let err = "File/Post import failed"
            		console.error(`----IMPORT FAILURE: ${err}`);
			}

		}
	} catch (e) {
            console.error(`----IMPORT FAILURE: ${e}`);
	}
});

async function upload(file, metadata, from, config, res, id) {
	console.log("---UPLOADING...");
	const data = {
		userid: metadata.publication.name,
		title: metadata.publication.title,
		description: metadata.publication.introduction,
		tags: [],
		files	: {},
		post_descriptions:{} 
	};
	console.log("---BEFORE TRY");
	try {
		console.log("---ENTERED TRY");
		let postArr = await Post.getPostById(metadata.publication.name);
		console.log("---GOT POST RES");
		if (postArr.length != 0) {
			res.status(C400).json({"status":"error", "message":"post already exists!"});
			throw "UPLOAD FAILURE: Post already exists!";
		}
		console.log("Uploading now!");
		const journalId = genUUID(data.title).split(':')[0];
		const dir = `/home/cs3099user03/Documents/project-code/src/Journals/${journalId}`;
		fs.mkdirSync(dir);
		const date = new Date();
		const foreignUser = '1648740-ybd7bh-816044:t03';
		const users = await User.getUserByID(foreignUser);
		const journal = new Journal (journalId, users[0], data.title, data.description, dir, date, date, null, data.tags);
		console.log(journal);
		await journal.insert(); 
		await JSZip.loadAsync(file).then(function (zip) {
			Object.keys(zip.files).forEach(function (filename) {
				zip.files[filename].async('string').then(async function (fileData) {
					let name = filename.match(new RegExp('[^\/]+$'));
					if (name != null) {
						fs.writeFileSync(`${dir}/${name}`,fileData);
						const post = new Post(`${genUUID(name)}`, users[0], '0', `${data.userid}: ${name}`, name, 'No Description', true, date, date,  null, `${dir}/${name}`); 
						await journal.addPost(post);
						/*const comments = metadata.reviews.comments;
						console.log(metadata.reviews);
						console.log(comments);
						if (comments != null) {
							for (const comment in comments) {
								let body = {
									"comment": comment.contents,
									"userId": users[0],
									"postId": `${id}: ${name}`
								};	
								let ret = await axios.post(`${journals[t03]}/api/comment`, body);
							console.log(ret);
							}
						}*/
						
					}
				})
			})
		});
		res.status(C200).json({"status":"ok"});
		console.log("Uploaded!");
	}
	catch (err) {
		console.log(err);
	}
}

async function importFile(from, id, config) {
	var res;
	res = await axios.get(`${from}/api/sg/resources/export/${id}`, config)
		.then((getRes) => {
//			console.log(getRes);
			return getRes;	
		})
		.catch((e) => {
			console.error(`----IMPORT FILE FAILURE: ${e}`);
			return e;
		});
	return res;
}

async function importPost(from, id, config) {
	var res;
	res = await axios.get(`${from}/api/sg/resources/export/${id}/metadata`, config)
		.then((getRes) => {
			//console.log(getRes.data);
			//console.log(getRes.data.reviews);
			return getRes;
		})
		.catch((e) => {
			console.error(`----IMPORT METADATA FAILURE: ${e}`);
			return getRes;
		});
	return res;
}

function isDefined(param) {
	if (param === undefined) {
		console.error(`ERROR UNDEFINED: ${param} is blank`);
	}
	return true;
}

 function checkFrom(from) {
    // compare export desitination to list of valid destinations
    for (var key in journals) {
        if (from === journals[key]) {
            return true;
        }
    }
	console.error(`ERROR INVALID JOURNAL: ${from} does not exist.`);
}


export default router;

