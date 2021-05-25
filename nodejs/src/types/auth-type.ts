interface Operation {
  name: string
  id?: string
  hash?: string
}

export interface Auth {
  user: string
  operation: Operation
  iss?: string
  jti?: string
}