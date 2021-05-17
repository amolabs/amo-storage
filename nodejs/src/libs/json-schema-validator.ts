import Ajv from "ajv";
import {schema} from "../schema/auth-schema";

function validateJsonSchema<T>(auth: T) {
  const ajv = new Ajv()
  const validate = ajv.compile(schema)
  if (!validate(auth)) {
    throw validate.errors
  }
}

export default {
  validateJsonSchema
}