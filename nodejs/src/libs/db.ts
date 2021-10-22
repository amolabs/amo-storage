import path from 'path'
import _sqlite3, {Database} from 'sqlite3'
import utils from '../libs/utils'
const sqlite3 = _sqlite3.verbose()
const DEFAULT_DB_PATH = path.join(__dirname,'../data', 'amo_storage.db' )
let db: _sqlite3.Database


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
  try {
    if (db) {
      console.log('closing previous db');
      db.close()
    }

    db = new sqlite3.Database(dbPath);
    console.log(`connected to files DB: ${dbPath}`);


    return db
  } catch (error) {
    throw error
  }
}
async function createTable(db: _sqlite3.Database){
  try {
    await runPromise(db, createMetadataSql)
    await runPromise(db, createOwnershipSql)
    return Promise.resolve()
  } catch (error) {
    Promise.reject(error)
  }
}

function getConnection() {
  return db
}

async function runPromise(connection: Database, query: string, params?: any): Promise<number> {
  return new Promise(function(resolve, reject) {
    connection.run(query, params, function (err) {
      if (err) {
        return reject(err.message)
      }
      return resolve(this.lastID)
    })
  })
}

async function getPromise(connection: Database, query: string, params?: any): Promise<any> {
  return new Promise(function(resolve, reject) {
    connection.get(query, params, (err, row) => {
      if (err) {
        return reject(err.message)
      }
      return resolve(row)
    })
  })
}

export default {
  init,
  getConnection,
  createTable,
  runPromise,
  getPromise
}