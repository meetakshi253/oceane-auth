import { User } from "@prisma/client"
import prisma from "../prisma"
import express from "express"
import { respond } from "../lib/request-response";
import * as ERROR from "../lib/errors";

const route = express();
var jwt = require('jsonwebtoken');

function createJwt(id: User["id"]) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: 24 * 60 * 60,
    });
}

route.post("/login", async (req: any, res: any, next) => {
    const { value, error } = req.body;
    if (!value || !value.email || !value.name) {
        respond(res, req, 400, ERROR.BAD_INPUT);
        return;
    }

    //first check if the user exists, if not, create the user and return jwt token
    let user: User | null;
    try {
        let jwttoken = null;
        user = await prisma.user.findUnique({
            where: {
                email: value.email
            }
        })

        //if user exists, get check if jwt is valid, if not, create new jwt
        if (user) {
            const token = await prisma.jwtTokens.findFirst({
                where: { userId: user.id },
            })

            if (token && token.token) {
                jwttoken = token.token;
                jwt.verify(jwttoken, process.env.JWT_SECRET, function (err: any, decoded: any) {
                    if (err) {
                        jwttoken = createJwt(token.userId);
                        prisma.jwtTokens.update({
                            where: { id: token.id },
                            data: { token: jwttoken }
                        })
                    }
                });
            }
        }

        //if user does not exist, create the user
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: value.email,
                    name: value.name
                }
            })
        }

        if (jwttoken == null) {
            jwttoken = createJwt(user.id);
            await prisma.jwtTokens.create({
                data: {
                    token: jwttoken,
                    userId: user.id
                }
            })
        }

        respond(res, req, 200, "Login successful", { jwt: jwttoken });
    }

    catch (err) {
        console.log(err);
        if (!value.email) {
            respond(res, req, 500, ERROR.INTERNAL_ERROR);
        }
        return;
    }
});

export default route;