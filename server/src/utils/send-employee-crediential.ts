import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmployeeDetailsEmail(
  email: string,
  firstName: string,
  password: string,
  companyName: string
) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, message: "RESEND_API_KEY is not configured" };
  }

  const from = process.env.RESEND_FROM;
  if (!from) {
    return { success: false, message: "RESEND_FROM is not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: `Welcome to ${companyName}! Your Account Details`,
      text: `Hello ${firstName},\n\nYou have been added as an employee at ${companyName}.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease sign in and change your password for security reasons.\n\nSign in: https://workspace.taskforges.com/sign-in`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background-color: #4CAF50; padding: 15px; border-radius: 10px 10px 0 0;">
            <h2 style="color: #ffffff; margin: 0;">Welcome to ${companyName} 🎉</h2>
          </div>

          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #333;">Dear <strong>${firstName}</strong>,</p>
            <p style="font-size: 14px; color: #555;">
              You have been added as an employee at <strong>${companyName}</strong>. Below are your login credentials:
            </p>

            <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>

            <p style="font-size: 14px; color: #555; margin-top: 10px;">
              Please log in and change your password for security reasons.
            </p>

            <div style="text-align: center; margin-top: 20px;">
              <a href="https://workspace.taskforges.com/sign-in" target="_blank" style="
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                font-size: 16px;
                border-radius: 5px;">
                Login Now
              </a>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 10px; text-align: center; background: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 12px; color: #888;">If you did not request this, please contact HR at ${companyName}.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend employee email error:", error);
      return { success: false, message: error.message || "Failed to send email" };
    }

    return { success: true, message: `Email sent: ${data?.id}` };
  } catch (networkError) {
    console.error("Resend employee email network error:", networkError);
    return {
      success: false,
      message: networkError instanceof Error ? networkError.message : "Failed to send email",
    };
  }
}
