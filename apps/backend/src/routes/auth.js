import express from "express";
import crypto from "crypto";
import { resolveMx } from "dns/promises";
import { db } from "../config/db.js";
import jwt from "jsonwebtoken";
import { createMailer } from "../mail/MailService.js";
import { signinLinkEmail } from "../mail/templates/signinLink.js";
import { formatDateTime } from "../utils/datetime.js";
import {auth} from "../middleware/auth.js"

const router = express.Router();
const mailer = createMailer();

async function isValidEmailDomain(email) {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

router.post("/request-link", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email required" });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email address" });

  if (!await isValidEmailDomain(email)) return res.status(400).json({ error: "Email domain does not exist" });

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await db.query(
    `INSERT INTO login_tokens (email, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
    [email, tokenHash]
  );

  const link = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
  
  await mailer.send({
    to: email,
    subject: `Your CodeBhejo sign-in link - ${formatDateTime()}`,
    html: signinLinkEmail({link}),
    text: `Sign in using this link: ${link}`
  });

  res.json({ message: "Login link sent to " });
});

router.get("/verify", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.sendStatus(400);

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  
  const [[record]] = await db.query(
    `SELECT * FROM login_tokens
     WHERE token_hash = ? AND used = false AND expires_at > NOW()`,
    [tokenHash]
  );

  if (!record) return res.sendStatus(401);

  await db.query(
    "UPDATE login_tokens SET used = true WHERE id = ?",
    [record.id]
  );

  // Create user on first verified sign-in, or fetch existing
  const [[existing]] = await db.query(
    "SELECT id FROM users WHERE email = ?",
    [record.email]
  );

  let userId;
  if (existing) {
    userId = existing.id;
  } else {
    const [result] = await db.query(
      "INSERT INTO users (email) VALUES (?)",
      [record.email]
    );
    userId = result.insertId;
  }

  await db.query(
    "UPDATE users SET last_login_at = NOW() WHERE id = ?",
    [userId]
  );

  const jwtToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  
  res.cookie("auth_token", jwtToken, {
    httpOnly: true,
    secure: true,        // true in production (HTTPS)
    sameSite: "none",      // "none" + secure:true if cross-site HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.sendStatus(200);
});

router.get("/me", auth, async (req, res) => {
  try {
      const [rows] = await db.query(
          `
          SELECT email, is_admin
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [req.user.userId]
        );
      
      return res.json({
        loggedIn: true,
        userId: req.user.userId,
        email: rows[0].email,
        isAdmin: !!rows[0].is_admin,
      });
  } catch {
    return res.sendStatus(401);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    sameSite: "none",
    secure: true, // true in production
  });

  res.sendStatus(200);
});

export default router;