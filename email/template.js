export const generateEmailTemplate = ({
  title,
  message,
  buttonText,
  buttonUrl,
}) => {
  return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #333;">${title}</h2>
        <p style="color: #555;">${message}</p>
        <div style="margin: 20px 0;">
          <a href="${buttonUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            ${buttonText}
          </a>
        </div>
        <p style="font-size: 12px; color: #999;">If you didn't request this, please ignore this email.</p>
      </div>
    `;
};
