import utils from "./utils";
import crypto from 'crypto'
import db from '../libs/db'

export interface Ownership {
  parcel_id: string
  owner: string
}

export interface Metadata {
  parcel_id: string
  parcel_meta: string
}

async function getOwnership(parcelId: string, result?: boolean): Promise<Ownership> {
  try{
    const query = `SELECT * FROM ownership WHERE parcel_id = ?`
    const params = [parcelId]
    const row = await utils.getPromise(db.getConnection(), query, params)
    if (result) {
      return Promise.resolve(row)
    }
    if (row) {
      return Promise.resolve(row)
    } else {
      throw {
        code: 404 ,
        message: `parcel id ${parcelId} not found`
      }
    }
  }catch (error) {
    return Promise.reject(error);
  }
}

async function getMetadata(parcelId: string, result?: boolean) {
  try{
    const query = `SELECT * FROM metadata WHERE parcel_id = ?`
    const params = [parcelId]
    const row = await utils.getPromise(db.getConnection(), query, params)
    if (result) {
      return Promise.resolve(row)
    }
    if (row) {
      return Promise.resolve(row)
    } else {
      throw {
        code: 404 ,
        message: `parcel id ${parcelId} not found`
      }
    }
  }catch (error) {
    Promise.reject(error)
  }
}

async function saveParcelInfo(parcelId: string, owner: string, metadata: string) {
  const connection = db.getConnection()
  try {
    connection.run("BEGIN")
    await saveOwnership(parcelId, owner)
    await saveMetadata(parcelId, metadata)
    connection.run("commit")
    return Promise.resolve()
  } catch (error) {
    connection.run("rollback")
    Promise.reject( {
      code: 500,
      message: "Error occurred on saving ownership and metadata"
    })
  }
}

function deleteParcelInfo(parcelId: string) {
  const connection = db.getConnection()
  connection.run("BEGIN")
  Promise.all([deleteOwnership(parcelId), deleteMetadata(parcelId)])
    .then(() => connection.run("commit"))
    .catch(error => {
      connection.run("rollback")
      throw {
        code: 500,
        message: "Error occurred on deleting ownership and metadata"
      }
    })
}

async function saveOwnership(parcelId: string, owner: string) {
  try {
    const connection = db.getConnection()
    const query = `INSERT INTO ownership (parcel_id,owner) VALUES (?,?)`
    const params = [parcelId, owner]
    await utils.runPromise(connection, query, params)
    return Promise.resolve()
  } catch (error) {
    return Promise.reject(error)
  }
}

async function existsParcelId(parcelId: string) {
  try {
    const ownership: Ownership = await getOwnership(parcelId, true)
    const metadata: Metadata = await getMetadata(parcelId, true);

    return Promise.resolve(ownership && metadata)
  } catch (e) {
    return Promise.reject(e)
  }
}

async function saveMetadata(parcelId: string, metadata: string) {
  try {
    const connection = db.getConnection()
    const query = `INSERT INTO metadata (parcel_id,parcel_meta) VALUES (?,?)`
    const params = [parcelId, metadata]
    await utils.runPromise(connection, query, params)
  } catch (error) {
    throw error
  }
}

async function deleteMetadata(parcelId: string) {
  const connection = db.getConnection()
  return new Promise<void>(async (resolve, reject) => {
    try {
      const query = `DELETE FROM metadata WHERE parcel_id=?`
      const params = [parcelId]
      await utils.runPromise(connection, query, params)
      return resolve()
    } catch (error) {
      reject(error)
    }
  })
}

async function deleteOwnership(parcelId: string) {
  const connection = db.getConnection()
  return new Promise<void>(async (resolve, reject) => {
    try {
      const query = `DELETE FROM ownership WHERE parcel_id=?`
      const params = [parcelId]
      await utils.runPromise(connection, query, params)
      return resolve()
    } catch (error) {
      reject(error)
    }
  })
}


export default {
  getOwnership,
  getMetadata,
  saveParcelInfo,
  saveOwnership,
  saveMetadata,
  deleteMetadata,
  deleteOwnership,
  deleteParcelInfo,
  existsParcelId
}