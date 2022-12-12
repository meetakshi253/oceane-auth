import jwt from "jsonwebtoken";
import { respond } from "./request-response";
import * as ERROR from "./errors";

const secret = process.env.JWT_SECRET || "EMPTY_SECRET";

const authMiddleware = (req: any, res: any, next: any) => {
    let token = req.headers["authorization"];

    if (!token) return respond(res, req, 401, ERROR.UNVERIFIED_ACCOUNT);
    token = token.substring(7);

    jwt.verify(token, secret, function (err: any, payload: any) {
        if (err || !payload?.userid) return respond(res, req, 401, ERROR.UNVERIFIED_ACCOUNT);
        req.token = token;
        req.tokenPayload = payload;
        req.user = payload.userid;
    });
    next();
};

export default authMiddleware;
