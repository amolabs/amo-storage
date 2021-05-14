import {getPromise, runPromise} from "./utils";
import _sqlite3 from 'sqlite3';
_sqlite3.verbose()
let db: _sqlite3.Database;

export interface Ownership {
    parcel_id: string
    owner: string
}

export interface Metadata {
    parcel_id: string
    parcel_meta: string
}

async function getOwnership(parcelId: string): Promise<Ownership> {
    return new Promise(async (resolve, reject) => {
        try{
            const query = `SELECT * FROM ownership WHERE parcel_id = ?`
            const params = [parcelId]
            const row = await getPromise(db, query, params)
            if (!row) {
                return reject(`parcel id ${parcelId} not found`);
            }
            return resolve(row);
        }catch (error) {
            return reject(error);
        }
    })
}

async function getMetadata(parcelId: string): Promise<Metadata> {
    return new Promise(async (resolve, reject) => {
        try{
            const query = `SELECT * FROM metadata WHERE parcel_id = ?`
            const params = [parcelId]
            const row = await getPromise(db, query, params)
            if (!row) {
                return reject(`parcel id ${parcelId} not found`);
            }
            return resolve(row);
        }catch (error) {
            return reject(error);
        }
    })
}

function saveParcelInfo(parcelId: string, owner: string, metadata: string) {
    db.run("BEGIN")
    Promise.all([saveOwnership(parcelId, owner), saveMetadata(parcelId, metadata)])
        .then(() => db.run("commit"))
        .catch(error => {
            db.run("rollback")
            throw {
                code: 500,
                message: "Error occurred on saving ownership and metadata"
            }
        })
}

function deleteParcelInfo(parcelId: string) {
    db.run("BEGIN")
    Promise.all([deleteOwnership(parcelId), deleteMetadata(parcelId)])
        .then(() => db.run("commit"))
        .catch(error => {
            db.run("rollback")
            throw {
                code: 500,
                message: "Error occurred on deleting ownership and metadata"
            }
        })
}

async function saveOwnership(parcelId: string, owner: string) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const query = `INSERT INTO ownership (parcel_id,owner) VALUES (?,?)`
            const params = [parcelId, owner]
            await runPromise(db, query, params)
            return resolve()
        } catch (error) {
            reject(error)
        }
    })
}

async function saveMetadata(parcelId: string, metadata: string) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const query = `INSERT INTO metadata (parcel_id,parcel_meta) VALUES (?,?)`
            const params = [parcelId, metadata]
            await runPromise(db, query, params)
            return resolve()
        } catch (error) {
            reject(error)
        }
    })
}

async function deleteMetadata(parcelId: string) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const query = `DELETE FROM metadata WHERE parcel_id=?`
            const params = [parcelId]
            await runPromise(db, query, params)
            return resolve()
        } catch (error) {
            reject(error)
        }
    })
}

async function deleteOwnership(parcelId: string) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const query = `DELETE FROM ownership WHERE parcel_id=?`
            const params = [parcelId]
            await runPromise(db, query, params)
            return resolve()
        } catch (error) {
            reject(error)
        }
    })
}

export {
    getOwnership,
    getMetadata,
    saveParcelInfo,
    saveOwnership,
    saveMetadata,
    deleteMetadata,
    deleteOwnership,
    deleteParcelInfo
}