interface Operation {
    name: string
    id?: string
    hash?: string
}

export interface Auth {
    user: number
    operation: Operation
    iss?: string
    jti?: string
}