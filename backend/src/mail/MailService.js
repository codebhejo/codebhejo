import { SesMailer } from "./providers/ses.mailer.js";

export function createMailer() {
  switch (process.env.MAIL_PROVIDER) {
    case "ses":
      return new SesMailer();
    default:
      throw new Error("Invalid MAIL_PROVIDER");
  }
}
