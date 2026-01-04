export class Mailer {
  async send({ to, subject, html, text }) {
    throw new Error("send() must be implemented");
  }
}
