import {Database} from "sqlite3";
import {Response} from "express";
import {MinIoErrorCode} from '../adapter/exception'
import crypto from "crypto";

async function runPromise(connection: Database, query: string, params?: any): Promise<number> {
 return new Promise(function(resolve, reject) {
	 connection.run(query, params, function (err) {
	 if (err) {
		return reject(err.message);
	 }
	 return resolve(this.lastID);
	});
 });
}

async function getPromise(connection: Database, query: string, params?: any): Promise<any> {
 return new Promise(function(resolve, reject) {
	 connection.get(query, params, (err, row) => {
	 if (err) {
		return reject(err.message);
	 }
	 return resolve(row);
	});
 });
}

function decorateErrorResponse(res: Response, error: any) {
	let code;

	if (error.code && typeof error.code === 'number') {
		switch (error.code) {
			case MinIoErrorCode.ERR_NOT_FOUND:
				code = 404
				break;
			case MinIoErrorCode.ERR_ALREADY_EXIST:
				code = 409
				break;
			case MinIoErrorCode.ERR_S3_INTERNAL:
			case MinIoErrorCode.ERR_NONE_BUCKET:
				code = 500
				break;
			default:
				code = error.code
		}

		res.status(code);
	}
	return res
}


function createParcelId(owner: string, metadata: string, buffer: Buffer) {
	let hash = crypto.createHash('sha256')
	hash.update(owner)
	hash.update(metadata)
	hash.update(buffer)

	return hash.digest('hex').toUpperCase()
}

export default {
 runPromise,
 getPromise,
 decorateErrorResponse,
 createParcelId
}