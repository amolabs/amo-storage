import path from 'path'
import _sqlite3 from 'sqlite3';
import {runPromise} from '../libs/utils'
const sqlite3 = _sqlite3.verbose()

let db: _sqlite3.Database
const DEFAULT_DB_PATH = path.join(__dirname,'../data', 'amo_storage.db' )

const createMetadataSql = `
  CREATE TABLE IF NOT EXISTS metadata (
    parcel_id TEXT PRIMARY KEY,
    parcel_meta TEXT
  )
`

const createOwnershipSql = `
  CREATE TABLE IF NOT EXISTS ownership (
    parcel_id TEXT PRIMARY KEY,
    owner TEXT
  )
`

function init(dbPath= DEFAULT_DB_PATH) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (db) {
                console.log('closing previous db');
                db.close();
            }

            db = new sqlite3.Database(dbPath);
            console.log(`connected to files DB: ${dbPath}`);

            await runPromise(db, createMetadataSql)
            await runPromise(db, createOwnershipSql)
        } catch (err) {
            return reject(err);
        }
    })
}



export default {
    init
}