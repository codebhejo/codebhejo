import express from "express";
import { db } from "../config/db.js";
import { s3 } from "../config/s3.js";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { adminAuth } from "../middleware/admin.js";

const router = express.Router();

async function countS3Files() {
  let count = 0;
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      ContinuationToken: token,
    }));
    count += res.KeyCount || 0;
    token = res.NextContinuationToken;
  } while (token);
  return count;
}

router.get("/users", adminAuth, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const search = req.query.search?.trim() || "";
    const offset = (page - 1) * limit;

    const where  = search ? "WHERE u.email LIKE ?" : "";
    const params = search ? [`%${search}%`] : [];

    const [
      [[{ total }]],
      [[{ dbFileCount }]],
      [[{ verifiedUsers }]],
      [[{ totalFiles }]],
      [users],
      s3FileCount,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM users u ${where}`, params),
      db.query("SELECT COUNT(*) AS dbFileCount FROM files"),
      db.query("SELECT COUNT(*) AS verifiedUsers FROM users WHERE last_login_at IS NOT NULL"),
      db.query("SELECT COUNT(*) AS totalFiles FROM files"),
      db.query(
        `SELECT
           u.id,
           u.email,
           u.is_admin,
           u.last_login_at,
           u.created_at,
           COUNT(f.id) AS file_count
         FROM users u
         LEFT JOIN files f ON f.user_id = u.id
         ${where}
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      countS3Files(),
    ]);

    res.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      anonymousFileCount: Math.max(0, s3FileCount - dbFileCount),
      dashboardStats: { totalUsers: total, verifiedUsers, totalFiles },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
