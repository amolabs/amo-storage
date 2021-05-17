import {NextFunction, Request, Response} from "express";

export function validateFormData(req: Request, res: Response, next: NextFunction) {
  let owner = req.body.owner
  let metadata = req.body.metadata
  let file = req.file

  try {
    if (!owner) {
      throw {
        code: 400,
        message: "'owner' field is missing"
      }
    }

    if (Object.keys(metadata).length === 0) {
      throw {
        code: 400,
        message: "'metadata' field is missing"
      }
    }

    if (Object.keys(file).length === 0) {
      throw {
        code: 400,
        message: "'file' field is missing"
      }
    }
    next()
  } catch (error){
    res.status(error.code).send(JSON.stringify({"error": error.message}))
  }
}