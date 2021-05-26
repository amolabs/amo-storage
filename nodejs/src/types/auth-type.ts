interface Operation {
  name: string
  hash?: string
}

export interface Auth {
  user: string
  operation: Operation
  iss?: string
  jti?: string
}