import {Request} from "express"

export function validateFormData(req: Request) {
  let owner = req.body.owner
  let metadata = req.body.metadata
  let file = req.file

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
}