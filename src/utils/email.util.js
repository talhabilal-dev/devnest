import { Resend } from "resend";
import { generateEmailTemplate } from "../../email/template.js";
import ENV from "../config/env.config.js";

const resend = new Resend(ENV.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  title,
  message,
  buttonText,
  buttonUrl,
}) => {
  try {
    const htmlContent = generateEmailTemplate({
      title,
      message,
      buttonText,
      buttonUrl,
    });

    const data = await resend.emails.send({
      from: `DEVNest <${ENV.EMAIL_FROM}>`,
      to,
      subject,
      html: htmlContent,
    });

    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email could not be sent");
  }
};
