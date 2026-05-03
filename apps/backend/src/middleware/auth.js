import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const token = req.cookies?.auth_token;
  
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies?.auth_token;
  
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = null;
  }

  next();
}
