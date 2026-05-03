import { SesMailer } from "./providers/ses.mailer.js";
import { SmtpMailer } from "./providers/smtp.mailer.js";

export function createMailer() {
  switch (process.env.MAIL_PROVIDER) {
    case "ses":
      return new SesMailer();
    case "smtp":
      return new SmtpMailer();
    default:
      throw new Error("Invalid MAIL_PROVIDER");
  }
}
