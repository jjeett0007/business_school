import nodemailer from "nodemailer";
import { config } from "../config/index.js";

const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: true,
  auth: {
    user: config.email.smtp.auth.username,
    pass: config.email.smtp.auth.password
  }
});

if (config.env !== "test") {
  transporter
    .verify()
    .then(() => console.log("Connected to SMTP SERVER"))
    .catch((error) =>
      console.error("Failed to connect to SMTP SERVER", error)
    );
}

const sendEmail = async (to: any, subject: string, html: string) => {
  const msg = { from: config.email.from, to, subject, html };
  await transporter.sendMail(msg);
};

export { transporter, sendEmail };
