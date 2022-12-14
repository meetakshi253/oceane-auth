import { User } from "@prisma/client";
import prisma from "../prisma";
import express from "express";
import { respond } from "../lib/request-response";
import * as ERROR from "../lib/errors";
import jwt_decode from "jwt-decode";
import { GoogleJWT } from "../types";
import authMiddleware from "../lib/authMiddleware";

const route = express();
var jwt = require("jsonwebtoken");

function createJwt(id: User["id"]) {
	return jwt.sign({ userid: id }, process.env.JWT_SECRET, {
		expiresIn: 10 * 365 * 24 * 60 * 60,
	});
}

route.post("/login", async (req: any, res: any, next) => {
	const { value, error } = req.body;
	if (!value || !value.google_jwt) {
		respond(res, req, 400, ERROR.BAD_INPUT);
		return;
	}

	const user_google_object: GoogleJWT = jwt_decode(value.google_jwt);
	console.log("Google JWT", user_google_object);

	//first check if the user exists, if not, create the user and return jwt token
	let user: User | null;
	try {
		let jwttoken = null;
		user = await prisma.user.findUnique({
			where: {
				email: user_google_object.email,
			},
		});

		//if user exists, get check if jwt is valid, if not, create new jwt
		if (user) {
			const token = await prisma.jwtTokens.findFirst({
				where: { userId: user.id },
			});

			if (token && token.token) {
				jwttoken = token.token;
				jwt.verify(
					jwttoken,
					process.env.JWT_SECRET,
					function (err: any, decoded: any) {
						if (err) {
							jwttoken = createJwt(token.userId);
							prisma.jwtTokens.update({
								where: { id: token.id },
								data: { token: jwttoken },
							});
						}
					}
				);
			}
		}

		//if user does not exist, create the user
		if (!user) {
			user = await prisma.user.create({
				data: {
					email: user_google_object.email,
					name: user_google_object.name,
					picture: user_google_object.picture,
				},
			});
		}

		if (jwttoken == null) {
			jwttoken = createJwt(user.id);
			await prisma.jwtTokens.create({
				data: {
					token: jwttoken,
					userId: user.id,
				},
			});
		}

		respond(res, req, 200, "Login successful", {
			jwt: jwttoken,
			picture: user_google_object.picture,
			username: user.name,
			email: user.email,
		});
	} catch (err) {
		console.log("error", err);
		if (!value.email) {
			respond(res, req, 500, ERROR.INTERNAL_ERROR);
		}
		return;
	}
});


route.get("/user", authMiddleware, async (req: any, res: any, next) => {
		//fetch user from database corresponding to the token
		let user: any;
		try {
			user = await prisma.user.findFirst({
				where: { id: req.user },
			});

			user
				? respond(res, req, 200, "Fetched user details successfully", {
						id: user.id,
						name: user.name,
						email: user.email,
						picture: user.picture,
				  })
				: respond(res, req, 400, ERROR.BAD_REQUEST);
		} catch (err) {
			console.log(err)
			respond(res, req, 500, ERROR.INTERNAL_ERROR);
		}
});

export default route;
