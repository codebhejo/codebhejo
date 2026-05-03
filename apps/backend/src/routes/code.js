import express from "express";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import { optionalAuth } from "../middleware/auth.js";
import { db } from "../config/db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const BUCKET = process.env.S3_BUCKET;

router.get("/:fileId", optionalAuth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    const data = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: fileId,
      })
    );

    const content = await data.Body.transformToString();
    let fileName = null;
    
    const [rows] = await db.query(
      `
      SELECT name FROM files WHERE file_id = ? LIMIT 1
      `,
      [fileId]
    );

    if (rows.length) {
      fileName = rows[0].name;
    }
    
    res.json({ name: fileName, content: content });
  
  } catch (error) {
    res.status(404).json({
      status: false,
      message: error.message,
    });
  }
});

router.post("/sign-upload", optionalAuth, async (req, res) => {
  try {
    const {fileId, fileName, contentType} = req.body;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${fileId}`,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3, command, {expiresIn: 60});
    
    if (req.user) {
      await db.query(
        `
        INSERT INTO files (user_id, file_id, name)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = ?, updated_at = NOW()
        `,
        [req.user.userId, fileId, fileName, fileName]
      );
    }


    res.json({ signedUrl });

  } catch (error) {
    res.json({status: false, message: error.message});
  }
});

router.post("/files", auth, async(req, res) =>{
   try {
    let rows;
    
    if (req.user) {
      [rows] = await db.query(
        `
        SELECT file_id, name, created_at, updated_at
        FROM files
        WHERE user_id = ?
        ORDER BY updated_at DESC
        `,
        [req.user.userId]
      );
    }

    res.json({
      status: true,
      files: rows,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
});

router.delete("/:fileId", auth, async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Ensure the user owns this file before deleting
    const [rows] = await db.query(
      `SELECT user_id FROM files WHERE file_id = ?`,
      [fileId]
    );

    if (!rows.length || rows[0].user_id !== req.user.userId) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to delete this file.",
      });
    }

    // Delete from S3
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: fileId,
      })
    );

    // Delete from database
    await db.query(`DELETE FROM files WHERE file_id = ?`, [fileId]);

    res.json({
      status: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
});

export default router;
