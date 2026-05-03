import { auth } from "./auth.js";
import { db } from "../config/db.js";

export function adminAuth(req, res, next) {
  auth(req, res, async () => {
    const [[user]] = await db.query(
      "SELECT is_admin FROM users WHERE id = ?",
      [req.user.userId]
    );
    if (!user?.is_admin) return res.sendStatus(403);
    next();
  });
}
