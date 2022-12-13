import "dotenv/config";
import express, { Request } from "express";
import { json } from "body-parser";
import { respond } from "./lib/request-response";
import auth from "./routes/auth";
import cors from "cors";

const app = express();

const port = process.env.PORT || "8080";

//app.set("trust proxy", true);

app.use(cors());

const parseJson = json({ limit: "1mb" });
app.use((req, res, next) => parseJson(req, res, next));

app.use("/auth", auth);
app.get("/", async (req, res, next) => {
	respond(res, req, 200, "API Running");
});

// Catch all uncaught routes and 404
app.all("*", (req, res, next) => {
	respond(res, req, 404, "Route not found for request");
});

app.listen(process.env.PORT, () => {
	console.log("Listening on port", process.env.PORT);
});
