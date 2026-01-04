import crypto from "crypto";

export function randomFileName(ext = "txt") {
  return crypto.randomBytes(6).toString("hex");
}
