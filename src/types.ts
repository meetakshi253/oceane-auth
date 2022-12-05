export interface GoogleJWT {
    iss: string,
    nbf: bigint,
    aud: string,
    sub: string,
    hd: string,
    email: string,
    email_verified: boolean,
    azp: string,
    name: string,
    picture: string,
    given_name: string,
    family_name: string,
    iat: bigint,
    exp: bigint,
    jti: string
}