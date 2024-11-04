import express from "express";
import multer from "multer";

import * as service from "./service.js";

const router = express.Router();
/* 
	Multer settings
 */

const fileFilter = (req, file, cb) => {
	const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error("Only .jpeg, .jpg, and .png files are allowed"), false);
	}
};
const storage = multer.memoryStorage();
const limits = { fileSize: 2 * 1024 * 1024 };
const upload = multer({ storage: storage, fileFilter, limits });

router.post(
	"/image-analysis",
	upload.single("image"),
	async (req, res, next) => {
		try {
			const file = req.file?.buffer;
			const user = { skinType: req.body?.skinType || "oily" };
			if (!file) return res.status(404).send();
			const result = await service.uploadImage(file, user);
			res.send(result);
		} catch (error) {
			console.error(error.message);
			res.status(404).send();
		}
	}
);

router.post("/upload-data", async (req, res, next) => {
	try {
		await service.uploadData();
		res.send("Database populated!");
	} catch (error) {
		res.status(404).send(error.message);
	}
});

router.post("/generate-embeddings", async (req, res, next) => {
	try {
		await service.createEmbeddings();
		res.send("Embeddings created.");
	} catch (error) {
		console.error(error.message);
		res.status(404).send();
	}
});

export default router;
