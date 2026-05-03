import nodemailer from "nodemailer";
import { Mailer } from "../Mailer.js";

export class SmtpMailer extends Mailer {
  constructor() {
    super();
    this.transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: false,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  async send({ to, subject, html, text }) {
    return this.transport.sendMail({
      from: `"CodeBhejo" <${process.env.MAIL_FROM}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text,
    });
  }
}
