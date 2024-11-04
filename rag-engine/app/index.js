import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

import router from "./router.js";

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(router);

// app.get("/", (req, res) => {
// 	res.sendFile(path.join(__dirndme, "public", "index.html"));
// });

app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
