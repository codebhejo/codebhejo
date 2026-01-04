import express from "express";

const router = express.Router();

router.post("/session", (req, res) => {
  const room = Math.random().toString(36).substring(2, 8).toUpperCase();
  res.json({ room });
});

export default router;