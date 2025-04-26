import express from "express";
import upload from "../utils/multer.js";
import { uploadMedia } from "../utils/cloudinary.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/media/upload-video:
 *   post:
 *     summary: Upload a video
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */         
router.route("/upload-video").post(upload.single("file"), async(req,res) => {
    try {
        const result = await uploadMedia(req.file.path);
        res.status(200).json({
            success:true,
            message:"File uploaded successfully.",
            data:result
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Error uploading file"})
    }
});
export default router;