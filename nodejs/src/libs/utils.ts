import {Database} from "sqlite3";

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

export {
 runPromise,
 getPromise
}