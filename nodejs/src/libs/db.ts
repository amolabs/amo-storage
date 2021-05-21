import path from 'path'
import _sqlite3 from 'sqlite3';
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
      db.close();
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
    await utils.runPromise(db, createMetadataSql)
    await utils.runPromise(db, createOwnershipSql)
    return Promise.resolve()
  } catch (error) {
    Promise.reject(error)
  }
}

function getConnection() {
  return db
}

export default {
  init,
  getConnection,
  createTable
}