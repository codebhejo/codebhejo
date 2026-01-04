import { SendEmailCommand } from "@aws-sdk/client-ses";
import { Mailer } from "../Mailer.js";
import { SESClient } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION
});

export class SesMailer extends Mailer {
  async send({ to, subject, html, text }) {
    const params = {
      Source: `"CodeBhejo" <${process.env.MAIL_FROM}>`,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: text ? { Data: text, Charset: "UTF-8" } : undefined
        }
      }
    };

    return sesClient.send(new SendEmailCommand(params));
  }
}
